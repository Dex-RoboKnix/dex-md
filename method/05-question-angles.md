---
provenance: AAC
source: dex.md 0.9 section 5 (the skill library), rewritten in 0.11.0 without skill IDs
---

## 5. Question angles

There is one way to ask: **`dex-grill`**. These angles are what it uses to find the right next question for a node. They are not skills and carry no IDs.

A node's Next names a **route** and one specific question or action:

| Route | Use it when | Who does it |
|---|---|---|
| `dex-grill` | only the human can answer | the human answers; the agent asks |
| `task` | the agent can do it from the vault or the sources (read, list, map, compare) | the agent shows what it would do, then does it on a yes |
| `research` | it needs up-to-date outside information that is not in the vault | a research agent; its handover becomes an HTML page for the human |
| `dex-spec` | something has to be built: a document or code | dex-spec, dex-implement and dex-review (document mode for documents) |

These are dex-loop's own issue types, so a loop routes straight from the nodes. Example Next values:
- `dex-grill: Which outcome would make you stop?`
- `task: List every dated letter and its source.`

A Next never holds a generic line such as "strengthen this node".

### How dex-grill asks

1. Pick up to eight target nodes: empty or weak nodes in Values, Purpose and Success Criteria first, then by how much depends on them. Or the node the human names.
2. Ask one question at a time, or up to three independent ones in one popup. The question is the node's own slanted open question. Name the node it fills and give your suggested answer from the files with its source ("Suggested: ... (S004)"). The human can accept, change or say "not now".
3. If an answer is vague, ask one follow-up that makes it concrete: a number, a name, an example or a date the human states. Never ask a third time. Leave the node `W` and move on.
4. Grill the idea, never the person. No judgement of the human's past choices.
5. Keep the words twice (rule 12): the original, exactly as typed, in `06_journal/answers/` with its question. The spelling-checked copy is proposed for the node's `Owner's words` section. Anything said outside the question goes to `06_journal/raw/`.
6. Finish with the list of node updates you propose. Apply them only on the human's yes (rule 18), then run `fold --checkpoint`.

### The angles

| Angle | When the folder shows | What to ask or produce | Feeds |
|---|---|---|---|
| Inventory | many items, documents or parts in unclear states | list each item: name, location, state (idea, started, stalled, done, abandoned, unknown), last dated activity, source. Ask the human to correct only the states they know | P03, P08, E04, L6 |
| Timeline | dates, correspondence, logs or history matter | dated events in order, each date exactly as stated with its source; `undated` where none is stated, never estimated. Ask about the three biggest gaps | L4, L5.P07, L6 |
| People | several people, organisations or parties | each party by role label (role labels, not names, when the matter is sensitive or involves third parties), what they decide and want as stated. Nothing about anyone's health, beliefs or private life | P04 on every layer, L6 |
| Done | no outcome, success test or finish line is stated | the outcome in one sentence, what would prove it, what is out of scope | P02, P05, E05 on L1, L4, L5 |
| Stall | things started and stopped, failed or are stuck | for each: last real step, the blocker, what it needed, inside or outside. Look for the same blocker repeating | L6, E08, L4.llm |
| Rules | outside rules apply: laws, policies, contracts, terms, standards, house rules | each rule that seems to apply and why, `UNVERIFIED` until a person reads it at source, with `Point to adviser:` in a regulated matter (rule 14). Never advice | L3 |
| Sources | weighty claims rest on few sources or on items cited but not seen | the five to ten claims that carry most weight, each with the exact file and line for the human to check. A confirmation records their name and date; a dispute sets `DISPUTED` with their note | every `Verified` value |
| Own words | `hu` nodes are empty or the human talks more than they answer | invite the human to talk freely, layer by layer; save it verbatim in `06_journal/raw/`, then propose the relevant words for the `hu` nodes | `hu` on every layer |
| Options | a choice to make, decisions made in passing, or outside dependencies | what the choices rest on (with sources); each decision lettered A, B, C; the options under each, unranked, with what each needs, costs and rules out; the unknowns that would change the map. Rank only if the human asks. End with "This map does not rank, predict or advise. The owner decides each choice." | E01, E02, E06, E07, P01, P06, P07, L2, L6 |

Angle outputs (inventories, timelines, maps) go in `05_actions/work/<angle>-<date>.md`. Each open decision they surface becomes a row in `05_actions/actions.md`, routed `dex-grill`.
