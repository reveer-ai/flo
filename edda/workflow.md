# How work is done

The owner adopted clare's conventions (`../clare/edda/workflow.md`) for this repo on 2026-11-21. This is how work on flo itself is done, not what flo the product prescribes.

## Tracking: Linear

All work is tracked in Linear, team **flo** (key `FLO`, under the reveer workspace). Every piece of work has an issue before it starts.

## Changes: OpenSpec

Every tangible change is an OpenSpec change in `openspec/` (proposal → design → specs → tasks), and its specs are archived into `openspec/specs/` once it lands. The OpenSpec skills live in `.agents/skills/` (the assistant-agnostic location); `openspec/config.yaml` carries the rules below for OpenSpec's own workflows. If the gates change, update both.

Stay on the latest OpenSpec release. The repo was set up with 2.1.1, installed globally (`npm install -g @fission-ai/openspec@latest`; on this machine it's Homebrew's `/opt/homebrew/bin/openspec`). After any upgrade, run `openspec update` to regenerate `.agents/skills/` and commit the result. The generated files don't record the CLI version, so check it with `openspec --version`.

In 2.1.1, `openspec init` puts skills in `~/.agents/skills/` (machine-wide) unless told otherwise. This repo was initialized with `openspec init --tools agents --scope project`.

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

The owner chose (2026-11-21) to have `main` start with FLO-1's squashed commit, as clare did. So `main` was force-pushed from the LICENSE-only commit (`92d8e30`) to one empty commit (`a62460e`), and FLO-1's branch carries `LICENSE` unchanged. After FLO-1 is squash-merged, the empty root is folded into the squashed commit and `main` is force-pushed once more. Protecting `main` comes after that, because protection blocks the rewrite. Don't force-push `main` again unless the owner asks. A force-push that replaces a PR's base history closes the PR on GitHub, and it can't be reopened.

## Releasing

Adopted from clare; the pipeline itself arrives with FLO-1.

- `version` in `package.json` is the only source of flo's version. A PR that should ship bumps it itself, following semver while flo is on `0.x`: a minor bump for new behavior, a patch bump for fixes. A PR that doesn't bump it, such as a record-only change, releases nothing.
- On every push to `main`, the release workflow runs the tests, publishes the version to npm if it isn't there yet, tags the commit `v<version>`, and creates a GitHub release. On PRs it only runs the tests and `npm pack --dry-run`. Nothing commits to `main` on a release.
- Publishing uses npm trusted publishing, so no npm token exists. The trusted publisher allows direct `npm publish`, not npm's default staged publishing, so a release doesn't wait for the owner's 2FA. Configuring it on npmjs.com is the owner's step.
- A new trusted publisher shows "Pending validation" until its first publish and expires two days after it's created if nothing publishes (`../edda/edda/facts.md`). So it's set up right before the first publish.
- A published version can't be taken back. To roll back, deprecate it (`npm deprecate`) and release a fix.

## Where the roadmap lives

In Linear, not here: [team flo](https://linear.app/reveer/team/FLO). Issues, their order, status and blockers are the source of truth there, so edda doesn't copy them.
