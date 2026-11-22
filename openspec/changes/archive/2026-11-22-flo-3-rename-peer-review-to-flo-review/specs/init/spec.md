# Spec Delta

## ADDED Requirements

### Requirement: Every skill flo ships is named flo-<name>

Every skill flo ships SHALL have a name that starts with `flo-`, and its folder SHALL have the same name, so a project can tell which skills in its skills folders flo manages.

#### Scenario: The shipped skills

- **WHEN** someone lists the skills in the package
- **THEN** every skill's folder and `name` start with `flo-`

## MODIFIED Requirements

### Requirement: flo init copies every skill into .agents/skills

`flo init` SHALL work on the current directory. It SHALL copy every skill the package ships into `.agents/skills/<name>/`, creating `.agents/skills/` if it doesn't exist. It SHALL touch no other skill there.

#### Scenario: A fresh project

- **GIVEN** a directory with no `.agents/`
- **WHEN** someone runs `flo init` there
- **THEN** `.agents/skills/flo-review/SKILL.md` exists and matches the package's copy, and the exit code is 0

#### Scenario: Other skills are left alone

- **GIVEN** `.agents/skills/other/` exists and flo ships no skill named `other`
- **WHEN** someone runs `flo init`
- **THEN** `.agents/skills/other/` is unchanged

### Requirement: Rerunning flo init updates the copies

When a flo skill is already in `.agents/skills/`, `flo init` SHALL replace it with the installed package's version, so the result matches the package exactly.

#### Scenario: An edited copy

- **GIVEN** `.agents/skills/flo-review/SKILL.md` was edited after an earlier `flo init`
- **WHEN** someone runs `flo init` again
- **THEN** the file matches the package's copy again

#### Scenario: A stale file in the copy

- **GIVEN** `.agents/skills/flo-review/` holds a file the package's copy doesn't have
- **WHEN** someone runs `flo init`
- **THEN** that file is gone

### Requirement: flo init links skills from .claude/skills when it exists

If `.claude/skills/` exists, `flo init` SHALL make `.claude/skills/<name>` a relative symlink to `../../.agents/skills/<name>` for each skill, replacing an existing symlink there. If `.claude/skills/` doesn't exist, it SHALL NOT create it.

#### Scenario: Claude Code in use

- **GIVEN** `.claude/skills/` exists
- **WHEN** someone runs `flo init`
- **THEN** `.claude/skills/flo-review` is a symlink whose target is `../../.agents/skills/flo-review`

#### Scenario: An old link

- **GIVEN** `.claude/skills/flo-review` is a symlink to somewhere else
- **WHEN** someone runs `flo init`
- **THEN** it now points to `../../.agents/skills/flo-review`

#### Scenario: No .claude/skills

- **GIVEN** the directory has `.claude/` but no `.claude/skills/`
- **WHEN** someone runs `flo init`
- **THEN** `.claude/skills/` still doesn't exist

### Requirement: One shared skills folder counts as linked

When `.claude/skills/<name>` and `.agents/skills/<name>` are the same folder, because `.claude/skills` and `.agents/skills` are one folder through a symlink, `flo init` SHALL treat the skill as already linked. It SHALL make no link there, report no error for it, and exit 0.

#### Scenario: .claude/skills links to .agents/skills

- **GIVEN** `.claude/skills` is a symlink to `../.agents/skills`
- **WHEN** someone runs `flo init`
- **THEN** `.claude/skills` is still that symlink, `.claude/skills/flo-review/SKILL.md` matches the package's copy, stderr is empty, and the exit code is 0

#### Scenario: .agents/skills links to .claude/skills

- **GIVEN** `.agents/skills` is a symlink to `../.claude/skills`
- **WHEN** someone runs `flo init`
- **THEN** `.agents/skills` is still that symlink, `.agents/skills/flo-review/SKILL.md` matches the package's copy, stderr is empty, and the exit code is 0

### Requirement: flo init never replaces something that isn't its link

If anything other than a symlink is at `.claude/skills/<name>`, and it isn't the `.agents/skills/<name>` copy itself, `flo init` SHALL leave it untouched, say on stderr which path it left and why, and exit 1. It SHALL still install the `.agents/skills/` copies.

#### Scenario: A real folder in the way

- **GIVEN** `.claude/skills/flo-review/` is a real folder
- **WHEN** someone runs `flo init`
- **THEN** that folder is unchanged, stderr names `.claude/skills/flo-review`, `.agents/skills/flo-review/` is installed, and the exit code is 1

### Requirement: flo init reports what it wrote

`flo init` SHALL print to stdout one line for each skill it copied and each link it made, naming the path.

#### Scenario: Output with .claude/skills

- **GIVEN** `.claude/skills/` exists
- **WHEN** someone runs `flo init`
- **THEN** stdout has a line naming `.agents/skills/flo-review` and a line naming `.claude/skills/flo-review`

