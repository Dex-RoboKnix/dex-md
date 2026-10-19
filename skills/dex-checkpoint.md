---
name: dex-checkpoint
description: End-of-skill write-back to the vault. The skill does the judgement (the journal, node proposals for the human's yes); the vault tool does the mechanics (coverage, actions, RUNLOG, story chapter, Folio, validation). Called at the end of every dex skill.
---

**Dex checkpoint** closes every dex skill, so the vault never goes stale.

## Opening line

Start with one line, so the human knows where they are and how long it takes:

```
[<vault> vault] dex-checkpoint #<n>: <k> node changes to propose. Say park to save a thought for later.
```
Readable: name the vault, the skill and the issue, and roughly how many questions are coming. "park" saves the place with `node dex-vault/.dex/vault.mjs park`.

## Skill does (judgement)

1. Journal the session with its source. The human's words are kept twice (rule 12), separate from your reading.
2. Propose node changes; never apply them. Each is inert until the human says yes. The replaced rows are kept in `05_actions/work/checkpoint-<date>.md`.
3. Report what shipped since the last checkpoint, not only coverage.
4. Say whether a good reason exists to file an issue unasked: it blocks the outcome, coverage dropped, a contradiction was found, or there is a safety or data risk. Otherwise only suggest.

## Vault tool does (mechanics)

```
node dex-vault/.dex/vault.mjs checkpoint --skill <name> --summary "<what was done>"
```
Readable: recompute coverage per question (weak counts half; the bar is 90%), update the actions, add the RUNLOG row, append one dated story chapter (old chapters are never rewritten), rebuild the Folio and validate the vault.

## Hard rules

- `VERIFIED` is written only for a human decision, with their name and date.
- Anything outward (issues, pushes, comments) needs an explicit yes, one action at a time.
- If a skill run did not end here, the run is marked incomplete.
