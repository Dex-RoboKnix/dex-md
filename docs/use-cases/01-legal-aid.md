---
provenance: AAC
---

# Use case 1: Legal Aid cases (generic)

This is a generic pattern. It is not anyone's own legal matter, and it holds no real case details.

**Profile.** A volunteer at a legal aid service keeps a folder per client case: letters, forms, dates and notes. Cases run for months and many people touch them.

**Folder kind.** Blank-with-context: some documents, no code, no `.git`.

**Regulated.** Yes. Dex maps the matter and never advises. Every rule stays `UNVERIFIED` until a person reads it at source. It never works out a deadline. It points to the adviser whose job it is.

## Why-ladder (illustrative answers)

| Rung | Answer (the volunteer's words) |
|---|---|
| 6 Pattern | "Cases go quiet for weeks, then a deadline letter turns up and we scramble." |
| 5 Procedure | "I want one place that shows where each case stands and what the next letter is." |
| 4 Process | "Because cases stall when nobody knows who owes the next step." |
| 3 Policy | "We hand over a case with a written summary, always." |
| 2 Principles | "The client should never have to tell their story twice." |
| 1 Values | "People get fair treatment whatever they can pay." |

## Slant

Dispute or defence, regulated. Evidence: dated correspondence, demands, a decision-maker. Wrong if the matter is advice only with no contested step. The lens reads Success Criteria as "what the decision-maker must find".

## Sort and first grill angles

Stage 3 first sorts anything from an older version or another system (keep, where, archive). Then `dex-grill` works the gaps through the timeline, people, rules and done angles (method section 5).

## Privacy notes

- People appear as role labels (client, caseworker, other party), not names.
- Nothing about health, beliefs or private life beyond what a source states.
- Dates are repeated exactly as sources state them. None is invented.
- Private repo only, or local only. Scan before any push.

## What done looks like

A vault with a timeline, a role map, a list of unverified rules each marked for an adviser to check, and an issue list of next steps. A person has confirmed the slant. No advice has been given.
