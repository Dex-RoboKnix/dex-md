---
provenance: AAC
---

# Use case 5: DexRoboKnix, one Folio for one vault

*Illustrative, not a real user.* This sketches a second configuration of the same repo as use case 2.

**Profile.** A maintainer who owns only one part of a monorepo, for example the release and CI side. They do not need a map of everything.

**Folder kind.** In-flight, working in one sub-folder.

**Configuration.** dex.md is placed in that sub-folder. One vault, one folio, scoped to that area. Smaller and faster to confirm. Costs: no cross-product view; the layer map is read from `CONTEXT.md`, not from the vault.

## Why-ladder (invented answers)

| Rung | Answer |
|---|---|
| 5 Procedure | "I want the release checks written down and tested." |
| 4 Process | "Releases are the same steps every time." |
| 3 Policy | "A release needs a tag." |
| 2 Principles | "Checks beat memory." |
| 1 Values | "Trust in what ships." |

## Slant

Operations: runbooks, incidents and checklists. Wrong if the area is mostly unbuilt. The lens reads Metrics as "which checks pass".

## Five skills

`SK-GRILL`, `SK-RULES`, `SK-TIMELINE`, `SK-STALL`, `SK-GOALS`.

## Privacy notes

- Credentials and CI secrets are listed, never opened.
- The vault covers only this sub-folder; other nested repos are untouched.

## What done looks like

A short vault, one folio for the area, a rules list, and issues for gaps. Compare it with use case 2: same repo, narrower scope.
