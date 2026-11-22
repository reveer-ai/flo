#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

const usage = `flo: the entire workflow for developing agentic software.

It has no commands yet.

Usage: flo [option]

Options:
  --help     Show this help
  --version  Print flo's version
`;

const args = process.argv.slice(2);

if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
  process.stdout.write(usage);
} else if (args.length === 1 && args[0] === '--version') {
  process.stdout.write(`${version}\n`);
} else {
  process.stderr.write(`Unknown argument: ${args.join(' ')}\n\n${usage}`);
  process.exitCode = 1;
}
