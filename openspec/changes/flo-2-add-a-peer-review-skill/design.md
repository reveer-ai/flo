# Design

## Context

flo is at `0.1.0`: `flo` answers `--help` and `--version`, the package ships only `bin/` and `README.md`, and every other argument, `init` included, is an error (`cli` spec). See proposal.md for motivation.

Constraints:

- Nothing flo ships may depend on one coding assistant (`openspec/config.yaml`). Claude Code, Codex and OpenCode all read skills as a folder holding a `SKILL.md` with `name` and `description` frontmatter. Codex and OpenCode read them from `.agents/skills/`, and Claude Code reads them from `.claude/skills/`.
- `flo init` copies skills into `.agents/skills/`, and symlinks them from `.claude/skills/` when that exists (`edda/vision.md`).
- jen's `review-change` and `deliver-change` are the prior art. They assume a pull request, OpenSpec and a docs site. flo's skill can't assume any of those.

## Goals / Non-Goals

**Goals:**
- One short skill an agent can follow in any coding assistant, for any kind of implementation, in a project with or without its own conventions.
- `flo init` installs it in one command and can be rerun safely.

**Non-Goals:**
- Reviewing designs and specs, posting reviews on pull requests, or a review checklist per language. These can come later.
- Installing `peer-review` into flo's own repo. That changes how flo is built, which `edda/workflow.md` sets, so it's a separate decision.
- Uninstalling, or choosing which skills to install. flo ships one.

## Decisions

### The skill

**One file, `skills/peer-review/SKILL.md`, in three steps: review, apply, hand off.** The description triggers it when an implementation is finished and before it goes to the user. It's a single file because each step is a few sentences long. jen splits review and delivery into two skills because they happen at different times (on the PR, and after approval). Here, all three steps happen in one sitting. *Alternative:* separate `review` and `handoff` skills. Rejected for now, since a skill that's only ever run halfway isn't useful, and one file is easier to grow.

**The reviewer is a fresh subagent on a frontier-class model.** The skill asks for a model at least as capable as Claude Opus 5.5 or GPT Sol 6.1, and names them only as examples, so the skill doesn't go stale or tie itself to one vendor. The same model as the implementer is fine. What matters is the fresh context, not a different model. The skill doesn't say how to start a subagent, since each assistant has its own way.

**What the reviewer gets:** what the work was meant to do (the user's request, and the issue, spec or design if they exist), where the changes are (the diff, branch or files), and how the project checks its work. **What it doesn't get:** the implementer's reasoning or summary of why it's right, so it judges what was built, not what was meant. It reads, runs the project's checks and reproduces each finding, but changes nothing. It reports findings, each with where it is and how to show it, plus what it couldn't verify.

**What the reviewer judges**, condensed from `review-change`: whether the work does what it was meant to, and simply. Whether it holds up when things fail and breaks nothing that worked. Whether its tests would fail without it. And whether docs and records still say what's true. Decisions the user made are raised as questions, not changed.

**Applying feedback: fix what holds up, and decline the rest openly.** The implementer checks each finding and fixes the real ones. It declines one only when it can show the finding is wrong, and gives its reason in the handoff. A finding that would change something the user decided goes to the user as a question. *Alternative:* apply everything. Rejected, because reviewers are sometimes wrong, and applying a wrong finding blindly is worse than declining it out in the open.

**Re-review until nothing new, at most three rounds.** If the fixes changed more than wording, a fresh reviewer checks each earlier finding and then what changed since, without reopening what was settled. The skill stops when a review finds nothing new. After three rounds it stops anyway and hands off what's still open, since a loop that won't settle is something the user should see. *Alternative:* a single round. Rejected, because fixes are new code that nobody has reviewed yet.

**If no capable reviewer can be started, say so.** The agent doesn't skip the review silently or fall back to a weaker model without saying. The handoff opens with the fact that the review didn't run, or ran on a weaker model and which one.

**The handoff follows the project's norms.** The agent looks for how the project wants work handed over: its agent instructions (`AGENTS.md`, `CLAUDE.md`), its project record, and its contributing guide. Then it does that, for example a pull request description or a stop before committing. If it finds nothing, it ends with a short report: what was done, what the review found and how each finding was resolved, what was and wasn't verified, and anything that needs the user's decision. The review appears only in the handoff. It isn't written into the repo.

**Terms.** The skill calls Claude Code, Codex and OpenCode "coding assistants", and uses "agent" only for the model doing the work: the implementer and the reviewer.

**The text is written with the owner.** The decisions above set what the skill says. The wording gets drafted in the PR and refined with the owner over several rounds before the change is done.

### `flo init`

**`flo init` installs into the current directory and takes no options.** For each skill in the package's `skills/`:

1. It copies the skill to `.agents/skills/<name>/`, replacing any earlier copy. Rerunning `flo init` updates the skill to the installed version. A local edit to a copy is lost, and the skill says it's managed by flo.
2. If `.claude/skills/` exists, it links `.claude/skills/<name>` to `../../.agents/skills/<name>`. The link is relative, so it survives moving or cloning the repo. An existing link is replaced. If the path is already the `.agents/skills/<name>` copy itself, because `.claude/skills` and `.agents/skills` are one folder through a symlink, the skill is already linked: `flo init` makes no link there and exits 0 (owner, 2026-11-22). The copy step has already replaced that folder with flo's copy, silently, like any other copy. That's intended: in a shared folder, flo owns both paths (owner, 2026-11-22). Anything else at that path is left alone and reported on stderr, and `flo init` exits 1, so it never deletes something the user made.

It creates `.agents/skills/` if needed, but never `.claude/skills/`, since its existence is the signal that Claude Code is in use. It prints one line per file or link it wrote. *Alternative:* skip skills that are already installed. Rejected, because then an upgraded flo couldn't update them.

**Plain Node built-ins, as in FLO-1.** `fs.cpSync` and `fs.symlinkSync`, with no dependencies. The package's `files` gains `skills/`.

**Tests** run `flo init` in temporary directories and cover: a fresh project, a project with `.claude/skills/`, a rerun that updates a copy, a real folder sitting where a link should go, and `.claude/skills` and `.agents/skills` being one folder.

## Risks / Trade-offs

- [The skill names today's models, and they'll age] → They're examples of a capability bar, not a requirement, and updating them is a one-line patch release.
- [An assistant can't start a subagent, or can't pick its model] → The skill says so in the handoff, so the user knows the work wasn't reviewed.
- [Rerunning `flo init` overwrites local edits to a copied skill] → The skill's header says flo manages it. Projects customize through their own norms, which the skill reads, not by editing the skill.
- [Symlinks on Windows need Developer Mode or admin rights] → `flo init` reports the failure and exits 1. The `.agents/skills/` copy is still in place, so Codex and OpenCode work regardless. Windows support can be fixed when someone needs it.
- [Review rounds cost time and tokens on small changes] → Re-review only follows fixes that changed more than wording, and stops after three rounds.

## Migration Plan

None. `flo init` used to be an error, and nothing installed by flo exists yet. `0.2.0` releases through the existing workflow when the PR merges.
