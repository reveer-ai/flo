# Design

## Context

The repo holds the edda record, OpenSpec (2.1.1, the latest) and this change. `main` is one empty commit, and this PR carries `LICENSE`. There's no package, CI or protection yet. See proposal.md for motivation.

flo will handle the entire workflow for developing agentic software (`edda/vision.md`), but what it installs into a project isn't scoped, and FLO-1 ships no skills (owner, 2026-11-21). So FLO-1 ships a package that proves delivery and commits to as little product shape as possible.

Constraints from npm's trusted-publishing docs (read 2026-11-21; the page was last edited 2026-10-06):

- The package must already exist on npm before a trusted publisher can be set up for it (`npm trust`: "Package must exist").
- A new setup must complete its first successful publish within 2 days, or it expires and has to be recreated.
- Setups created after 2026-09-03 allow only `npm stage publish` unless direct `npm publish` is allowed explicitly (`--allow-publish`).
- It needs npm 11.5.1+, Node 22.14+, a GitHub-hosted runner, `id-token: write`, and a `repository.url` that matches the repo exactly. A GitHub environment can optionally be named in the setup.

## Goals / Non-Goals

**Goals:**
- `npx flo-ai --version` prints the released version, and merging a version bump to `main` releases it with no manual step.
- No long-lived npm token exists, and only `main` can publish.
- `main` starts with FLO-1's commit, and every release tag points at a commit on that final history.
- Nothing in the package presumes what flo will install.

**Non-Goals:**
- Any product command (`flo init` or otherwise), skills, or installed content. That waits for flo to be scoped.
- Pre-release channels, changelogs beyond GitHub's generated notes, and required reviews (a single maintainer can't approve their own PRs).

## Decisions

### Package and command

**Package `flo-ai`, command `flo`.** `bin` maps `flo` to `bin/flo.js`, so `npx flo-ai` runs it without a global install. The npm name `flo` is taken by an unrelated package.

**The CLI does only `--help` and `--version`.**
- `flo` alone and `flo --help` print a short usage to stdout and exit 0. The usage says what flo is in one line and that it has no commands yet.
- `flo --version` prints the package version and exits 0.
- Anything else prints `Unknown argument: …` and the usage to stderr and exits 1.

flo has no commands yet, so running `flo` is how you ask what it is, and that shouldn't count as an error. *Alternative:* a placeholder `flo init` and skill. Rejected by the owner: FLO-1 ships no skills, and `flo init` comes with the first one.

**Plain JavaScript, Node built-ins only.** ESM, no dependencies, no build step, `engines.node >= 22`, tests with `node --test`. A CLI with two flags needs nothing more, and having no dependencies keeps the supply chain empty. Revisit if flo's scope brings real logic, for example TypeScript. That's a choice for when it's needed, and nothing here makes it harder.

**What's in the package.** `files` lists `bin/` and `README.md` (npm adds `package.json` and `LICENSE`). There's no `skills/` folder, because flo ships none yet. The repo's `.agents/` and `.claude/` are tooling for working on flo and never ship.

**README.** It says what flo is, that it's early and does nothing yet beyond `--version`, how to run it (`npx flo-ai`), and that the package is `flo-ai`, not `flo`. It doesn't describe the workflow flo will handle, since that isn't scoped.

### Releases

**One workflow, `.github/workflows/release.yml`.** On pull requests, the `test` job runs `npm test` and `npm pack --dry-run`. On a push to `main`, the `release` job runs after it and calls `scripts/release.js`. That script:

1. Publishes `package.json`'s version if it isn't on npm yet, and refuses one lower than npm's `latest`, since publishing it would move `latest` backwards.
2. Creates and pushes tag `v<version>` if it doesn't exist.
3. Creates the tag's GitHub release, with generated notes, if it doesn't exist.

Every step checks before it acts, so a push without a version bump does nothing, and rerunning a failed run finishes only what's missing. The script takes its `npm`/`git`/`gh` runner as a parameter, so its tests can check each case against a fake instead of the real registry. *Alternative:* release on pushed tags. Rejected because FLO-1 asks for a push to `main` to be what releases.

**Publishing runs in a GitHub environment, `npm`, that only `main` can deploy to.** The trusted publisher names the environment, so npm accepts a token only from a `release.yml` job in that environment, and GitHub only lets `main` into it. Without this, a pull request that edits `release.yml` runs its own version of the workflow, and that run could request a publish token. That's not likely in a single-maintainer repo. But flo is about getting work through review safely, and a guard that costs one setting fits it.

