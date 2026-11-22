---
name: peer-review
description: Have a fresh agent review an implementation, apply what it finds, then hand the work to the user. Use once you've finished implementing something, before you hand it to the user.
---

# Peer review

flo manages this file. `flo init` replaces it, so edits here are lost. To change how work is reviewed or handed off in this project, put it in the project's own instructions, which this skill follows.

You've finished implementing something. Before the user sees it, an agent that didn't write it reviews it. Then you fix what holds up and hand it off.

## 1. Get a review

Start a reviewer: a subagent with a fresh context, on a model at least as capable as Claude Opus 5.5 or GPT Sol 6.1. Those are examples of the bar, not the only choices, and your own model is fine. What matters is the fresh context.

Brief it with:

- **The goal**: what the user asked for, and the issue, spec or design if they exist.
- **The work**: where the changes are (the diff, branch or files).
- **The checks**: how the project verifies its work (tests, linters, builds).

Don't give it your reasoning or your case for why the work is right. It should judge what was built, not what you meant.

Ask it to judge whether the work:

- does what it was meant to, and simply;
- holds up when things fail, and breaks nothing that worked;
- has tests that would fail without it;
- leaves docs and records saying what's now true.

It runs the checks, reproduces each finding before reporting it, drops what it can't show, and changes no files. It reports each finding with where it is and how to show it, plus any check it couldn't run. Where it disagrees with something the user decided, it asks a question instead of proposing a fix.

If you can't start a reviewer that meets the bar, don't skip the review silently. If you can't start one at all, say so at the start of the handoff. If you can only use a weaker model, run the review with it and open the handoff by naming that model.

## 2. Apply what holds up

Check each finding yourself. Fix the ones that hold up. Decline one only when you can show it's wrong, and give your reason in the handoff. A finding that would change something the user decided goes to the user as a question, unapplied.

If your fixes changed more than wording, start a new reviewer with a fresh context. Give it the same brief plus the earlier findings, and have it verify each one, then review what changed since, without reopening what was settled. Stop when a review finds nothing new. After three rounds, stop anyway, and list what's still open in the handoff.

## 3. Hand off

Look for how the project wants work handed over: its agent instructions (such as `AGENTS.md` or `CLAUDE.md`), its project record, its contributing guide. Hand off that way, for example in a pull request description, or by stopping before you commit.

If the project says nothing about it, end with a short report:

- what was done;
- what the review found, and how each finding was resolved;
- what was and wasn't verified;
- what needs the user's decision.

The review goes in the handoff only. Don't write it into the project's files.
