---
name: dex-implement
description: Build a dex-spec phase by phase, one phase at a time (default) or all phases with one review, finalising the spec after the first slice. Use for "dex implement", "build the spec", "run the phase".
---

**Dex implement** builds the spec phase by phase. The vault agent builds alone (rule 20).

## Opening line

Start with one line, so the human knows where they are and how long it takes:

```
[<vault> vault] dex-implement #<n>: <k> phases, one question on the pace. Say park to save a thought for later.
```
Readable: name the vault, the skill and the issue, and roughly how many questions are coming. "park" saves the place with `node dex-vault/.dex/vault.mjs park`.

## Step 0. Ask the pace (one question, recommended option first)

1. **One phase at a time (Recommended).** Build a phase, gate it, review it, fix what the review really finds, checkpoint, then start the next. You can stop between phases, and what a review teaches goes into the next phase, so the same mistake is not built twice.
2. **All phases, one review.** Build every phase with the gate after each, then review the whole diff once. It finishes sooner. A mistake is repeated in every phase before the review can catch it, so offer it once the first phase has passed a review, or when the work is well understood.

Record the choice in `RUNLOG.md`.

## Hard rules

1. Build only against a spec. A FINAL spec is read-only during the build: if you disagree with it, write `spec-dispute.md`, build to the spec as written, and raise the dispute with the human.
2. Where a draft spec has real unknowns, the first pass is a **slice**: the thinnest end-to-end code and test, plus honest `## Deltas` (where the draft was wrong, unclear or untestable). Then freeze FINAL with the deltas included. Well-understood work can skip the slice.
3. Every phase passes a mechanical gate before review: files exist, a lint (no network, shell, environment, eval or file writes in pure modules), junk-input probes (a module returns `{ok:false}` and never throws), a check for tests that test nothing, and the test run. A passing gate is not a passing review.
4. A task gets 2 attempts. After the second failed review, the human decides: park it, change the spec, or try a stronger model.
5. The human's veto cancels pending work.

## Steps

1. Ask the pace (step 0).
2. Build the phase, then gate it. Fix what the gate finds.
3. Hand the phase to **dex-review**. Check every finding against the code before acting: fix the real ones, reject the wrong ones and say why.
4. Before the next phase, carry what the review taught into how you build it.
5. End with **dex-checkpoint**.
