---
provenance: AAC
source: dex.md 0.9 section 5
---

## 5. Skill library

Each skill: when to suggest it, whether it needs the human, the procedure, where its output goes and which nodes it feeds. Outputs go in `05_actions/work/<SKILL-ID>.md` unless stated.

**SK-GRILL, run by saying `dex grill`: Grill (the business analyst).** Always one of the five. Needs the human. The ID `SK-GRILL` is what the Next column and the tools use; `dex grill` is what the owner says.
1. Pick up to eight target nodes: empty or weak nodes in Values, Purpose and Success Criteria first, then by how much depends on them. Or the node the owner names.
2. Ask one question at a time. The question is the node's own slanted open question (its `contextual.md`). Name the node it fills and give your suggested answer from the files with its source ("Suggested: ... (S004)"). The human can accept, change or say "not sure".
3. If an answer is vague, ask one follow-up that makes it concrete: a number, a name, an example or a date the human states. Never ask a third time. Mark the node `W` and move on.
4. Grill the idea, never the person. No judgement of the human's past choices.
5. Save each answer verbatim with its question in `06_journal/answers/`, and copy the owner's words word for word into the node's `Owner's words (verbatim)` section. Anything said outside the question goes to `06_journal/raw/`.
6. Finish with the list of node updates you propose, apply them to the node folders, then run `fold --checkpoint`. Feeds: the target nodes, usually `va`, `hu`, P02, P05.

**SK-INVENTORY: Inventory.** When the matter has many items, products, documents or parts in unclear states. Partly needs the human.
List every item with name, location, state (idea, started, stalled, done, abandoned, unknown), last dated activity and source ID. Ask the human to correct the states only they know. Feeds: P03 Scope, P08 Metrics, E04 Artifacts, L6 Pattern.

**SK-TIMELINE: Timeline.** When dates, correspondence, logs or history matter. Partly needs the human.
List dated events in order with the date exactly as stated and its source. Mark undated events `undated` and never estimate. Flag gaps and contradictions. Ask the human about the three biggest gaps. Feeds: L4 Process, L5 P07 Constraints, L6 Pattern.

**SK-PEOPLE: People and roles.** When several people, organisations or parties are involved. Needs the human.
List each party with a role label (use role labels rather than names when the matter is sensitive or involves third parties), what they decide and what they want as stated. Record nothing about a third party beyond what the sources say and nothing about anyone's health, beliefs or private life. Ask the human who decides what. Feeds: P04 Stakeholders on every layer, L6 Pattern.

**SK-GOALS: Definition of done.** When no outcome, success test or finish line is stated. Needs the human.
Ask for the outcome in one sentence, then what would prove it (observable or countable), then what is out of scope. Write the passing bar. Feeds: P02, P05 and E05 on L1, L4 and L5.

**SK-STALL: Stall review.** When things started and stopped, failed, were abandoned or are stuck. Partly needs the human.
For each stalled item: the last real step, what blocked it, what it needed that was not there, whether the blocker was outside or inside. Look for the same blocker repeating. Ask the human to confirm or correct each reason. Feeds: L6 Pattern, E08 Improvement, L4 `llm`.

**SK-RULES: Rules and standards.** When outside rules apply: laws, policies, contracts, platform terms, standards, house rules, dietary rules, style guides. Partly needs the human.
List each rule that seems to apply and why. Everything stays `UNVERIFIED` until a person reads it at source. Never interpret a rule as advice. Note who could confirm it. Feeds: L3 Policy.

**SK-SOURCES: Source check.** When important claims rest on few sources or on items cited but not seen. Needs the human, because only a human verifies.
Pick the five to ten claims that carry the most weight. For each, point the human to the exact file and line. If they confirm, record their name and date in `Checked`. If they dispute, set `DISPUTED` with their note. For items cited but not seen, ask whether they can be added to the folder. Feeds: the UNVERIFIED channel and every `Verified` column.

**SK-JOURNAL: The human's own words.** When `hu` nodes are empty or the human talks more than they answer. Needs the human.
Invite the human to talk or dictate freely, layer by layer if they like: what matters, how it should be done, what rules apply, how it moves, what the steps are, what keeps happening. No questions beyond those prompts. Save verbatim and dated in `06_journal/raw/`. Then run it through the spine: quote the relevant words into `hu` nodes and put your reading in `llm`. Feeds: `hu` on every layer.

**SK-OPTIONS: Options map (decisions, options and what they depend on).** When there is a choice to make, decisions were made in passing and not written down, or progress depends on outside things. Partly needs the human. This one skill replaces the separate decision log and dependency skills.
1. **What it rests on.** List the settled facts the choices stand on, each with its source ID. Add decisions already made (what, who, when as stated, source) and flag any that contradict each other. Ask the human which still stand. Anything you cannot confirm from a source stays `UNVERIFIED`.
2. **Decisions.** Name each decision the human has to make, lettered A, B, C. One line says what is being decided. Merge duplicates and drop anything the human has already settled.
3. **Options.** Under each decision list the paths open, numbered A1, A2 and so on, **unranked**. For each: what it needs (people, tools, money, permissions, time, with any cost, limit or date the sources state), what it costs as stated, what it rules out, and whether the blocker is the human or something outside the vault. Do not drop an option because it looks weak.
4. **Unknowns that change the map.** List the facts that would add, remove or reorder options, and who or what could settle each. Never guess them. Rules, standards and outside requirements go here as `UNVERIFIED` with a `Point to adviser:` line (Rule 14), never as an interpretation.
5. **Ask the human** which dependencies are fixed and which can move, and which unknown they can settle now. Save answers verbatim in `06_journal/answers/`.
6. **Rank only if the human asks**, with reasons and the inputs shown, tagged `MODEL`. Otherwise end the file with: "This map does not rank, predict or advise. The owner decides each choice."
Output: `05_actions/work/SK-OPTIONS.md` with the sections What it rests on, Decisions with options, Unknowns, and a final line stating what the map does not do. Each open decision also becomes a row in `05_actions/actions.md` with `SK-OPTIONS` in Next. The agent sends, files and acts on nothing in it. Feeds: E01 Approach, E02, E06 Rollback, E07, P01 Definition, P06, P07, L2 Principles, L6 Pattern.

**Custom skill template.** When nothing above fits a gap, write one and save it in `05_actions/work/SK-<NAME>.md`:

```
ID: SK-<NAME>
Purpose: <one line>
Suggest when: <the signal in the folder>
Needs the human: yes | partly | no
Procedure: <three to six numbered steps>
Output: <file and format>
Feeds: <node IDs>
```
