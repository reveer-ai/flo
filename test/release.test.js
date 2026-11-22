import { test } from 'node:test';
import assert from 'node:assert/strict';
import { release } from '../scripts/release.js';

const HEAD = 'abc123';

// A fake npm registry, git remote and GitHub, answering the commands
// scripts/release.js runs. It records every call, and changes its state the
// way the real thing would.
function world({ versions = [], latest, tags = {}, releases = [], publishFails = false } = {}) {
  const state = { versions: [...versions], latest, tags: { ...tags }, releases: [...releases] };
  const calls = [];
  const ok = (stdout = '') => ({ status: 0, stdout, stderr: '' });
  const err = (stderr) => ({ status: 1, stdout: '', stderr });

  function exec(cmd, args) {
    calls.push([cmd, ...args].join(' '));
    const [sub, ...rest] = args;
    if (cmd === 'npm' && sub === 'view') {
      if (state.versions.length === 0) return { status: 1, stdout: '{"error":{"code":"E404"}}', stderr: 'npm error code E404' };
      return ok(JSON.stringify({ versions: state.versions, 'dist-tags': { latest: state.latest } }));
    }
    if (cmd === 'npm' && sub === 'publish') {
      if (publishFails) return err('npm error code ENEEDAUTH');
      state.published = true;
      return ok();
    }
    if (cmd === 'git' && sub === 'ls-remote') {
      const ref = rest.at(-1);
      const name = ref.replace('refs/tags/', '');
      return ok(state.tags[name] ? `${state.tags[name]}\t${ref}\n` : '');
    }
    if (cmd === 'git' && sub === 'rev-parse') return ok(`${HEAD}\n`);
    if (cmd === 'git' && sub === 'tag') {
      state.localTag = { name: rest[0], commit: rest[1] };
      return ok();
    }
    if (cmd === 'git' && sub === 'push') {
      const name = rest[1].replace('refs/tags/', '');
      assert.equal(state.localTag?.name, name, 'pushes the tag it just created');
      state.tags[name] = state.localTag.commit;
      return ok();
    }
    if (cmd === 'gh' && sub === 'release' && rest[0] === 'view') {
      return state.releases.includes(rest[1]) ? ok('{}') : err('release not found');
    }
    if (cmd === 'gh' && sub === 'release' && rest[0] === 'create') {
      state.releases.push(rest[1]);
      state.releaseArgs = rest;
      return ok();
    }
    throw new Error(`unexpected command: ${cmd} ${args.join(' ')}`);
  }

  const logs = [];
  return { state, calls, exec, logs, log: (line) => logs.push(line) };
}

const has = (w, prefix) => w.calls.some((call) => call.startsWith(prefix));

test('a bumped version is published with provenance as latest, tagged and released', () => {
  const w = world({ versions: ['0.1.0'], latest: '0.1.0' });
  release({ name: 'flo-ai', version: '0.2.0', exec: w.exec, log: w.log });

  const publish = w.calls.find((call) => call.startsWith('npm publish'));
  assert.ok(publish, 'publishes');
  assert.match(publish, /--provenance/);
  assert.doesNotMatch(publish, /--tag/, 'no dist-tag, so it becomes latest');
  assert.equal(w.state.tags['v0.2.0'], HEAD, 'tag points at the pushed commit');
  assert.deepEqual(w.state.releaseArgs, ['create', 'v0.2.0', '--title', 'v0.2.0', '--generate-notes', '--verify-tag']);
});

test('the first version of a package that does not exist yet is published', () => {
  const w = world();
  release({ name: 'flo-ai', version: '0.1.0', exec: w.exec, log: w.log });
  assert.ok(w.state.published);
  assert.equal(w.state.tags['v0.1.0'], HEAD);
  assert.ok(w.state.releases.includes('v0.1.0'));
});

