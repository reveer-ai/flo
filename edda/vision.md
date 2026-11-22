# What flo is

From the project owner, carried over on 2026-11-21 from an earlier session in `../jen` and corrected in FLO-1's proposal review the same day. This is the product definition so far; work should trace back to it.

flo is for workflow: it will handle the entire workflow for developing agentic software, as the owner sees makes sense. It isn't only about reviewing agentic work (owner, 2026-11-21, correcting an earlier framing).

Review is the idea flo started from: an agent should spin out a review agent before code goes to a human for review, and designs and specs should get reviewed the same way. That's one part of the workflow, not the whole of it.

What flo holds and how it works aren't scoped yet. That comes after FLO-1, which only sets up the repository and ships an empty package.

## Where it sits

flo is the owner's third tool for agentic work, and its own package, separate from the other two:

- **edda** (`../edda`, npm `edda-ai`) keeps a project's record in the repo, in `edda/`. flo uses it for this record.
- **clare** (`../clare`, npm `clare-ai`) is skills that explain a subject as one HTML page. Installed here with `npx clare-ai init`.

## What it ships as

An npm package, **`flo-ai`**, whose command is **`flo`**. The npm name `flo` belongs to an unrelated package, so `npx flo` won't run flo; it has to be `npx flo-ai`. Until skills exist, the command does only `--help` and `--version` (FLO-1).

## Prior art for scoping

Each of the owner's projects has worked out its own version of this workflow by hand. Read these when flo is scoped:

- `../jen/.agents/skills/review-change/` and `../jen/.agents/skills/deliver-change/`: skills to review a change on its pull request, then hand it to the maintainer.
- `../clare/edda/workflow.md`: approval gates, and opening the PR as soon as the proposal is written.
- `../edda/edda/conventions.md` ("Hand work to Josh for review before anything else") and `../edda/edda/ideas.md` (ending implementation with a handoff for review, listed as an idea).

flo's own [workflow.md](workflow.md) adopts clare's conventions for working on this repo. That's how flo is built, not yet what flo prescribes.
