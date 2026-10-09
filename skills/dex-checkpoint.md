---
name: dex-checkpoint
description: End-of-skill write-back to the vault. The skill does the judgement (verbatim journal, node proposals for the human's yes); the vault tool does the mechanics (coverage, actions, RUNLOG, story chapter, Folio, validateVault). Called at the end of every dex skill.
---

**Dex checkpoint** closes every dex skill so the vault never goes stale (#76, #13 upward). PROTOTYPE, built 2026-10-09 for #77.

## Skill does (judgement)
1. Journal the session verbatim with its source; the human's words stay separate from your reading.
2. Propose node changes (never apply them). Each is inert until the human says yes; the replaced rows are kept in `05_actions/work/checkpoint-<date>.md`.
3. Say whether a good reason exists to file an issue unasked: blocks the outcome, coverage dropped, contradiction found, safety or data risk. Otherwise only suggest.

## Vault tool does (mechanics)
`vault checkpoint`: recompute per-question coverage (weak counts half; the bar is 90%), update actions, add the RUNLOG row, append one dated story chapter (old chapters are never rewritten), rebuild the Folio, run `validateVault`.

## Hard rules
- Verified is written only for a human decision with their name and date.
- Anything outward (issues, pushes, comments) needs an explicit yes, one action at a time.
- If a skill run did not end here, the run is marked incomplete.
