# Tasks

## 1. Repository foundation

- [x] 1.1 Reset `main` to one empty commit and carry `LICENSE` on this branch, and verify `git diff 92d8e30 -- LICENSE` is empty
- [x] 1.2 Run `npx edda-ai init` and write `edda/` (index, vision, workflow), and verify `edda/index.md` links every record file
- [x] 1.3 Initialize OpenSpec 2.1.1 with `--tools codex,claude --scope project` and the approval gates in `openspec/config.yaml`, and verify `.claude/skills/*` are symlinks into `.agents/skills/` and `openspec instructions proposal --change flo-1-initialize-flo` returns the gates as rules
- [x] 1.4 Run `npx clare-ai init`, and verify its skill is in `.agents/skills/` and `.claude/skills/` links to it, with no OpenSpec file changed

## 2. Package and CLI

- [ ] 2.1 Add `package.json` (`flo-ai` at `0.1.0`, `bin` `flo` → `bin/flo.js`, ESM, `engines.node >= 22`, no dependencies, `files` `bin/` and `README.md`, MIT, `repository.url` `git+https://github.com/reveer-ai/flo.git`, `test` script `node --test`), and verify `npm pack --dry-run` lists only `package.json`, `LICENSE`, `README.md` and `bin/flo.js`
- [ ] 2.2 Write `bin/flo.js` and `test/cli.test.js` covering each `cli` spec scenario (no arguments, `--help`, `--version`, unknown word, known flag with extras, nothing written), and verify `npm test` passes
- [ ] 2.3 Write `README.md` (what flo is, that it does nothing yet beyond `--version`, `npx flo-ai`, and the `flo-ai` vs `flo` note), and verify every command it shows runs as written from a scratch directory

## 3. Releases

- [ ] 3.1 Write `scripts/release.js` (publish if missing and not lower than `latest`, then tag, then GitHub release, each step checked first) and `test/release.test.js` with a fake runner covering each `release` spec scenario the script owns, and verify `npm test` passes
- [ ] 3.2 Write `.github/workflows/release.yml`: a `test` job on pull requests and pushes to `main` (Node 24, `npm test`, `npm pack --dry-run`), and a `release` job only on pushes to `main`, after `test`, in environment `npm`, with `id-token: write` and `contents: write`, serialized with `concurrency`, updating npm before `node scripts/release.js`. Verify the `test` check passes on this PR
- [ ] 3.3 Create the GitHub environment `npm` with deployments allowed only from `main`, and verify `gh api repos/reveer-ai/flo/environments/npm` shows that branch policy
- [ ] 3.4 Record in `edda/workflow.md` how releases work: the `npm` environment, the trusted publisher's fields (owner `reveer-ai`, repository `flo`, workflow `release.yml`, environment `npm`, direct publish), and that renaming the workflow or the environment breaks publishing until the trusted publisher is recreated. Rewrite its History section to describe `main` as it will be once FLO-1 lands (one FLO-1 commit, protected by the rulesets), since nothing updates the record after the merge. Verify `edda/index.md` still describes `workflow.md` accurately

## Workflow follow-up

In order, after the owner approves the PR (design: "Order of the first release and the history rewrite"):

- Archive the change in the PR (`openspec archive flo-1-initialize-flo`), commit and push.
- The owner publishes `flo-ai@0.0.1` by hand from the PR branch, with `version` set to `0.0.1` locally and not committed.
- Squash-merge, on the owner's word. The release run is expected to fail at `npm publish` with no tag or release created. Check that `v0.1.0` doesn't exist.
- The owner sets up the trusted publisher: `npx npm@latest trust github flo-ai --file release.yml --repo reveer-ai/flo --env npm --allow-publish`, or on npmjs.com.
- Fold the empty root into the squashed commit (same tree, message and author, no parent) and push it with `--force-with-lease` pinned to the merge commit. Check that `git log origin/main` shows one commit, and that its release run publishes `0.1.0`, tags `v0.1.0` on it, and creates the GitHub release.
- Apply the rulesets and merge settings from the design. Check that a force-push to `main` and moving a `v*` tag are both rejected.
- The owner deprecates `0.0.1`: `npm deprecate flo-ai@0.0.1 "bootstrap release, use 0.1.0+"`.
- Check that `npx flo-ai@latest --version` prints `0.1.0` from a scratch directory.
