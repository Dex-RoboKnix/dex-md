---
name: dex-review
description: Review built work against its FINAL spec, with machine checks and a written verdict that the human agrees or overrules. Use for "dex review", "review the phase", "check the build".
---

**Dex review** checks the build against the FINAL spec and its deltas. The vault agent that built the work also reviews it (rule 20), so it says so in the verdict, and the human's verdict is the independent check.

## Opening line

Start with one line, so the human knows where they are and how long it takes:

```
[<vault> vault] dex-review #<n>: <k> phases to check, one verdict to agree. Say park to save a thought for later.
```
Readable: name the vault, the skill and the issue, and roughly how many questions are coming. "park" saves the place with `node dex-vault/.dex/vault.mjs park`.

## Hard rules

1. **Review as a stranger.** Read the spec first, then the diff, as if someone else built it. Do not edit code during the review; write the verdict, then fix in dex-implement.
2. A pass needs **both** a reviewer PASS and the machine checks (tests green, lint clean). A PASS over a failing test is recorded as FAIL.
3. FAIL only for a blocker: an Acceptance item untested or unimplemented, or a test that cannot fail. Drift (behaviour the spec never asked for) is reported.
4. **Prove a test can fail.** For each new test, break the thing it tests once, see it fail, then put it back.
5. The verdict states that the builder reviewed its own work. The human agrees or overrules it in one popup. Only the human writes `VERIFIED`.
6. A task gets 2 attempts. After the second FAIL, the human decides what happens next; record the outcome either way.

## Document mode

For a document, the spec is the vault's output rules and the draft's stated purpose:
- The machine check is `node dex-vault/.dex/vault.mjs audit --output <file>`. It must report no finding.
- Check each rule as an Acceptance item: audience named; trace list complete; unchecked statements shown as unchecked; in a regulated matter, each point of law or remedy marked "owner's argument, adviser to confirm"; held-back points left out; the human's wording kept and every change listed.
- Prove the check can fail: remove the trace list from a copy once, see `audit --output` report it, then discard the copy.
- FAIL for a blocker: a missing trace list, a held-back point included, a statement shown as checked that nobody checked, or a changed wording that is not listed.

## Steps

1. Run the machine checks: the tests, the lint, and the project's own checks.
2. For each phase, check every Acceptance item: implemented, and covered by a test that can fail. List drift.
3. Write `review.md`: PASS or FAIL, the blockers, the drift, a table of Acceptance items, and the line "Reviewed by the agent that built it."
4. Show the verdict to the human in one popup: agree, send back to dex-implement, or amend the spec.
5. End with **dex-checkpoint**.
