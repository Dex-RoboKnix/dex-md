---
provenance: AAC
---

# Changelog

## Unreleased

- **Held questions leave the machine.** `park` writes `07_inbox/held/<skill>[-<issue>].md`, tracked with the vault, with one DEX838 line checked in strict mode before it is written. Several questions can be held at once; `resume` lists them oldest first, and a line that does not parse waits for the owner and is never acted on. An old `.dex/state/<skill>.json` moves across on the first `park` or `resume`.
- **A late answer arrives.** `vault.mjs inbox` reads the owner's comments on each held question's issue with the GitHub CLI and writes each new one as `07_inbox/events/<comment-id>.md`: a DEX838 line checked in strict mode, then the comment verbatim, status `pending`. A second pull adds nothing. Only the signed-in account's comments made after the question was parked count; other accounts are listed and never acted on, and comments the agent posted (ending in `<!-- dex:agent -->`) are skipped. One run at a time, held by a lock; without `gh` it says so and writes nothing. New module `p6/inbox-events`.
- **The next run resumes it.** A session starts by reading late answers: `inbox`, then `resume`, which now lists each held question with any answer that came in on GitHub. `vault.mjs answer --event <id> --checked "<copy>"` records the answer twice in a new journal entry (the comment verbatim and the spelling-checked copy, with the comment id as its source), marks the event `done` and the question `answered`, and prints where to carry on. An answer whose question is not held waits for the owner. CLAUDE.md gains rule 8 (late answers first) and the marker in rule 1; dex-loop reads late answers before it picks, and on each `/loop` tick. New module `p6/late-answer`.
- **Timers and a quiet outbox.** `vault.mjs timer add|list|done`: follow-ups and schedules the agent sets for itself, in `07_inbox/timers/` with a DEX838 line. `inbox` turns each due timer into an event (also without GitHub); a follow-up is then done and a schedule moves to its next time after now, so a week away fires it once. `vault.mjs digest` builds the one message a run may send: only what is not yet in `06_journal/reported.md`, nothing when nothing is new, and at most one digest a day unless the owner asks. New modules `p6/timer-due` and `p6/digest`.
- **The DEX838 parser is an engine module** (`p6/dex838-parse`), built by `tools/make-dex838.mjs` from the published dexspine-core parser at a pinned commit; a test checks the copy against that commit.
- **Rule 22.** Every interruption is an addition, never a stop. A question that comes back closed or denied does not stall the work: the agreed work carries on with the recommended option and the question stays held to confirm; outward steps still wait for their own yes. Only a typed stop means wait.
- **An opening for people.** dex.md now opens with what Dex is, who it is for, the problems it solves, what you get, a first session and how it works best, above the rules.

## 0.11.3 (2026-11-13)

- **Get back on track (rule 22).** A stopped or closed question means stop, say what is held and wait. An answer to something else parks the open question, deals with the new point, then asks the held question again as it was asked. The rule is in dex.md, `method/01-rules.md`, dex-grill, dex-loop and the CLAUDE.md template.
- **An install that stopped part-way carries on.** `stage` in `00_index.md` records the last stage finished (`2` to `6b`, then `built`). A new session reads it and offers to carry on from the next stage.
- **Rules mirror.** `method/01-rules.md` rules 2 and 3 now match dex.md (the Stage 4b exception and the pinned clones).
- **README.** A Start section: the download link, where to put the file, what to say, and what is needed.
- **Version.** dex.md, `package.json` and the vault tool report 0.11.3. In the vault: the CLAUDE.md managed block gains rule 7 and `stage` is set (see the upgrade table).

## 0.11.2 (2026-11-12)

- **Install needs no GitHub sign-in.** dex-md is public, so the pinned clones in dex.md section 3 need no sign-in. A sign-in is needed only for the private-repo option (Stage 1b) and for ShadowOS (Stage 6b, a private repo for now).
- **README header.** The README states the layer (L2), the licence (AGPL-3.0-or-later for the open Core edition) and the pre-1.0 status.
- **Licence text.** The full AGPL-3.0 text is in `LICENSE`.
- **Consistency pass.** Current names are used throughout, the licence wording is the same in every file, and the private-repo and ShadowOS notes match dex.md.
- **Send what you make.** dex-loop (hard rule 6) and dex-checkpoint (step 4) send every file made for the human to their device with `SendUserFile`, with a one-line caption; a path in the chat is not delivery. Working files and secrets are never sent.
- **Provenance on the skills.** Each of the seven skills in `skills/` carries `provenance: AAC` in its frontmatter.
- **Version.** dex.md, `package.json` and the vault tool report 0.11.2. Nothing in the vault changes on upgrade.
