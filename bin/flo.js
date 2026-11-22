#!/usr/bin/env node
import {
  cpSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

const usage = `flo: the entire workflow for developing agentic software.

Usage: flo <command>
       flo [option]

Commands:
  init       Install flo's skills into the current project

Options:
  --help     Show this help
  --version  Print flo's version
`;

// Copies every skill the package ships into .agents/skills/, and links each
// one from .claude/skills/ when that directory exists. Returns the exit code.
function init() {
  const source = fileURLToPath(new URL('../skills/', import.meta.url));
  const names = readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  let code = 0;

  mkdirSync(join('.agents', 'skills'), { recursive: true });
  for (const name of names) {
    const dest = join('.agents', 'skills', name);
    rmSync(dest, { recursive: true, force: true });
    cpSync(join(source, name), dest, { recursive: true });
    process.stdout.write(`Copied .agents/skills/${name}\n`);
  }

  if (!isDirectory(join('.claude', 'skills'))) return code;

  for (const name of names) {
    const link = join('.claude', 'skills', name);
    const shown = `.claude/skills/${name}`;
    const target = `../../.agents/skills/${name}`;
    const existing = lstatOrNull(link);
    // .claude/skills and .agents/skills are one folder through a symlink, so
    // the copy is already visible here.
    if (existing && !existing.isSymbolicLink() && sameFolder(link, join('.agents', 'skills', name))) {
      continue;
    }
    if (existing && !existing.isSymbolicLink()) {
      process.stderr.write(
        `Left ${shown} as it is: it isn't a symlink, so flo won't replace it. Remove it and rerun flo init to link the skill.\n`,
      );
      code = 1;
      continue;
    }
    try {
      if (existing) unlinkSync(link);
      symlinkSync(target, link);
      process.stdout.write(`Linked ${shown} -> ${target}\n`);
    } catch (error) {
      process.stderr.write(`Couldn't link ${shown}: ${error.message}\n`);
      code = 1;
    }
  }
  return code;
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

// Compares the folders themselves, not their paths, so different spellings of
// one folder (such as case on a case-insensitive filesystem) still match.
function sameFolder(a, b) {
  const [x, y] = [statSync(a), statSync(b)];
  return x.dev === y.dev && x.ino === y.ino;
}

function lstatOrNull(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

const args = process.argv.slice(2);

if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
  process.stdout.write(usage);
} else if (args.length === 1 && args[0] === '--version') {
  process.stdout.write(`${version}\n`);
} else if (args.length === 1 && args[0] === 'init') {
  try {
    process.exitCode = init();
  } catch (error) {
    process.stderr.write(`flo init failed: ${error.message}\n`);
    process.exitCode = 1;
  }
} else {
  process.stderr.write(`Unknown argument: ${args.join(' ')}\n\n${usage}`);
  process.exitCode = 1;
}
