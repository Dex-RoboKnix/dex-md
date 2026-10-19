---
name: dex-loop
description: Dex loop, step 2 of dex.md. Picks the next logical batch of issues and works it through the skills (grill, spec, implement, review), with a checkpoint after each skill and next actions suggested after each issue closes, until the batch's success criteria are met or the human stops it. Use for "dex loop", "run the loop", or one workload at a time (several at once is dex-sprint).
---

**Dex loop** runs step 2 of dex.md: keeping the work going until the slant is achieved. It does not replace the other dex skills. It runs them in order and keeps the human in the loop between them.

## Hard rules

1. **Working doesn't mean changing.** Reading, mapping, drafting and suggesting run freely. A change needs the human's yes to that change: a file outside the loop's working area, an issue comment, label or close, a commit, push, deploy or visibility change.
2. **Never answer for the human.** Grilling, prototype and task issues need the human. A research agent may take a research issue that needs up-to-date outside information.
3. **The human's words are kept twice** (rule 12): the original in the journal, the spelling-checked copy in anything shared. Your reading goes on a separate line.
4. **One agent** (rule 20). You run every skill yourself. A research agent runs only for up-to-date outside information (a web search, scraping a site), and you turn its handover into an HTML page for the human.
5. **Tag claims** `DOCUMENT`, `CITED`, `MODEL` or `UNSURE`. Only the human verifies.

## The loop

```
pick -> dex-grill -> dex-spec -> dex-implement -> dex-review -> next actions -> pick
         every skill ends with dex-checkpoint
```
Readable: pick an issue, grill the human on it, write the spec, build it, review it, then suggest what comes next. Each skill ends with a checkpoint.

## 0. Frame the loop

Open with one line:

```
[<vault> vault] dex-loop <batch>: <n> issues, next #<n>. Say park to save a thought for later.
```
Readable: name the vault, the batch, how many issues it holds and the next one.

State the batch's **P02 Purpose**, **P05 Success criteria**, **P06 Dependencies** and **E05 Validation** from its nodes. If one is missing, it is the first grill question. Never invent it.

## 1. Pick the issue

Take the next issue that is unblocked and that others depend on, foundation before detail. Say which one and why, in one line. Skip an issue with an assignee or an open blocker.

## 2. Run the skill the issue's type calls for

| Type | Skill | Human's part |
|---|---|---|
| grilling | dex-grill | answers every question |
| research | answer from the vault first; a research agent for up-to-date outside information, its handover as an HTML page | reads the findings |
| prototype | build the throwaway | reacts |
| task | show what you would do | says yes, then you do it |
| settled, with build work | dex-spec, dex-implement, dex-review | sees the phase list and chooses the pace |

## 3. Checkpoint after every skill

Run dex-checkpoint. Propose node changes; never apply them. Report what shipped since the last checkpoint, not only coverage.

## 4. When an issue closes: next actions

Offer up to three in one popup, the recommended one first: the next issue in the batch, a follow-up the work surfaced, or "stop here". Nothing starts before the human picks.

## 4b. A new thought mid-loop

When the human raises something that is not an answer to the open question:

1. **Hold the place.** Write down the skill, the issue and the open question, and save them:
   ```
   node dex-vault/.dex/vault.mjs park --skill dex-loop --issue <n> --question "<text>" --thought "<text>"
   ```
   Readable: save where the loop stopped and the new thought, so a later session can come back to it.
2. **Keep the thought** in the human's words.
3. **Assess** in one line: does it change the current job? If yes, propose the change and apply it on a yes. If no, find the open issue it belongs to, or propose a new one, on a yes.
4. **Go back.** Ask the held question again as it was asked. `node dex-vault/.dex/vault.mjs resume` prints it.

## 5. Stop

The loop ends when its P05 is met and the human agrees, when the human stops it, or when a task fails twice and the human parks it. Say what shipped, what is parked and which batch you would take next.
