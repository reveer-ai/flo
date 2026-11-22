import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/flo.js', import.meta.url));
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

function flo(args, cwd) {
  const result = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

const usage = flo([]).stdout;

test('no arguments prints the usage to stdout and exits 0', () => {
  const { code, stdout, stderr } = flo([]);
  assert.equal(code, 0);
  assert.equal(stderr, '');
  assert.match(stdout, /^flo: .+\n/, 'starts with one line saying what flo is');
  assert.match(stdout, /^\s+init\s+Install flo's skills into the current project$/m, 'lists init');
  assert.doesNotMatch(stdout, /no commands/);
  assert.match(stdout, /--help/);
  assert.match(stdout, /--version/);
});

test('--help prints the same usage and exits 0', () => {
  const { code, stdout, stderr } = flo(['--help']);
  assert.equal(code, 0);
  assert.equal(stderr, '');
  assert.equal(stdout, usage);
});

test('--version prints exactly the package version and a newline', () => {
  const { code, stdout, stderr } = flo(['--version']);
  assert.equal(code, 0);
  assert.equal(stderr, '');
  assert.equal(stdout, `${version}\n`);
});

test('an unknown word is an error', () => {
  const { code, stdout, stderr } = flo(['frobnicate']);
  assert.equal(code, 1);
  assert.equal(stdout, '');
  assert.ok(stderr.startsWith('Unknown argument: frobnicate\n'));
  assert.ok(stderr.endsWith(usage), 'the usage follows on stderr');
});

test('an unknown flag is an error', () => {
  const { code, stdout, stderr } = flo(['--nope']);
  assert.equal(code, 1);
  assert.equal(stdout, '');
  assert.ok(stderr.startsWith('Unknown argument: --nope\n'));
});

for (const args of [['--version', 'extra'], ['--help', '--version'], ['--help', 'init'], ['init', 'extra'], ['init', 'init']]) {
  test(`a known flag with extra arguments is an error: ${args.join(' ')}`, () => {
    const { code, stdout, stderr } = flo(args);
    assert.equal(code, 1);
    assert.equal(stdout, '');
    assert.ok(stderr.startsWith(`Unknown argument: ${args.join(' ')}\n`));
  });
}

test('nothing is written for anything but exactly init', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'flo-cli-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, 'existing.txt'), 'unchanged');
  const before = readdirSync(dir, { recursive: true }).sort();

  for (const args of [[], ['--help'], ['--version'], ['frobnicate'], ['--version', 'extra'], ['init', 'extra'], ['--help', 'init']]) {
    flo(args, dir);
  }

  assert.deepEqual(readdirSync(dir, { recursive: true }).sort(), before);
  assert.equal(readFileSync(join(dir, 'existing.txt'), 'utf8'), 'unchanged');
});
