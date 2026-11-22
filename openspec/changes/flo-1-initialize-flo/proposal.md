# Proposal

Implements Linear issue **FLO-1** (Initialize flo).

## Why

flo will handle the entire workflow for developing agentic software (see `edda/vision.md`), but its scope comes later. Before any product work, the repository needs its working foundation, and the package needs to ship once, so the delivery path is proven before skills depend on it.

## What Changes

- **Project record.** Add edda (`npx edda-ai init`): `AGENTS.md` and `edda/`, recording what flo is and how work on it is done. The owner adopted clare's conventions for this repo: Linear, OpenSpec, approval gates, branch and PR naming, squash merges, releasing.
- **OpenSpec.** Initialize it at the latest release (2.1.1, `spec-driven`) for Codex and Claude Code. Its skills live in `.agents/skills/`, and `.claude/skills/` links to them. The approval gates are in `openspec/config.yaml`, and this issue is its first change.
- **clare.** Run `npx clare-ai init`, so clare's skills are available in this repo.
- **npm package.** Add **`flo-ai`**, whose command is **`flo`**. For now `flo --help` and `flo --version` are all it does; it ships no skills. The npm name `flo` belongs to an unrelated package, so you run it as `npx flo-ai`.
- **Releases.** On every push to `main`, a GitHub Actions workflow publishes any `package.json` version that isn't on npm yet, tags the commit `v<version>`, and creates a GitHub release. It uses npm trusted publishing, so no npm token exists, and only `main` can publish. On pull requests the same workflow runs the tests and `npm pack --dry-run`. It builds on clare's proven pipeline (`release.yml` and `scripts/release.js`) where that fits flo.
- **First release.** Publish the first version through that workflow, so `npx flo-ai --version` prints it.
- **README.** What flo is, how to install it, and a note that the package is `flo-ai`, not `flo`.
- **History.** `main` starts with this change's squashed commit, as clare's does. `main` has already been reset to one empty commit, and this PR carries `LICENSE` unchanged. After the squash-merge, the empty root is folded in and `main` is force-pushed once more.
- **Protect `main`.** Once history is final: changes reach `main` only through a squash-merged pull request whose CI passed, with no force-pushes, and release tags can't be moved or deleted.

## Capabilities

### New Capabilities

- `cli`: what the `flo` command does: `--help`, `--version`, and how it answers anything else.
- `release`: how a version of flo gets released: which pushes to `main` publish, how versions map to git tags and GitHub releases, what pull requests check, and what happens when a version is already out.

### Modified Capabilities

None. There are no specs yet.

## Impact

- New files: `AGENTS.md`, `edda/`, `openspec/`, `.agents/skills/` and `.claude/skills/` (OpenSpec's and clare's), `package.json`, `bin/flo.js`, `scripts/release.js`, tests, `.github/workflows/release.yml`, `README.md`, and `LICENSE` (moved from the original initial commit). The repo's own skills aren't part of the package.
- The npm name `flo-ai` gets registered under the owner's npm account. npm only lets a trusted publisher be set up for a package that already exists, so the owner publishes a bootstrap `0.0.1` by hand first, then sets up the trusted publisher. It must publish within two days or it expires. The design covers the order.
- The workflow can create tags and releases on `github.com/reveer-ai/flo`.
- `main`'s history is rewritten twice: once already (from `92d8e30`, LICENSE only, to an empty root) and once after merge. Anyone with an existing clone of `main` has to reset it. Protection is applied after the second rewrite, since it would block it.
- Contributors need the OpenSpec CLI installed globally to work on changes.
