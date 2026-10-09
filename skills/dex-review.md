---
name: dex-review
description: Review built work against its FINAL spec with the full team, including testing and devops; two failed rounds escalate to Opus 5.5 with a Sonnet team. Use for "dex review", "review the phase", "check the build".
---

**Dex review** checks code against the FINAL spec and its delta log. PROTOTYPE, built 2026-10-09 for #77.

## Hard rules
1. The reviewer never reviews its own build, and never edits code. It writes a verdict.
2. A pass needs **both** a reviewer PASS and the machine checks (tests green, devops lint clean). A reviewer PASS over a failing test is recorded as FAIL.
3. FAIL only for a blocker: an Acceptance item untested or unimplemented, or a test that cannot fail. Drift (behaviour the spec never asked for) is reported.
4. Attempt cap 2: a second FAIL goes to **Opus 5.5 with a Sonnet team**; that outcome is recorded either way.
5. Nobody verifies their own claim; only a human writes `VERIFIED`.

## Team (up to 8)
- Tester (Haiku): acceptance coverage and assertion quality.
- Devops (script): imports, network, shell, env, eval, writes, `run` export.
- Add as the work needs: security, docs, accessibility.

## Steps
1. Run the machine checks (`dex-loop verify`).
2. Reviewers write `review.md` per task.
3. Orchestrator records verdicts (`dex-loop record`): pass, retry (back to dex-spec amend + dex-implement) or escalate.
4. Phase gate: passes only when every task is pass or an escalation has resolved.
5. End with **dex-checkpoint**.
