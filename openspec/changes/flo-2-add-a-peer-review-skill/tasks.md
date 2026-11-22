# Tasks

## 1. The peer-review skill

- [x] 1.1 Check the current Claude Code, Codex and OpenCode docs for where each reads project skills and what frontmatter they need. Record the result in the PR, and verify it matches the design's Context, or update the design and the `init` spec if it doesn't
- [x] 1.2 Draft `skills/peer-review/SKILL.md` from the design's decisions (managed-by-flo note, review, apply, re-review, missing reviewer, handoff), and verify each requirement in the `peer-review` spec is covered by a line of the skill
- [ ] 1.3 Refine the skill's wording with the owner over several rounds in the PR, and verify the owner approves the text

## 2. `flo init`

- [x] 2.1 Add `init` to `bin/flo.js`: copy every skill in the package's `skills/` into `.agents/skills/` (replacing earlier copies), link `.claude/skills/<name>` → `../../.agents/skills/<name>` when `.claude/skills/` exists, leave anything that isn't a symlink and exit 1, and print one line per path written. Verify by running it in a scratch directory with and without `.claude/skills/`
- [x] 2.2 Write `test/init.test.js` covering each `init` spec scenario in temporary directories, and update `test/cli.test.js` for the `cli` delta (usage lists `init`, unknown word is no longer `init`, nothing written for anything but exactly `init`). Verify `npm test` passes
- [x] 2.3 Add `skills/` to `files` in `package.json` and bump `version` to `0.2.0`, and verify `npm pack --dry-run` lists `skills/peer-review/SKILL.md` and nothing from `.agents/` or `.claude/`

## 3. Docs and record

- [x] 3.1 Update `README.md` with `npx flo-ai init`, what it installs and where, and that rerunning it updates the skills. Verify every command it shows runs as written from a scratch directory
- [x] 3.2 Update `edda/vision.md` so it no longer says the command does only `--help` and `--version`, and record that `peer-review` is flo's first skill. Verify `edda/index.md` still describes each file accurately

## 4. Integration

- [x] 4.1 Run `npm pack`, install the tarball into a scratch project with `.claude/skills/`, run `npx flo init`, and verify the installed skill and link match the package
- [ ] 4.2 Follow `peer-review` on this change itself: a fresh frontier-class subagent reviews the implementation, findings are applied or declined, and the result goes in the PR description. Verify the PR description lists each finding and its resolution

## Workflow follow-up

- End implementation with the PR: everything pushed, and the description rewritten for review (status, what's in it, what was and wasn't verified). Then give the owner its link.
- Once the owner approves the PR, archive the change in it (`openspec archive flo-2-add-a-peer-review-skill`), commit and push, then squash-merge on the owner's word. The merge releases `0.2.0`.
