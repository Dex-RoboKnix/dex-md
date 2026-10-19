---
name: dex-spec
description: Turn settled grill answers into a spec of 5 phases of tracer bullets, as a DRAFT that is finalised after the first implemented slice. Use after dex-grill, or for "dex spec", "write the spec", "turn the grill into tasks".
---

**Dex spec** turns the human's settled answers into a spec. Nothing is built here. The vault agent writes it alone.

## Opening line

Start with one line, so the human knows where they are and how long it takes:

```
[<vault> vault] dex-spec #<n>: <k> phases to draft, about <k> questions. Say park to save a thought for later.
```
Readable: name the vault, the skill and the issue, and roughly how many questions are coming. "park" saves the place with `node dex-vault/.dex/vault.mjs park`.

## Hard rules

1. The human's grill answers are the only source of decisions. A spec line that rests on your guess is marked `(reading)`.
2. A spec has exactly **5 phases**. Each phase is a list of tracer bullets (thin end-to-end slices) with a spine node id (`L<1-6>.E<01-08>` or `.P`).
3. Status is `DRAFT` until you finalise it; `FINAL` is hash-frozen. Only an amendment (`amend`) reopens it, and every amendment is a dated line in `## Deltas`.
4. The human's Layer 8 veto stands: nothing is finalised for the build without the human seeing the phase list.

## Steps

1. Read the settled answers in the journal and the node folders they touch (`dex-vault/03_spine/`). List open points; do not invent answers.
2. Name the 5 phases with the human: propose, then take their correction.
3. For each phase write: Goal, Node, Contract, Acceptance (3 to 6 testable items), Out of scope, Deltas.
4. Before hand-off, check each phase: the acceptance count, the node reference, and no untagged simulated answers.
5. Hand to **dex-implement**. Late finalisation: after the first slice, merge the deltas the build found and freeze FINAL.
6. End with **dex-checkpoint**.
