#!/usr/bin/env node
// Releases package.json's version: publishes it to npm if it isn't there yet,
// then makes sure tag v<version> and its GitHub release exist. Every step checks
// before it acts, so a push without a version bump does nothing, and a rerun
// finishes only what's missing. Run by .github/workflows/release.yml on main.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PLAIN_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

// Runs a command and returns { status, stdout, stderr }. Never throws on a
// non-zero exit; callers decide what a failure means.
export function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function compare(a, b) {
  const pa = a.match(/^(\d+)\.(\d+)\.(\d+)/).slice(1).map(Number);
  const pb = b.match(/^(\d+)\.(\d+)\.(\d+)/).slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

function fail(what, result) {
  const output = `${result.stderr}${result.stdout}`.trim();
  return new Error(`${what} failed (exit ${result.status})${output ? `:\n${output}` : ''}`);
}

// What npm has for the package: its versions and its `latest`. A package that
// doesn't exist yet has neither.
function registry(exec, name) {
  const result = exec('npm', ['view', name, 'versions', 'dist-tags', '--json']);
  if (result.status !== 0) {
    if (/\bE404\b/.test(`${result.stdout}${result.stderr}`)) return { versions: [], latest: undefined };
    throw fail(`npm view ${name}`, result);
  }
  const data = JSON.parse(result.stdout);
  return { versions: [].concat(data.versions ?? []), latest: data['dist-tags']?.latest };
}

export function release({ name, version, exec = run, log = console.log }) {
  if (!PLAIN_VERSION.test(version)) {
    throw new Error(`Version ${version} isn't plain major.minor.patch, so it can't be released.`);
  }
  const tag = `v${version}`;

  // 1. Publish to npm.
  const { versions, latest } = registry(exec, name);
  if (versions.includes(version)) {
    log(`${name}@${version} is already on npm, so there's nothing to publish.`);
  } else {
    if (latest && compare(version, latest) < 0) {
      throw new Error(`Version ${version} is lower than npm's latest (${latest}), so publishing it would move latest backwards.`);
    }
    const published = exec('npm', ['publish', '--provenance', '--access', 'public']);
    if (published.status !== 0) throw fail(`npm publish ${name}@${version}`, published);
    log(`Published ${name}@${version} to npm.`);
  }

  // 2. Tag the pushed commit, unless the tag already exists.
  const remote = exec('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`]);
  if (remote.status !== 0) throw fail(`git ls-remote ${tag}`, remote);
  if (remote.stdout.trim()) {
    log(`Tag ${tag} already exists.`);
  } else {
    const head = exec('git', ['rev-parse', 'HEAD']);
    if (head.status !== 0) throw fail('git rev-parse HEAD', head);
    const commit = head.stdout.trim();
    for (const args of [['tag', tag, commit], ['push', 'origin', `refs/tags/${tag}`]]) {
      const result = exec('git', args);
      if (result.status !== 0) throw fail(`git ${args.join(' ')}`, result);
    }
    log(`Tagged ${commit} as ${tag}.`);
  }

  // 3. Create the tag's GitHub release, unless it already exists.
  const view = exec('gh', ['release', 'view', tag]);
  if (view.status === 0) {
    log(`GitHub release ${tag} already exists.`);
  } else if (/release not found/i.test(`${view.stderr}${view.stdout}`)) {
    const created = exec('gh', ['release', 'create', tag, '--title', tag, '--generate-notes', '--verify-tag']);
    if (created.status !== 0) throw fail(`gh release create ${tag}`, created);
    log(`Created GitHub release ${tag}.`);
  } else {
    throw fail(`gh release view ${tag}`, view);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  try {
    release({ name: pkg.name, version: pkg.version });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
