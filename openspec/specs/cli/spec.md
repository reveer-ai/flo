# cli Specification

## Purpose

The `flo` command that the `flo-ai` npm package installs: what it answers, where its output goes, and how it exits. Its one command, `init`, has its own spec (`init`).

## Requirements

### Requirement: The package installs a command named flo

The npm package `flo-ai` SHALL provide one executable, `flo`, runnable without a global install as `npx flo-ai`. It SHALL depend on no other npm package and run on Node 22 or later.

#### Scenario: Run through npx

- **WHEN** someone runs `npx flo-ai --version` in any directory
- **THEN** the `flo` command runs and prints the package's version

#### Scenario: No dependencies

- **WHEN** `flo-ai` is installed
- **THEN** npm installs no other package with it

### Requirement: Help describes flo and its options

`flo` with no arguments, or with exactly `--help`, SHALL print a usage text to stdout and exit 0. The usage SHALL say in one line what flo is, list the `init` command with what it does, and list `--help` and `--version`.

#### Scenario: No arguments

- **WHEN** someone runs `flo` with no arguments
- **THEN** the usage is printed to stdout, nothing is printed to stderr, and the exit code is 0

#### Scenario: --help

- **WHEN** someone runs `flo --help`
- **THEN** the same usage is printed to stdout and the exit code is 0

#### Scenario: Usage lists init

- **WHEN** someone reads the usage
- **THEN** it lists `init` as installing flo's skills into the current project, and doesn't say flo has no commands

### Requirement: --version prints the installed version

`flo --version` SHALL print the installed package's version, as `package.json` states it, followed by a newline and nothing else, and exit 0.

#### Scenario: Version matches the package

- **GIVEN** the installed `flo-ai` is version `0.1.0`
- **WHEN** someone runs `flo --version`
- **THEN** stdout is exactly `0.1.0` and a newline, and the exit code is 0

### Requirement: Anything else is an error

Any other arguments SHALL make `flo` print `Unknown argument:` followed by the arguments, then the usage, to stderr, and exit 1. This covers unknown flags, unknown words, `init` with anything after it, and `--help` or `--version` combined with anything else. It SHALL write no files.

#### Scenario: Unknown word

- **WHEN** someone runs `flo frobnicate`
- **THEN** stderr starts with `Unknown argument: frobnicate`, the usage follows on stderr, stdout is empty, and the exit code is 1

#### Scenario: Known flag with extra arguments

- **WHEN** someone runs `flo --version extra`
- **THEN** it is treated as unknown, and the exit code is 1

#### Scenario: Nothing is written

- **WHEN** `flo` runs with arguments other than exactly `init` in a directory
- **THEN** the directory's contents are unchanged afterwards
