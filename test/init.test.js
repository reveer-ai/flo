import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/flo.js', import.meta.url));
const shipped = fileURLToPath(new URL('../skills/', import.meta.url));
const skillFile = join('.agents', 'skills', 'peer-review', 'SKILL.md');

function flo(args, cwd) {
  const result = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

function project(t) {
  const dir = mkdtempSync(join(tmpdir(), 'flo-init-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

// Every file under a directory, with its contents, so two trees can be compared.
function tree(dir) {
  return Object.fromEntries(
    readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const path = join(entry.parentPath, entry.name);
        return [path.slice(dir.length), readFileSync(path, 'utf8')];
      })
      .sort(),
  );
}

test('flo ships the peer-review skill', () => {
  assert.ok(existsSync(join(shipped, 'peer-review', 'SKILL.md')));
});

test('a fresh project gets every skill in .agents/skills', (t) => {
  const dir = project(t);
  const { code, stderr } = flo(['init'], dir);
  assert.equal(code, 0);
  assert.equal(stderr, '');
  const names = readdirSync(shipped, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  assert.ok(names.length > 0);
  for (const name of names) {
    assert.deepEqual(tree(join(dir, '.agents', 'skills', name)), tree(join(shipped, name)));
  }
});

test('other skills in .agents/skills are left alone', (t) => {
  const dir = project(t);
  mkdirSync(join(dir, '.agents', 'skills', 'other'), { recursive: true });
  writeFileSync(join(dir, '.agents', 'skills', 'other', 'SKILL.md'), 'mine');
  assert.equal(flo(['init'], dir).code, 0);
  assert.deepEqual(tree(join(dir, '.agents', 'skills', 'other')), { '/SKILL.md': 'mine' });
});

test('rerunning restores an edited copy', (t) => {
  const dir = project(t);
  flo(['init'], dir);
  writeFileSync(join(dir, skillFile), 'edited');
  assert.equal(flo(['init'], dir).code, 0);
  assert.equal(
    readFileSync(join(dir, skillFile), 'utf8'),
    readFileSync(join(shipped, 'peer-review', 'SKILL.md'), 'utf8'),
  );
});

test('rerunning removes a stale file from the copy', (t) => {
  const dir = project(t);
  flo(['init'], dir);
  writeFileSync(join(dir, '.agents', 'skills', 'peer-review', 'stale.md'), 'old');
  assert.equal(flo(['init'], dir).code, 0);
  assert.ok(!existsSync(join(dir, '.agents', 'skills', 'peer-review', 'stale.md')));
});

test('with .claude/skills, each skill is linked relatively and both paths are reported', (t) => {
  const dir = project(t);
  mkdirSync(join(dir, '.claude', 'skills'), { recursive: true });
  const { code, stdout, stderr } = flo(['init'], dir);
  assert.equal(code, 0);
  assert.equal(stderr, '');
  const link = join(dir, '.claude', 'skills', 'peer-review');
  assert.ok(lstatSync(link).isSymbolicLink());
  assert.equal(readlinkSync(link), '../../.agents/skills/peer-review');
  assert.ok(existsSync(join(link, 'SKILL.md')), 'the link resolves');
  const lines = stdout.trim().split('\n');
  assert.ok(lines.some((line) => line.includes('.agents/skills/peer-review')));
  assert.ok(lines.some((line) => line.includes('.claude/skills/peer-review')));
});

test('an old link is replaced', (t) => {
  const dir = project(t);
  mkdirSync(join(dir, '.claude', 'skills'), { recursive: true });
  symlinkSync('../elsewhere', join(dir, '.claude', 'skills', 'peer-review'));
  assert.equal(flo(['init'], dir).code, 0);
  assert.equal(
    readlinkSync(join(dir, '.claude', 'skills', 'peer-review')),
    '../../.agents/skills/peer-review',
  );
});

test('.claude/skills is never created', (t) => {
  const dir = project(t);
  mkdirSync(join(dir, '.claude'));
  const { code, stdout } = flo(['init'], dir);
  assert.equal(code, 0);
  assert.ok(!existsSync(join(dir, '.claude', 'skills')));
  assert.ok(!stdout.includes('.claude'));
});

for (const [linked, target] of [['.claude', '.agents'], ['.agents', '.claude']]) {
  test(`${linked}/skills symlinked to ${target}/skills counts as linked`, (t) => {
    const dir = project(t);
    mkdirSync(join(dir, target, 'skills'), { recursive: true });
    mkdirSync(join(dir, linked));
    symlinkSync(`../${target}/skills`, join(dir, linked, 'skills'));
    const { code, stderr } = flo(['init'], dir);
    assert.equal(code, 0);
    assert.equal(stderr, '');
    assert.equal(readlinkSync(join(dir, linked, 'skills')), `../${target}/skills`);
    for (const side of ['.agents', '.claude']) {
      assert.deepEqual(
        tree(join(dir, side, 'skills', 'peer-review')),
        tree(join(shipped, 'peer-review')),
      );
    }
  });
}

test('a real folder where a link should go is left, reported, and exits 1', (t) => {
  const dir = project(t);
  const folder = join(dir, '.claude', 'skills', 'peer-review');
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'SKILL.md'), 'mine');
  const { code, stderr } = flo(['init'], dir);
  assert.equal(code, 1);
  assert.ok(stderr.includes('.claude/skills/peer-review'));
  assert.ok(!lstatSync(folder).isSymbolicLink());
  assert.deepEqual(tree(folder), { '/SKILL.md': 'mine' });
  assert.ok(existsSync(join(dir, skillFile)), '.agents/skills copy is still installed');
});

test('a regular file where a link should go is left, reported, and exits 1', (t) => {
  const dir = project(t);
  mkdirSync(join(dir, '.claude', 'skills'), { recursive: true });
  const file = join(dir, '.claude', 'skills', 'peer-review');
  writeFileSync(file, 'mine');
  const { code, stderr } = flo(['init'], dir);
  assert.equal(code, 1);
  assert.ok(stderr.includes('.claude/skills/peer-review'));
  assert.ok(lstatSync(file).isFile());
  assert.equal(readFileSync(file, 'utf8'), 'mine');
  assert.ok(existsSync(join(dir, skillFile)), '.agents/skills copy is still installed');
});

test('init with anything after it is unknown and writes nothing', (t) => {
  const dir = project(t);
  const { code, stdout, stderr } = flo(['init', 'extra'], dir);
  assert.equal(code, 1);
  assert.equal(stdout, '');
  assert.ok(stderr.startsWith('Unknown argument: init extra\n'));
  assert.deepEqual(readdirSync(dir), []);
});
