---
provenance: AAC
---

# The slant flow (the why-ladder)

The slant is the angle that best serves the matter (`method/04-slant.md`). The slant flow is how Stage 1 finds it. The what and the outcome sit in the person's own understanding; the reasons for them sit in the levels above.

## The ladder

The spine has six levels. They are called **rungs** here so they are not confused with the layers L1 to L3 in `CONTEXT.md`.

| Rung | Level | Asks |
|---|---|---|
| 6 | Pattern | What have you seen happen: results, actions, or things outside the plan? (the start) |
| 5 | Procedure | What do you want done, and what outcome? |
| 4 | Process | Why: what flow is that part of? |
| 3 | Policy | Why: what rules or choices decide that flow? |
| 2 | Principles | Why: what do you hold to when you choose? |
| 1 | Values | Why: what matters underneath? |

## Steps

1. **Start with what has happened.** Ask what they have seen happen: results, actions, or things outside the plan. This is rung 6. Keep it verbatim.
2. **Then what they want.** Ask what they want done (the what) and what good looks like (the outcome). This is rung 5. Keep it verbatim.
3. **Ask why, one rung up at a time.** One question per turn. Keep each answer verbatim, in the person's words.
4. **Needs and wants.** After each why answer from rung 4 up to rung 1, ask: "Is that a must or a nice-to-have?" A must is a requirement (a need), a nice-to-have is a desirable (a want). Save it on that rung's `hu` node (L4.hu for Process up to L1.hu for Values) under `## Needs` or `## Wants`, in the person's words.
5. **Stop** when any of these is true: the person reaches Values; the person says that's it; an answer repeats the one below.
6. **Write the slant from the highest rung the person confirms.** Propose it as `proposed`. Only the person makes it `confirmed`.
7. **Come back down.** Read the nodes through the slant, rung by rung, so the sixteen Plan and Execute points (the lens) match the person's reasons.

```mermaid
flowchart BT
  P["6 Pattern: what have you seen happen? (user's words)"] --> A["5 Procedure: what you want done + outcome"]
  A --> B["4 Process: why? must or nice-to-have?"]
  B --> C["3 Policy: why? must or nice-to-have?"]
  C --> D["2 Principles: why? must or nice-to-have?"]
  D --> E["1 Values: why? must or nice-to-have?"]
  E -. "stop: Values, thats it, or a repeat" .-> S["Write slant from highest confirmed rung"]
  S --> N["Back down: lens and nodes"]
```

## Where it wires in

- **Stage 1** of `dex.md` runs the flow after the overview and before the vault location questions.
- **`method/04-slant.md`** says what to record: the slant, evidence, what would make it wrong, confidence, status. The ladder answers go in `01_matter/slant.md` as the evidence, verbatim.
- Confirming the slant adapts the vault's open questions (Stage 4, step 1).
- Regulated matters: the ladder still runs, but the slant records "map, never advise" (`method/04-slant.md`).
- Do not answer for the person. If they cannot answer a rung, record that and stop.
