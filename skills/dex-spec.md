---
name: dex-spec
description: Turn settled grill sessions across the dexspine into a spec of 5 phases of tracer bullets, as a DRAFT that is finalised after the first implemented slice. Use after dex-grill, or for "dex spec", "write the spec", "turn the grill into tasks".
---

**Dex spec** is the downward half of the vault loop (#13): grill answers become a spec; nothing is built here. PROTOTYPE, built 2026-10-09 for #77 and corrected after each test.

## Opening line

Start with one line, so the human knows where they are and how long it takes:

```
[<vault> vault] dex-spec #<n>: <k> phases to draft, about <k> questions. Say park to save a thought for later.
```
Readable: name the vault, the skill and the issue, and roughly how many questions are coming. "park" saves the place with `node dex-vault/.dex/vault.mjs park`.

## Hard rules
1. The human's grill answers are the only source of decisions. A spec line that rests on an agent's guess is marked `(reading)`.
2. A spec has exactly **5 phases**; each phase is a list of tracer bullets (thin end-to-end slices) with a spine node id (`L<1-6>.E<01-08>` or `.P`).
3. Status is `DRAFT` until the orchestrator finalises it; `FINAL` is hash-frozen. Only an amendment (`amend`) reopens it, and every amendment is a dated line in `## Deltas`.
4. The human's Layer 8 veto stands: nothing is finalised for the build without the human seeing the phase list.

## Steps
1. Read the settled grill log(s) and the node rows they touch (`03_spine/`). List open points; do not invent answers.
2. Name the 5 phases with the human (the names are not fixed by the issue; propose, then take their correction).
3. For each phase write tracer bullets: Goal, Node, Contract, Acceptance (3-6 testable items), Out of scope, Deltas.
4. Hand to **dex-implement**. Late finalisation: after the first slice the builder reports deltas; the orchestrator merges them and freezes FINAL.
5. End with **dex-checkpoint**.

## Orchestrator and team
A Sonnet 5.5 orchestrator (medium) leads up to 8 Haiku spec-writers of about 50k tokens each. It validates each phase before hand-off: acceptance count, node reference, no untagged simulated answers.