**Direct publish, not staged.** The trusted publisher allows `npm publish`, because staging makes every release wait for the owner's 2FA. That breaks "push to `main` releases". The protections are short-lived tokens, provenance, and the `npm` environment.

**Versions start at `0.1.0`.** `package.json`'s version is the only source of truth. A PR that should ship bumps it (`edda/workflow.md`).

### Repository

**Protect `main` with rulesets, after history is final.**
- A branch ruleset on `main` blocks force-pushes and deletion, requires a pull request, allows only squash merges, and requires the `test` check to pass.
- A tag ruleset on `refs/tags/v*` blocks updating and deleting tags but still allows creating them, so the release job can tag.
- Neither ruleset has bypass actors, so the owner's admin role doesn't skip them either.
- The repo's merge settings turn off merge commits and rebase merges, so the merge button offers only squash.

The rulesets don't require a branch to be up to date with `main` before merge. With one maintainer and one PR at a time, that adds a step and rarely catches anything. *Alternative:* classic branch protection. Rejected because it can't protect tags, and rulesets are GitHub's current model.

**OpenSpec is set up for Codex and Claude Code (owner, 2026-11-21).** `openspec init --tools codex,claude --scope project` keeps one copy of each skill in `.agents/skills/`, which Codex reads. OpenSpec itself makes `.claude/skills/<name>` a relative symlink to it for Claude Code. `openspec update` keeps both in step. Because `.claude/` exists, `npx clare-ai init` links its skill the same way. Other assistants that read `.agents/skills/` still work.

### Order of the first release and the history rewrite

FLO-1 both rewrites `main`'s history and makes the first release. A release tag created on the squash-merge commit would point at a commit that the later fold removes from `main`. So the fold happens before anything can publish:

1. Implementation lands on this PR. The owner approves it, and the change is archived in the PR.
2. The owner publishes a bootstrap **`flo-ai@0.0.1`** by hand from the PR branch, with `version` set to `0.0.1` locally and not committed. This creates the npm name, which npm requires before a trusted publisher can exist.
3. Squash-merge. The release job runs and fails at `npm publish` (`ENEEDAUTH`), because there's no trusted publisher yet. The failure comes before tagging, so no tag or GitHub release is created.
4. The owner sets up the trusted publisher with direct publish, for owner `reveer-ai`, repository `flo`, workflow `release.yml`, environment `npm`. This uses npm 12's `npx npm@latest trust github flo-ai --file release.yml --repo reveer-ai/flo --env npm --allow-publish` or npmjs.com. The 2-day window starts here.
5. Fold the empty root into the squashed commit: same tree, message and author, no parent. Push it with `--force-with-lease` pinned to the merge commit. That push runs the release job on the final commit, which publishes `0.1.0`, tags `v0.1.0`, and creates its release.
6. Apply the rulesets and merge settings, then deprecate `0.0.1` (`npm deprecate flo-ai@0.0.1 "bootstrap release, use 0.1.0+"`).

*Alternatives:*
- Fold before merging. Impossible, because the PR needs `main` as its base.
- Let the merge release `0.1.0` and re-point the tag after the fold. Rejected: npm's `gitHead` and provenance for `0.1.0` would name a commit that's no longer on `main`.
- Hand-publish `0.1.0` and let CI take over from the next bump. Rejected, because the trusted publisher would likely expire unused, and the workflow's publish path would go untested.

## Risks / Trade-offs

- [Rebuilding the squash commit locally loses GitHub's "Verified" signature, and its committer becomes the local user] → Accepted. This is a one-time rewrite the owner chose, and it happens before protection exists.
- [Step 3 leaves a failed release run on the merge commit] → Expected. It changes nothing on npm or in tags.
- [The trusted publisher expires before step 5 publishes] → Steps 4 and 5 run back to back. If it expires, delete it, recreate it and rerun the job.
- [Rulesets with no bypass also stop the owner from force-pushing] → Intended. A future rewrite means turning the ruleset off on purpose, then back on.
- [`0.0.1` stays on npm forever] → It's deprecated with a pointer to `0.1.0`.
- [A published version can't be taken back] → `npm pack --dry-run` runs on every PR. To roll back, deprecate the version and release a fix.

## Migration Plan

The order is in **Order of the first release and the history rewrite** above. FLO-1 is Done when `npx flo-ai --version` prints `0.1.0`, `v0.1.0` exists as a tag and a GitHub release on the folded commit, `git log main` shows one commit, and the rulesets are active.
