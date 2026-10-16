---
name: dex-grill
description: Grill the human on one ticket at a time until it is settled, three independent questions per native popup, answers kept verbatim, then (on their yes) post, close and file follow-up issues. By default it picks the most logical open ticket itself. Use for "dex grill", "grill me", "work the next ticket", or whenever a wayfinder:grilling ticket or a MoF node needs the human's answers.
---

**Dex grill** works **one ticket** from first question to closure, in a live exchange with the human. It is the style used in the 2026-10-03 round 1 session on `Dex-RoboKnix/dexroboknix`. It is meant to replace `SK-GRILL` in `MoF.md` (the same pattern, with tickets as its target); `MoF.md` is not edited until the human says so.

## Opening line

Start with one line, so the human knows where they are and how long it takes:

```
[<vault> vault] dex-grilling #<n>: <k> open points, about <k> questions. Say park to save a thought for later.
```
Readable: name the vault, the skill and the issue, and roughly how many questions are coming. "park" saves the place with `node dex-vault/.dex/vault.mjs park`.

## Hard rules

1. **Never answer for the human.** No inferred answers, no subagent resolving a grilling, prototype or task ticket.
2. **Their words verbatim**, typos and all, in the log and in anything posted. Your readings go on a separate line marked as your reading.
3. **Nothing outward without an explicit yes:** no comment, label, close, new issue, repo or push. Ask first, every time. A yes to one action is not a yes to another.
4. **Claim only what you checked.** Before a question states a fact about code, a parser, an ADR or a tool, check it. Mark anything unchecked as your reading.
5. **Grill the idea, never the person.**

## 1. Pick the ticket (one)

- If the human names a ticket, use it. Otherwise choose it yourself and say which and why in one line, then start. Do not ask which.
- Load the open tickets: `gh issue list -R <repo> --state open --limit 200 --json number,title,labels,comments`. Read the candidate's body, comments and links (ADRs, handoffs, other issues).
- **Order of preference:** (1) not blocked by an open ticket; (2) foundation before detail (names and structure before implementation); (3) the one other tickets depend on; (4) the one closest to settled (most "To settle" points already answered); (5) oldest.
- Ticket numbers inside a body ("Blocked by: 05") may be map numbers, not GitHub numbers. Say when you cannot tell.
- Work only that ticket. A topic that is its own question goes on a **follow-up list**, not into the grilling.

## 2. Build the queue (privately)

List the ticket's open points: its "To settle" items minus anything already answered in comments or the log. Prefer questions that also settle other tickets (tag them). Foundation questions before the ones that depend on them.

## 3. Grill: three independent questions per popup

Use the native question tool (`AskUserQuestion`), **up to three questions per call**.

- **Independent only.** Questions in one popup are answered together, so none may depend on another's answer. A dependent question goes in the next popup.
- **Each question:** short header; the tickets it feeds in the text; 2 to 4 options; the **recommended option first**, marked "(Recommended)", with the reason; plain-language descriptions of what each costs. Give a suggested answer taken from the files, with its source, as `SK-GRILL` did. Use a preview (a small diagram) when a picture helps, single-select only. "Other" is added by the tool.
- **State your reading** when interpreting something ambiguous, and ask.
- **Vague answer:** one follow-up that makes it concrete (a number, a name, an example). Never a third. Mark it weak and move on.
- **Contradiction** with an earlier answer, an ADR or a rule: say so plainly in the next question and ask which wins. Never pick quietly.
- **Rejected popup:** do what the human said next. Do not re-ask the same thing in the same form.
- No question tool: one numbered question in chat at a time.

## 4. Record

After every popup append to a local log (for example `.scratch/grilling/<date>-<ticket>.md`): the ticket, each question, the human's answer **verbatim**, and an "agent reading" line where you interpreted. A picked option is recorded "chose <option>" with a note that the wording was yours.

In a MoF vault, also save each answer in `06_journal/answers/` with its question (channel `answer`) and anything said outside the question in `06_journal/raw/`, then finish with the list of node updates you propose.

## 5. Repeat until settled

Keep going, popup after popup, until every point in the ticket's "To settle" list is answered, or explicitly parked by the human. Then say what is settled and what is parked.

## 6. Settle checkpoint (the only point where you ask to write)

When the ticket is settled (or after about eight questions if it runs long), ask once, via the question tool, what to do. Offer in one popup, up to three questions:

- **Post the answers** to the ticket as a comment, verbatim, with your summary and any conflicts. (Yes / not yet.)
- **Close the ticket.** Only if every point is settled. Comment the answer, `gh issue close <n>`, then add a pointer to the map's Decisions-so-far.
- **File the follow-ups.** Show the list from step 1; file each as its own ticket with the right `wayfinder:<type>` label, linked under the map as a sub-issue (see `docs/agents/issue-tracker.md`).

Do only what the human said yes to.

## 7. Hand back and offer the next

Say what was settled, what was parked, what was posted or filed (with numbers), and which ticket you would take next and why. Do not start it without being asked, unless the human said to keep going.

## Tickets that are not grilling

- **task:** show exactly what you would do, get a yes, do it, report with evidence.
- **prototype:** build the throwaway, let the human react, record the reaction.
- **research:** may run in the background; findings go to a file and are reported.

## Notes

- Repo conventions: `docs/agents/issue-tracker.md`; the human-in-the-loop rule for grilling tickets: `CLAUDE.md`.
- Three questions per popup is a trial started 2026-10-03; if answers come back partial or confused, drop to one and say so.
- Skills in `.claude/skills/` are gitignored in this repo, so this is local until moved somewhere tracked or packaged (see #28).
- It replaces `SK-GRILL` in intent only. `MoF.md` still carries the old `SK-GRILL` until the human decides to change it (see #34 and #41).
