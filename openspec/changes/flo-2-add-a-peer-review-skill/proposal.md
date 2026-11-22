# Proposal

Implements Linear issue **FLO-2** (Add a peer-review skill).

## Why

When an agent finishes an implementation, the user is usually the first one to review it. That makes the user catch mistakes a second agent could have caught (see `edda/vision.md`). flo started from this idea, and it's the first skill flo ships.

## What Changes

- **A `peer-review` skill**, shipped in the `flo-ai` package. Once an agent finishes implementing something, the skill has it:
  1. **Get an independent review.** Start a review subagent on a model at least as capable as Claude Opus 5.5 or GPT Sol 6.1. The reviewer starts with a fresh context and judges the work from what it was meant to do (the request, issue or spec) and what was built. It doesn't see the implementer's reasoning.
  2. **Apply the feedback.** The implementing agent fixes what the review found, and gets the fixes re-reviewed until a review finds nothing new.
  3. **Hand off to the user**, following the project's own instructions for handing over work, if it has any. If not, a concise default: what was done, what was and wasn't verified, and what needs the user's decision, with a line on what the review caught.
- The skill is written for any coding assistant (Claude Code, Codex, OpenCode, ...). It describes the reviewer by capability, with those two models as examples, and doesn't depend on one assistant's way of starting subagents.
- The skill stays concise. It's built to grow later, for example to review designs and specs too.
- **`flo init`** installs flo's skills into a project. It copies them into `.agents/skills/`, and if `.claude/skills/` exists, it symlinks them there to the `.agents/skills/` copies, as `edda/vision.md` describes. This is how the skill reaches a project.
- **Release.** Bump `flo-ai` to `0.2.0` (new behavior on `0.x`).

## Capabilities

### New Capabilities

- `peer-review`: what the skill has an agent do between finishing an implementation and handing it off. When the review happens, what qualifies as a reviewer, what the reviewer sees, how its feedback is applied, and how the handoff follows the project's norms.
- `init`: how `flo init` installs flo's skills into a project. Where they're copied, when `.claude/skills/` links are made, and what happens when the skills are already there.

### Modified Capabilities

- `cli`: `flo` gets its first command. `init` stops being an unknown argument, and the help stops saying flo has no commands.

## Impact

- New: `skills/peer-review/SKILL.md` in the package (added to `files` in `package.json`), the `init` command in `bin/flo.js`, and tests for it.
- Changed: the `flo` usage text, the `cli` spec and the README.
- The repo's own `.agents/skills/` (OpenSpec, clare) isn't part of the package, and this change doesn't install `peer-review` into flo's own repo.
- Publishing `0.2.0` goes through the existing release workflow when the PR merges.
