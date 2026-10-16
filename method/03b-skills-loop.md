---
provenance: AAC
source: dex.md 0.9 section 3b
---

## 3b. The dex skills loop

After the vault is built, the work runs as a loop of five skills, installed in Stage 4b. Each one is a prototype: it is corrected after it has been run on a real project.

```
dex-grill -> dex-spec -> dex-implement -> dex-review -> (dex-spec -> dex-implement -> dex-review) until the outcome is met
every skill ends with: dex-checkpoint
```

| Skill | Does | Team |
|---|---|---|
| `dex-grill` | grills the human, one ticket or node at a time, up to 3 independent questions per popup, answers kept verbatim | a Sonnet orchestrator (medium) and up to 8 agents for views and research |
| `dex-spec` | turns settled grill answers into a spec of 5 phases of tracer bullets. The spec is a DRAFT; it is **finalised late**, after the first slice has taught what the draft got wrong, and only after a `dex-review` PASS | a Sonnet orchestrator and Haiku spec-writers |
| `dex-implement` | builds one phase at a time against the FINAL spec. A builder never edits a FINAL spec: a disagreement becomes a dispute note | a Sonnet orchestrator and a Haiku team, one team at a time |
| `dex-review` | checks the build against the spec: acceptance coverage, drift, tests that really test what they are named for, and devops checks | the full team, including testing and devops |
| `dex-checkpoint` | the judgement half of a checkpoint (the verbatim journal and the node proposals for the human's yes); `vault.mjs checkpoint` does the mechanics | the orchestrator |

**The pace is the human's choice** (asked at the start of `dex-implement`): **one phase at a time** (the default and the recommended option on a metered or limited plan) or **all phases at once** (up to 7 builders in parallel). The total tokens are about the same either way; parallel finishes sooner but spends them in one burst, and repeats any mistake in the builder instructions in every phase before a review can catch it. Offer parallel after the first phase has passed its review. Measured on this build: about 70k to 95k tokens for a run of 10 modules, about the same for a phase review, roughly 230k to 350k per phase.

**Limits (rule 20).** A task gets **2 attempts**. After the second failed review round it goes to a higher model (Opus with a Sonnet team). A retry must carry a new change, otherwise it is refused and not counted. At most 8 agents are live, one slot kept free for escalation. A Haiku agent costs roughly 34k tokens before it does any work in a typical harness, so give each run about five tasks, not one. **Reasoning capture:** how much of an agent's reasoning the harness exposes is unchecked. Check it first and, if it is not exposed, save the agent's output and tool summaries instead and say so.

**Every finding is checked before it is acted on.** Reviewers (people or models) are advisory. A claim in a review is verified against the text before anything changes.

### Step 2: keeping the work going

The loop is step 2 of dex.md. Two skills run it: `dex-loop` works one batch of issues through the skills above, and `dex-sprint` runs several batches at once, gathering their questions into one popup per round (at most four).

1. **Working doesn't mean changing.** Reading, mapping, drafting and suggesting run freely. Each change (a file outside the working area, an issue comment or close, a commit, a push, a deploy) needs the human's yes to that change.
2. **Next actions.** When an issue closes, offer up to three next actions in one popup, the recommended one first: the next issue in the batch, a follow-up the work surfaced, or "stop here". Nothing starts before the human picks.
3. **When the slant is achieved.** A slant is achieved when every loop under it has met its success criteria (P05) and the human agrees. Until then, step 2 keeps going.
4. **Tool work is kept apart from project work.** During a project run, an idea for dex.md itself is filed as an issue, and the project keeps using dex.md at its pinned version. Changes to dex.md are made between runs and tagged.
