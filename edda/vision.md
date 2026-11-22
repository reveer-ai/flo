# What flo is

Stated by the project owner on 2026-11-21, and corrected in FLO-1's proposal review the same day. This is the product definition so far; work should trace back to it.

flo is for workflow: it will handle the entire workflow for developing agentic software, as the owner sees makes sense. It isn't only about reviewing agentic work (owner, 2026-11-21, correcting an earlier framing).

Review is the idea flo started from: an agent should spin out a review agent before code goes to a human for review, and designs and specs should get reviewed the same way. That's one part of the workflow, not the whole of it.

What flo holds beyond `peer-review` isn't scoped yet. FLO-1 set up the repository and shipped an empty package, and FLO-2 added the first skill.

## What it ships as

An npm package, **`flo-ai`**, whose command is **`flo`**. The npm name `flo` belongs to an unrelated package, so `npx flo` won't run flo; it has to be `npx flo-ai`.

flo ships skills, and `flo init` installs them: it copies them into the project's `.agents/skills/`, and if `.claude/skills/` exists, it symlinks them there to the `.agents/skills/` copies (owner, 2026-11-21). Rerunning it updates them. Besides `init`, the command answers only `--help` and `--version`.

The first skill is **`peer-review`** (FLO-2, `0.2.0`): once an agent finishes an implementation, a fresh agent on a frontier-class model reviews it, the implementer applies what holds up, and the work goes to the user following the project's own handoff norms. flo's own repo doesn't use it yet; adopting it would change [workflow.md](workflow.md), which is a separate decision.

## Prior art for scoping

Each of the owner's projects has worked out its own version of this workflow by hand. Read these when flo is scoped:

- `../jen/.agents/skills/review-change/` and `../jen/.agents/skills/deliver-change/`: skills to review a change on its pull request, then hand it to the maintainer.
- `../edda/edda/conventions.md` ("Hand work to Josh for review before anything else") and `../edda/edda/ideas.md` (ending implementation with a handoff for review, listed as an idea).

flo's own [workflow.md](workflow.md) is how flo is built, not yet what flo prescribes.
