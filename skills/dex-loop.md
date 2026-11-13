---
name: dex-loop
description: Dex loop, step 2 of dex.md. Picks the next logical batch of issues and works it through the skills (grill, spec, implement, review), with a checkpoint after each skill and next actions suggested after each issue closes, until the batch's success criteria are met or the human stops it. Use for "dex loop", "run the loop", or one workload at a time (several at once is dex-sprint).
provenance: AAC
---

**Dex loop** runs step 2 of dex.md: keeping the work going until the slant is achieved. It does not replace the other dex skills. It runs them in order and keeps the human in the loop between them.

## Hard rules

1. **Working doesn't mean changing.** Reading, mapping, drafting and suggesting run freely. A change needs the human's yes to that change: a file outside the loop's working area, an issue comment, label or close, a commit, push, deploy or visibility change.
2. **Never answer for the human.** Grilling, prototype and task issues need the human. A research agent may take a research issue that needs up-to-date outside information.
3. **The human's words are kept twice** (rule 12): the original in the journal, the spelling-checked copy in anything shared. Your reading goes on a separate line.
4. **One agent** (rule 20). You run every skill yourself. A research agent runs only for up-to-date outside information (a web search, scraping a site), and you turn its handover into an HTML page for the human.
5. **Tag claims** `DOCUMENT`, `CITED`, `MODEL` or `UNSURE`. Only the human verifies.
6. **Send what you make.** The human may be on a phone and sees only what is sent to them. In every skill the loop runs (dex-grill, dex-spec, dex-implement, dex-review, dex-checkpoint), each file made for the human is sent to their device with the `SendUserFile` tool as soon as it exists, with a one-line caption saying what it is and what to check: a draft, a spec, a review verdict, a research page, an image, audio, video, a build. A path in the chat is not delivery. Do not send working files (scripts, logs, intermediate renders), and send a file again only when it has meaningfully changed. If the tool is not available, say so and give the full path. Sending to the human's own device is not an outward action and needs no yes; secrets and gitignore-class files are still never sent.

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

With no issue tracker (a private vault), the issues are the rows of `dex-vault/05_actions/actions.md` whose Status is `proposed` or `open`, and the open nodes' Next values. Each names its route (`dex-grill`, `task`, `research`, `dex-spec`); `node dex-vault/.dex/vault.mjs audit` lists any that do not. Route those first.

## 2. Run the skill the issue's type calls for

| Type | Skill | Human's part |
|---|---|---|
| grilling | dex-grill | answers every question |
| research | answer from the vault first; a research agent for up-to-date outside information, its handover as an HTML page | reads the findings |
| prototype | build the throwaway | reacts |
| task | show what you would do | says yes, then you do it |
| settled, with build work | dex-spec, dex-implement, dex-review | sees the phase list and chooses the pace |
| a document (letter, pack, report) | dex-spec, dex-implement, dex-review in document mode | checks the draft, sends it themselves |

## 3. Checkpoint after every skill

Run dex-checkpoint. Propose node changes; never apply them. Report what shipped since the last checkpoint, not only coverage. The checkpoint also confirms that everything made since the last one was sent to the human (hard rule 6), and sends what was missed.

## 4. When an issue closes: next actions

Offer up to three in one popup, the recommended one first: the next issue in the batch, a follow-up the work surfaced, or "stop here". Nothing starts before the human picks.

## 4b. A new thought mid-loop

A stopped or closed popup is not a new thought: stop, say in one line which question is held, and wait for the human's word (rule 22).

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
