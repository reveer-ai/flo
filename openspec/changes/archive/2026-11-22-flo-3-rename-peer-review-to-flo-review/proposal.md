# Proposal

Implements Linear issue **FLO-3** (Rename peer-review to flo-review).

## Why

flo installs its skills into folders that hold other skills too (`.agents/skills/`, `.claude/skills/`), and `flo init` replaces whatever it ships on every run. A `flo-` prefix makes it clear which skills there flo manages, and keeps flo's names from colliding with a project's own. FLO-2 shipped its skill as `peer-review`, without the prefix (owner, 2026-11-22).

## What Changes

- **Rename `peer-review` to `flo-review`**: its folder in the package and its `name` frontmatter. The owner chose `flo-review` over `flo-peer-review`. The skill's instructions don't change.
- **A rule for every skill flo ships:** its name starts with `flo-`, enforced by a test.
- **No migration.** Nobody has used flo yet, so `flo init` doesn't remove an old `peer-review` copy (owner, 2026-11-22).
- **Release.** Bump `flo-ai` to `0.2.1`, a fix on `0.x`.

## Capabilities

### New Capabilities

- `flo-review`: the `peer-review` requirements, unchanged, under the skill's new name.

### Modified Capabilities

- `init`: scenarios name `flo-review` instead of `peer-review`, and a new requirement that every shipped skill is named `flo-<name>`.

### Removed Capabilities

- `peer-review`: replaced by `flo-review`.

## Impact

- Renamed: `skills/peer-review/` → `skills/flo-review/`.
- Changed: `test/init.test.js`, `README.md`, the `package.json` description and version, `edda/vision.md` and `edda/index.md`.
- `bin/flo.js` doesn't change: it installs whatever is in `skills/`.
- FLO-2's archived change keeps the old name, as the record of what it shipped.
