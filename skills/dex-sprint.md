---
name: dex-sprint
description: Dex sprint. Runs two or more batches of issues (dex loops) in the same project at once. Each round puts the next questions of every live batch into one popup, up to its limit of four, so several workloads move together. Use for "dex sprint", "run these batches together", or several workloads in one project at the same time.
---

**Dex sprint** runs several dex loops side by side. Each batch runs its own loop (pick, grill, spec, implement, review). The sprint gathers their open questions into one popup per round.

| | dex-loop | dex-sprint |
|---|---|---|
| Batches | one, the next logical batch | two or more, chosen by the human |
| Questions per round | that batch's open questions | 2 per batch by default (the human may set 1), 4 at most per popup |
| Use when | one workload | several workloads in the same project |

## Hard rules

1. **Every dex-loop rule applies to every batch.**
2. **The popup cap.** One popup holds at most 4 questions: 2 batches with 2 questions each, or 4 batches with 1 each. With more batches than slots, the batches that waited longest go first.
3. **Independent questions only.** No question in a popup may depend on another in the same popup. A dependent question waits for the next round.
4. **No shared files.** Two batches that would change the same file never build at the same time. The second builds after the first one's review.

## 1. Open

1. Read the open issues and the vault's recent journal entries.
2. Reply with:
   - what has been worked on (three to six lines);
   - the five most recently active open issues, one line each on where they stand;
   - five things the human said that are at risk of being lost (quote, source, why it matters now);
   - every open issue in exactly one batch, each batch with P02, P05, E03 and its next issue.

   Check that every open issue sits in exactly one batch before sending.

## 2. Pick the batches

Ask in one popup: which batches run (two or more, recommended first) and how far (one issue per batch, the whole batch, or until the human stops). Then open with:

```
[<vault> vault] Sprint: A = <batch> (#<n>), B = <batch> (#<n>). <k> questions each per round. Say park to save a thought for later.
```
Readable: name the vault, the batches and their first issues, and the questions per round.

## 3. Rounds

1. **Gather** each live batch's next independent questions from the skill it is in: a grill question, a spec check, a yes to build, or a review verdict.
2. **Ask** them in one popup, each headed with its batch and issue (`A #12`). A batch with no question this round (mid-build) gives its slot to another batch; say so in the question.
3. **Record** each answer twice (original and checked copy) in that batch's journal.
4. **Work** between rounds, with no question needed: recording, drafting the spec, building what the human said yes to, running the tests. Builds follow rule 4.
5. **Checkpoint** each batch after each skill. Report what shipped, not only coverage.

A new thought mid-round follows dex-loop 4b: hold the round, find the batch or issue it belongs to, then ask the held questions again.

## 4. When a batch finishes

A batch is done when its P05 is met and the human agrees. In the next popup, offer the next batch to bring in (recommended first), or carry on with the batches still running.

## 5. Stop

The sprint ends when every batch is done or the human stops it. Say what shipped in each batch, what is parked and which batches you would run next. Save the sprint record in the vault journal.
