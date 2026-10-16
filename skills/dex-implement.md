---
name: dex-implement
description: Build a dex-spec phase with a Sonnet 5.5 orchestrator and a Haiku team, one phase at a time (default) or all phases in parallel, finalising the spec after the first slice. Use for "dex implement", "build the spec", "run the phase".
---

**Dex implement** builds the spec phase by phase. PROTOTYPE, built 2026-10-09 for #77.

## Opening line

Start with one line, so the human knows where they are and how long it takes:

```
[<vault> vault] dex-implement #<n>: <k> phases, one question on the pace. Say park to save a thought for later.
```
Readable: name the vault, the skill and the issue, and roughly how many questions are coming. "park" saves the place with `node dex-vault/.dex/vault.mjs park`.

## Step 0. Ask the pace (the human chooses; one question, recommended option first)

1. **One phase at a time (Recommended).** Build a phase, gate it, review it, fix what the review really finds, checkpoint, and only then start the next. Total tokens are the same as the other option, spread over more time, and you can stop between phases. What a review teaches (a missing rule, a test that checks the wrong thing) goes into the builder instructions before the next phase starts, so the same mistake is not built twice. Best on a metered or limited plan (for example a Pro account).
2. **All phases at once.** Up to 7 builders run in parallel (one slot stays free for escalation), then the reviews run together. The total number of tokens is about the same, the waiting is much shorter, and the usage arrives in one burst, so a plan limit is reached sooner. A mistake in the builder instructions is repeated in every phase before any review can catch it. Offer it after the first phase has passed its review; run the first phase alone if the instructions have not been tried before.

State the measured cost before asking: a build run of about 10 modules costs roughly 70k to 95k tokens, a phase review roughly 70k to 95k, a fix round about 117k, so one phase is roughly 230k to 350k tokens. Each agent also pays about 34k tokens of fixed overhead before it does any work, which is why a run takes about 10 tasks, not one. Record the choice in `RUNLOG.md`.

## Hard rules
1. Build only against a spec. A FINAL spec is read-only for builders; a builder that disagrees writes `spec-dispute.md` and builds to the spec as written.
2. No more than 8 live agents, one slot always free for escalation. A new agent is spawned for the next lot; an agent that crosses its token target is deleted at the next task boundary, not mid-task.
3. Where a draft spec has real unknowns, the first pass is a **slice**: the thinnest end-to-end code and test, plus honest `## Deltas` (where the draft was wrong, unclear or untestable). The orchestrator then freezes FINAL with the deltas included. Well-understood work can skip the slice.
4. Every phase passes a mechanical gate before review: files exist, a lint (no network, shell, environment, eval or file writes), junk-input probes (a module returns `{ok:false}` and never throws), a check for tests that admit they test nothing, and the test run. A passing gate is not a passing review.
5. Reasoning and output logs are captured into the dexspine (routed by `log-route`) where the harness exposes them; if it does not, capture the agent's output and tool summaries and say so.
6. The human's veto cancels pending work.

## Steps
1. Ask the pace (step 0). Pack the phase into runs of about 10 tasks.
2. Build each run, then gate it. A failed gate goes back to the builder once, with the exact failures.
3. Hand the phase to **dex-review**. Check every finding against the code before acting: fix the real ones, reject the over-literal or wrong ones and say why. Attempt cap 2, then Opus 5.5 with a Sonnet team.
4. Before starting the next phase, put what the review taught into the builder instructions.
5. End with **dex-checkpoint**.
