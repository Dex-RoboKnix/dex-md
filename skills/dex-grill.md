---
name: dex-grill
description: Grill the human on one issue or node at a time until it is settled, up to three independent questions per native popup, the human's words kept twice, then (on their yes) post, close and file follow-up issues. By default it picks the most logical open issue itself. Use for "dex grill", "grill me", "work the next issue", or whenever a grilling issue or a node needs the human's answers.
provenance: AAC
---

**Dex grill** works **one issue or node** from the first question to closure, in a live exchange with the human. The vault agent runs it alone: no subagent answers or resolves a grilling.

## Opening line

Start with one line, so the human knows where they are and how long it takes:

```
[<vault> vault] dex-grill #<n>: <k> open points, about <k> questions. Say park to save a thought for later.
```
Readable: name the vault, the skill and the issue, and roughly how many questions are coming. "park" saves the place with `node dex-vault/.dex/vault.mjs park`.

## Hard rules

1. **Never answer for the human.** No inferred answers. An answer that did not come from the human is tagged `[SIMULATED]` and never verifies anything.
2. **The human's words are kept twice** (rule 12): the original, exactly as typed, in the journal; the spelling-checked copy in the node text and in anything posted. Your reading goes on a separate line, marked as your reading.
3. **Nothing outward without an explicit yes:** no comment, label, close, new issue, repo or push. A yes to one action is not a yes to another.
4. **Claim only what you checked.** Before a question states a fact about code, a document or a tool, check it. Mark anything unchecked as your reading.
5. **Grill the idea, never the person.**

## 1. Pick the issue (one)

- If the human names an issue or node, use it. Otherwise choose it yourself, say which and why in one line, and start. Do not ask which.
- List the open issues:
  ```
  gh issue list -R <repo> --state open --limit 200 --json number,title,labels,comments
  ```
  Readable: list every open issue on the project's repo with its labels and comments. Then read the candidate's body, comments and links.
- **Order of preference:** (1) not blocked by an open issue; (2) foundation before detail; (3) the one other issues depend on; (4) the one closest to settled; (5) oldest.
- Work only that issue. A topic that is its own question goes on a **follow-up list**.

## 2. Build the queue (privately)

List the issue's open points: its "To settle" items minus anything already answered. Prefer questions that also settle other issues, and say which. Foundation questions go before the ones that depend on them.

## 3. Grill: up to three independent questions per popup

Use the native question tool (`AskUserQuestion`), up to three questions per call.

- **Independent only.** No question in a popup may depend on another's answer. A dependent question goes in the next popup.
- **Each question:** a short header; the issues it feeds; 2 to 4 options; the **recommended option first**, marked "(Recommended)", with the reason; plain descriptions of what each option costs. Give a suggested answer taken from the files, with its source. "Other" is added by the tool.
- **State your reading** when something is ambiguous, and ask.
- **Vague answer:** one follow-up that makes it concrete (a number, a name, an example). Never a third. Mark it weak and move on.
- **Contradiction** with an earlier answer or a rule: say so plainly in the next question and ask which wins. Never pick quietly.
- **Rejected popup:** do what the human said next. Do not re-ask the same thing in the same form.
- No question tool: one numbered question in chat at a time.

## 4. Record

After every popup, save to the vault journal: the issue, each question, the human's answer (original and checked copy), and an "agent reading" line where you interpreted. A picked option is recorded as "chose <option>", noting that the wording was yours.

- Answers go in `dex-vault/06_journal/answers/` with their question (channel `answer`).
- Anything said outside the question goes in `dex-vault/06_journal/raw/`.

Finish with the list of node updates you propose.

## 5. Repeat until settled

Keep going until every open point is answered, or parked by the human. Then say what is settled and what is parked.

## 6. Settle checkpoint

When the issue is settled (or after about eight questions if it runs long), ask once, in one popup, what to do:

- **Post the answers** to the issue as a comment (checked copy), with your summary and any conflicts.
- **Close the issue.** Only if every point is settled.
- **File the follow-ups.** Each as its own issue, linked to the parent.

Do only what the human said yes to. End with **dex-checkpoint**.

## 7. Hand back and offer the next

Say what was settled, what was parked, what was posted or filed (with numbers), and which issue you would take next and why. Do not start it without being asked.

## Issues that are not grilling

- **task:** show exactly what you would do, get a yes, do it, report with evidence.
- **prototype:** build the throwaway, let the human react, record the reaction.
- **research:** answer from the vault and memory first. Only when it needs up-to-date outside information (a web search, scraping a site) start one research agent (rule 20); turn its handover into an HTML page for the human.
- If answers come back partial or confused at three per popup, drop to one and say so.
