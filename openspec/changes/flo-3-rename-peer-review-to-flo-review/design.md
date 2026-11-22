# Design

## Context

flo `0.2.0` ships one skill, `peer-review`, and `flo init` installs every folder in the package's `skills/` under its own name. See proposal.md for why it's renamed.

## Goals / Non-Goals

**Goals:**
- The shipped skill is `flo-review`, and every later skill has to carry the `flo-` prefix.

**Non-Goals:**
- Changing what the skill says.
- Cleaning up an installed `peer-review`. Nobody has one (owner, 2026-11-22).

## Decisions

**`flo-review`, not `flo-peer-review`** (owner, 2026-11-22). Shorter, and the prefix already says whose review it is. The skill's heading stays "Peer review", since it names the practice the skill describes, and the owner approved that text in FLO-2.

**The prefix is a requirement in the `init` spec, checked by a test.** A test that every folder in `skills/` and its `name` start with `flo-` catches a future skill that forgets it. *Alternative:* have `flo init` add the prefix when it installs. Rejected: the name in the package and the installed name would differ, and the `name` frontmatter would need rewriting.

**The `peer-review` spec is removed and `flo-review` added, rather than edited in place.** OpenSpec names a capability by its folder, so a rename is a remove and an add. After archiving, the empty `openspec/specs/peer-review/` is deleted.

**Patch release, `0.2.1`.** It fixes a naming mistake in `0.2.0`, and no one depends on the old name.

## Risks / Trade-offs

- Anyone who did run `npx flo-ai init` on `0.2.0` keeps a stale `peer-review` alongside `flo-review` → Accepted; the owner confirmed no one has.
