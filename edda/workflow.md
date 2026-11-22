# How work is done

Set by the project owner on 2026-11-21. This is how work on flo itself is done, not what flo the product prescribes.

## Tracking: Linear

All work is tracked in Linear, team **flo** (key `FLO`, under the reveer workspace). Every piece of work has an issue before it starts.

## Changes: OpenSpec

Every tangible change is an OpenSpec change in `openspec/` (proposal → design → specs → tasks), and its specs are archived into `openspec/specs/` once it lands. `openspec/config.yaml` carries the rules below for OpenSpec's own workflows. If the gates change, update both.

OpenSpec is set up for both Codex and Claude Code (owner, 2026-11-21), with `openspec init --tools codex,claude --scope project`. Its skills live once in `.agents/skills/`, and `.claude/skills/` holds symlinks to them, which OpenSpec makes itself.

Stay on the latest OpenSpec release (owner, 2026-11-21). Before each change, check `npm view @fission-ai/openspec version` against `openspec --version`, and upgrade with `npm install -g @fission-ai/openspec@latest`. The repo was set up with 2.1.1, the latest at the time (released 2026-11-19). After any upgrade, run `openspec update` to regenerate `.agents/skills/` and commit the result. The generated files don't record the CLI version, so check it with `openspec --version`.

In 2.1.1, `openspec init` puts skills in `~/.agents/skills/` (machine-wide) unless it's given `--scope project`.

## Approval gates

| Step | Who |
|---|---|
| Proposal | Owner approves. Stop after writing it and opening the PR |
| Design | Owner approves. Write it only once the proposal is approved and you and the owner are aligned on it. After both exist, update them together as the change is refined |
| Specs, tasks | No separate approval. Write them together, in one pass, once the design is approved |
| Start of implementation | Owner initiates; never start on your own |
| Archive | Once the owner approves the PR: archive the change in the same PR, before merge |

## Branches and PRs

- Branch name: the issue's `gitBranchName` from Linear (e.g. `flo-1-initialize-flo`).
- PR title: `<issue id>: <description>` (e.g. `FLO-1: Initialize flo`).
- PRs go to `main` on `github.com/reveer-ai/flo` and are always squash-merged.
- Open the PR as soon as the proposal is written, so the whole change is reviewed there from the start. From then on, push as work becomes ready: each OpenSpec refinement as soon as it's written, and code as each piece is finished. Don't hold finished work locally.
- After the owner approves a PR, run `openspec archive <change>` on the PR branch, commit and push, then merge. Never merge with the change still under `openspec/changes/`.
- The remote is SSH (`git@github.com:reveer-ai/flo.git`). Over HTTPS, git authenticates as a GitHub account without push access.

## History

`main` starts with FLO-1's squashed commit, which the owner chose on 2026-11-21. The repo's original LICENSE-only commit (`92d8e30`) and the empty root that briefly replaced it were folded away, and FLO-1 carries `LICENSE` unchanged. Every commit after it is one squash-merged PR.

`main` is protected by GitHub rulesets with no bypass actors, so they bind the owner too:

- **Branch ruleset on `main`:** no force-pushes or deletion. Changes arrive only through a pull request, merged by squash, whose `test` check passed. A branch doesn't need to be up to date with `main` to merge.
- **Tag ruleset on `refs/tags/v*`:** release tags can't be moved or deleted. Creating them is allowed, so the release workflow can tag.
- The repo's merge settings allow only squash merges.

`main`'s history isn't rewritten again. If the owner ever asks for a rewrite, it means turning the branch ruleset off on purpose and back on afterwards. A force-push that replaces a PR's base history closes the PR on GitHub, and it can't be reopened.

## Releasing

FLO-1 set up the pipeline: `.github/workflows/release.yml` runs `scripts/release.js`. Its design and the `release` spec came with FLO-1's change.

- `version` in `package.json` is the only source of flo's version. A PR that should ship bumps it itself, following semver while flo is on `0.x`: a minor bump for new behavior, a patch bump for fixes. A PR that doesn't bump it, such as a record-only change, releases nothing.
- On every push to `main`, the release workflow runs the tests, publishes the version to npm if it isn't there yet, tags the commit `v<version>`, and creates a GitHub release. On PRs it only runs the tests and `npm pack --dry-run`, as the `test` check. Nothing commits to `main` on a release.
- Every release step checks before it acts, so a failed run is fixed by rerunning it: it finishes only what's missing. It refuses a version lower than npm's `latest`, or one that isn't plain `major.minor.patch`.
- Publishing uses npm trusted publishing, so no npm token exists. The trusted publisher allows direct `npm publish`, not npm's default staged publishing, so a release doesn't wait for the owner's 2FA. Configuring it on npmjs.com is the owner's step.
- The trusted publisher for `flo-ai` is: owner `reveer-ai`, repository `flo`, workflow `release.yml`, environment `npm`, direct publish allowed. Renaming the workflow file or the environment breaks publishing until the trusted publisher is recreated to match.
- The release job runs in the GitHub environment `npm`, which only `main` can deploy to. Because the trusted publisher names that environment, a pull request that edits the workflow can't get a publish token from its own run.
- npm lets a trusted publisher be set up only for a package that already exists, and a new one expires if nothing publishes through it within two days (npm docs, read 2026-11-21). So the first version of a new package is a bootstrap published by hand, and the trusted publisher is set up right before the workflow's first publish.
- A published version can't be taken back. To roll back, deprecate it (`npm deprecate`) and release a fix.

## Where the roadmap lives

In Linear, not here: [team flo](https://linear.app/reveer/team/FLO). Issues, their order, status and blockers are the source of truth there, so edda doesn't copy them.
