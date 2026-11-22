# Spec Delta

## Purpose

The `peer-review` skill that flo ships: what it has an agent do between finishing an implementation and handing it to the user, so an independent agent reviews the work before the user sees it.

## ADDED Requirements

### Requirement: The skill runs when an implementation is finished

flo SHALL ship a skill named `peer-review` as a `SKILL.md` with `name` and `description` frontmatter. Its description SHALL say to use it once an implementation is finished and before the work is handed to the user. The skill SHALL say that flo manages it and that `flo init` replaces local edits.

#### Scenario: An agent finishes implementing

- **GIVEN** a project where `peer-review` is installed
- **WHEN** an agent finishes implementing something the user asked for
- **THEN** the skill's description matches that moment, and it runs before the agent hands the work over

#### Scenario: Marked as managed by flo

- **WHEN** someone reads the installed `SKILL.md`
- **THEN** it says flo manages the file and that `flo init` overwrites changes to it

### Requirement: The skill depends on no single coding assistant

The skill SHALL work in any coding assistant that reads skills, such as Claude Code, Codex or OpenCode. It SHALL NOT rely on one assistant's tools, commands or way of starting subagents.

#### Scenario: Read in another assistant

- **WHEN** the skill is followed in Codex or OpenCode instead of Claude Code
- **THEN** every step can be carried out there, and no step names a tool only one assistant has

### Requirement: A fresh subagent on a frontier-class model reviews the work

The skill SHALL have the implementing agent start a review subagent with a fresh context, on a model at least as capable as Claude Opus 5.5 or GPT Sol 6.1. It SHALL name those models as examples of the bar, not as the only ones allowed. The reviewer's model MAY be the implementer's own.

#### Scenario: Reviewer meets the bar

- **WHEN** the agent starts the review
- **THEN** the reviewer runs in a new context on a model at least as capable as the examples

#### Scenario: Same model as the implementer

- **GIVEN** the implementer itself runs on Claude Opus 5.5
- **WHEN** it starts a reviewer on Claude Opus 5.5 with a fresh context
- **THEN** that satisfies the skill

### Requirement: The reviewer sees the goal and the work, not the reasoning

The reviewer SHALL be given what the work was meant to do in its original form (the user's request, and the issue, spec or design themselves where they exist, not a summary of them), where the changes are, and how the project checks its work. It SHALL NOT be given the implementer's reasoning or its case for why the work is right.

#### Scenario: Briefing the reviewer

- **WHEN** the implementer briefs the reviewer
- **THEN** the reviewer gets the request and any issue, design and specs as they are written, the location of the changes and the project's checks, and no argument for the implementation

### Requirement: The reviewer checks and reports without changing anything

The reviewer SHALL judge whether the work does what it was meant to, simply. It SHALL also judge whether it holds up when things fail, breaks nothing that worked, and has tests that would fail without it. It SHALL run the project's checks, reproduce each finding before reporting it, and change no files.

#### Scenario: A finding is reported

- **WHEN** the reviewer reports a finding
- **THEN** the report says where it is and how to show it

#### Scenario: A suspicion can't be shown

- **WHEN** the reviewer can't reproduce something it suspects
- **THEN** it leaves it out of the findings

#### Scenario: Checks the reviewer couldn't run

- **WHEN** a project check can't be run
- **THEN** the report says which check didn't run

#### Scenario: A decision the user made

- **WHEN** the reviewer disagrees with something the user decided
- **THEN** it reports it as a question for the user, not as a fix

### Requirement: The implementer applies what holds up

The implementing agent SHALL check each finding and fix the ones that hold up. It MAY decline a finding only when it can show the finding is wrong, and SHALL mention it briefly in the handoff. A finding that would change something the user decided SHALL go to the user as a question, unapplied.

#### Scenario: A valid finding

- **WHEN** a finding holds up
- **THEN** the implementer fixes it

#### Scenario: A wrong finding

- **WHEN** the implementer can show a finding is wrong
- **THEN** it leaves it unfixed, and the handoff mentions it in a few words

#### Scenario: A finding against the user's decision

- **WHEN** a finding would change something the user decided
- **THEN** the implementer doesn't apply it, and the handoff asks the user

### Requirement: Fixes are re-reviewed until nothing new is found

After fixes that change more than wording, a fresh reviewer SHALL check each earlier finding and then what changed since, without reopening what was settled. Review SHALL stop when a review finds nothing new, and after three rounds at most.

#### Scenario: Fixes changed code

- **WHEN** the implementer's fixes change more than wording
- **THEN** a fresh reviewer verifies the earlier findings and reviews the changes since

#### Scenario: Only wording changed

- **WHEN** the fixes change only wording
- **THEN** no further review round is needed

#### Scenario: Review won't settle

- **WHEN** the third round still finds something new
- **THEN** the agent stops reviewing and the handoff lists what's still open

### Requirement: A missing review is reported

If the agent can't start a reviewer that meets the bar, it SHALL NOT skip the review silently. The handoff SHALL open by saying the review didn't run, or that it ran on a weaker model and which one.

#### Scenario: No subagents available

- **WHEN** the coding assistant can't start a subagent
- **THEN** the handoff's first line says the work wasn't reviewed

#### Scenario: Only a weaker model available

- **WHEN** the review runs on a model below the bar
- **THEN** the handoff opens by naming that model

### Requirement: The handoff follows the project's norms

If the project's instructions say how to hand off work, the agent SHALL hand off that way. If they don't, it SHALL end with a report as short as it can be that says what was done, what was and wasn't verified, and what needs the user's decision, with one line on what the review caught and anything declined.

#### Scenario: The project has handoff norms

- **GIVEN** the project's `AGENTS.md` says to end with a pull request description for review
- **WHEN** the review has settled
- **THEN** the agent hands off through the pull request description

#### Scenario: The project has none

- **GIVEN** the project's instructions and records say nothing about handing off work
- **WHEN** the review has settled
- **THEN** the agent ends with the default report

### Requirement: The review stays out of the repository

The review's findings and their resolutions SHALL appear in the handoff only. The skill SHALL NOT have them written into the project's files.

#### Scenario: After the review

- **WHEN** the handoff is done
- **THEN** no file in the project holds the review
