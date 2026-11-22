# Tasks

## 1. Rename

- [x] 1.1 Move `skills/peer-review/` to `skills/flo-review/` and set its `name` to `flo-review`. Verify nothing outside `openspec/changes/archive/` still names `peer-review`, apart from this change
- [x] 1.2 Update `test/init.test.js` for the new name, and add a test that every shipped skill's folder and `name` start with `flo-`. Verify `npm test` passes
- [x] 1.3 Bump `version` to `0.2.1` and update the `package.json` description. Verify `npm pack --dry-run` lists `skills/flo-review/SKILL.md` and no `peer-review`

## 2. Docs and record

- [x] 2.1 Update `README.md`, `edda/vision.md` and `edda/index.md` for the new name, and record the `flo-` prefix rule in `edda/vision.md`

## Workflow follow-up

- Once the owner approves the PR, archive the change (`openspec archive flo-3-rename-peer-review-to-flo-review`), delete the emptied `openspec/specs/peer-review/`, commit and push, then squash-merge on the owner's word. The merge releases `0.2.1`.