test('a version already on npm, tagged and released, does nothing', () => {
  const w = world({ versions: ['0.1.0'], latest: '0.1.0', tags: { 'v0.1.0': 'old' }, releases: ['v0.1.0'] });
  release({ name: 'flo-ai', version: '0.1.0', exec: w.exec, log: w.log });

  assert.ok(!has(w, 'npm publish'));
  assert.ok(!has(w, 'git tag') && !has(w, 'git push'));
  assert.ok(!has(w, 'gh release create'));
  assert.equal(w.state.tags['v0.1.0'], 'old', 'an existing tag is never moved');
  assert.ok(w.logs.some((line) => /already on npm/.test(line)), 'says the version is already on npm');
});

test('a version lower than latest fails before anything is published or tagged', () => {
  const w = world({ versions: ['0.1.0', '0.2.0'], latest: '0.2.0' });
  assert.throws(
    () => release({ name: 'flo-ai', version: '0.1.5', exec: w.exec, log: w.log }),
    /lower than npm's latest \(0\.2\.0\)/,
  );
  assert.ok(!has(w, 'npm publish') && !has(w, 'git tag') && !has(w, 'gh release create'));
});

test('a version is compared numerically, not as text', () => {
  const w = world({ versions: ['0.9.0'], latest: '0.9.0' });
  release({ name: 'flo-ai', version: '0.10.0', exec: w.exec, log: w.log });
  assert.ok(w.state.published);
});

for (const version of ['0.2.0-beta.1', '1.0', 'v1.0.0', '1.0.0+build']) {
  test(`a version that isn't plain major.minor.patch fails: ${version}`, () => {
    const w = world({ versions: ['0.1.0'], latest: '0.1.0' });
    assert.throws(() => release({ name: 'flo-ai', version, exec: w.exec, log: w.log }), /isn't plain major\.minor\.patch/);
    assert.deepEqual(w.calls, [], 'runs nothing');
  });
}

test('published but not tagged: a rerun tags and releases without publishing again', () => {
  const w = world({ versions: ['0.1.0', '0.2.0'], latest: '0.2.0' });
  release({ name: 'flo-ai', version: '0.2.0', exec: w.exec, log: w.log });

  assert.ok(!has(w, 'npm publish'));
  assert.equal(w.state.tags['v0.2.0'], HEAD);
  assert.ok(w.state.releases.includes('v0.2.0'));
});

test('tagged but not released: a rerun only creates the release', () => {
  const w = world({ versions: ['0.2.0'], latest: '0.2.0', tags: { 'v0.2.0': HEAD } });
  release({ name: 'flo-ai', version: '0.2.0', exec: w.exec, log: w.log });

  assert.ok(!has(w, 'npm publish') && !has(w, 'git tag') && !has(w, 'git push'));
  assert.ok(w.state.releases.includes('v0.2.0'));
});

test('a failed publish fails the run with no tag or release', () => {
  const w = world({ versions: ['0.0.1'], latest: '0.0.1', publishFails: true });
  assert.throws(() => release({ name: 'flo-ai', version: '0.1.0', exec: w.exec, log: w.log }), /ENEEDAUTH/);
  assert.ok(!has(w, 'git tag') && !has(w, 'git push') && !has(w, 'gh release create'));
  assert.deepEqual(w.state.tags, {});
});

test('a registry error other than not-found fails the run before publishing', () => {
  const calls = [];
  const exec = (cmd, args) => {
    calls.push(`${cmd} ${args.join(' ')}`);
    return { status: 1, stdout: '', stderr: 'npm error code ETIMEDOUT' };
  };
  assert.throws(() => release({ name: 'flo-ai', version: '0.1.0', exec, log: () => {} }), /ETIMEDOUT/);
  assert.equal(calls.length, 1);
});

test('nothing is committed back to main', () => {
  const w = world({ versions: ['0.1.0'], latest: '0.1.0' });
  release({ name: 'flo-ai', version: '0.2.0', exec: w.exec, log: w.log });
  assert.ok(!has(w, 'git commit'));
  const pushes = w.calls.filter((call) => call.startsWith('git push'));
  assert.deepEqual(pushes, ['git push origin refs/tags/v0.2.0'], 'pushes only the tag');
});
