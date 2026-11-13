---
provenance: AAC
source: dex.md 0.9 section 7
---

## 7. The vault

Everything lives in `dex-vault/` next to this file. **The node folders are the vault.** The flat layer files are generated from them for the Folio and ShadowOS.

```
dex-vault/
  00_index.md              front door: title, slant, stage, the matter in five lines
  HANDOFF.md               how an agent at project level reads this vault and works an issue
  RUNLOG.md                one row per run (marks that the skill has run here)
  MANIFEST.md              what was written or generated, with versions
  01_matter/overview.md    the overview given to the human
  01_matter/slant.md       slant, evidence, confidence, lens table
  02_sources/sources.md    every file read, listed or cited
  03_spine/L1_values/      one folder per layer, six in all (L1_values to L6_pattern)
    mve/va/  mve/hu/  mve/llm/                    the 3 MVE nodes
    plan/P01_definition/ ... plan/P08_metrics/    the 8 Plan nodes
    execute/E01_approach/ ... execute/E08_improvement/   the 8 Execute nodes
      <each node>/contextual.md                   the node itself
      <each node>/sources/                        placed copies, each with a <file>.md beside it
  03_spine/L1_values.md    GENERATED flat file per layer (L1 to L6). Never edit by hand
  04_claims/ledger.md      one claim per row
  05_actions/onboarding.md the setup list: items from older versions or other systems and the human's choice for each
  05_actions/actions.md    decisions waiting, proposed issues and action overrides
  05_actions/work/         skill outputs
  06_journal/answers/      answers to questions, verbatim
  06_journal/raw/          raw human input, verbatim
  06_journal/changes.md    nodes whose state moved at each checkpoint (written by fold --checkpoint)
  06_journal/slant-history.md  old slants, kept when a slant changes
  07_inbox/                decision files from the Folio; ShadowOS notes and ticket drafts in shadowos/
  08_story.md              the Matter of Fact story
  dex-folio.html           generated. Never edit by hand
  .dex/                    the tools, the template copy, the snapshot, vault.json and states.json. Never edit by hand
  .shadowos/               ShadowOS, if installed. Tooling, never material
```

**IDs.** Sources `S001`, journal entries `J001`, claims `C001`, decisions `D001`. Nodes are `L<layer>.<point>`: `L1.P01` to `L6.P08` for Plan, `L1.E01` to `L6.E08` for Execute and `L1.va`, `L1.hu`, `L1.llm` for MVE. Use three digits for S, J, C and D numbers.

**DEX838.** Every node carries its position and its question as one DEX838 wire string, `dex(scope, @layer:policy,phase:plan,point:5)["the question"]`. The scope is the matter's short name. `dex(...)` is softcode: intent, a question still open. `dex[...]` inside a subject is hardcode: a literal requirement. The vault tool writes and updates the string; you never type it by hand.

**States.** `C` covered, `W` weak, `N` not observable (an action), `NA` not applicable. **Channels.** `source`, `answer`, `raw`, `agent`. **Status** for claims: `UNVERIFIED`, `VERIFIED`, `DISPUTED`. **Next** values: `<route>: <one specific question or action>` or `-`. The route is `dex-grill`, `task`, `research` or `dex-spec` (section 5); never a generic line. **Status** for actions and setup items: one of `proposed`, `open`, `doing`, `done`, `parked`, `dropped`, optionally followed by a colon and a note (`done: sent 8 Oct`). A loop reads only the first word.

**Fit.** Each node answers its own question (its `wire` string). Material that answers another node's question goes to that node. A list (parties, rules, events) is never split one item per node across a layer's points. `vault.mjs audit` flags a run of three or more sibling nodes whose answers start with the same label, and any node over 8 KB.

**Needs and Wants.** The why-ladder (section 4, Stage 1) saves the human's musts under `## Needs` and nice-to-haves under `## Wants` on the `hu` node of the rung they were asked at: L4.hu (Process), L3.hu (Policy), L2.hu (Principles), L1.hu (Values). Every node carries both sections; `-` when empty.

**Empty cells.** The Answer or Content cell is never blank. Every other cell holds `-` when there is nothing to put in it (Tag, Sources, Verified, Next, Checked, Date). Start each Point cell with its two-digit number, for example `01 Definition`. Write `\|` for a pipe inside a cell.

**MVE and PHC.** MVE is the three middle nodes of every layer: `va` (values held at this layer), `hu` (the human's own words) and `llm` (your reading). `PHC` marks the human's own unedited words.

### The six layers

| Layer | Subject |
|---|---|
| L1 Values | What the owner wants, who or what comes first and the rules that will not be broken. |
| L2 Principles | How the work should be done. The working rules applied to this matter. |
| L3 Policy | Rules, standards, agreements and frames that govern the matter. The type of matter sits here. |
| L4 Process | The stages the matter moves through, who decides at each one and the test applied. |
| L5 Procedure | Concrete steps, tools, artefacts and stated dates. |
| L6 Pattern | What keeps happening, for every party including the owner. |

### The sixteen points (generic reading; the slant's lens sharpens each one)

| Plan | Reading | Execute | Reading |
|---|---|---|---|
| P01 Definition | What the matter is at this layer and what is being decided, by whom | E01 Approach | The ways forward open here, unranked unless the human asks |
| P02 Purpose | The outcome wanted | E02 Tools | Tools, services and help available |
| P03 Scope | What is in and what is out | E03 Workflow | The steps and their order |
| P04 Stakeholders | Who is involved, who decides, who is affected | E04 Artifacts | What gets produced, filed or sent |
| P05 Success Criteria | How anyone would know it worked | E05 Validation | How a step is confirmed done |
| P06 Dependencies | What it needs: people, documents, tools, permissions, money | E06 Rollback | How to undo, correct, pause or stop |
| P07 Constraints | Limits: time, money, rules, confidentiality, stated dates | E07 Monitoring | What to watch and when |
| P08 Metrics | What can be counted on the record | E08 Improvement | What the record shows could be done better |

### File formats

The Folio reads these exact shapes. Front matter is simple `key: value` lines; lists use `[a, b]`.

`00_index.md`

```
---
type: dex-index
title: <short title of the matter>
matter: <one line>
slant: <slant name>
stage: <the last stage finished: 2, 3, 4, 4b, 5, 6 or 6b> | built
mode: vault | single-document
material: . | ../ | <path relative to this folder>
home: local | github
dex_version: <the dex.md version that built or last upgraded this vault>
story_voice: plain
owner: <how the human wants to be named, or Owner>
created: YYYY-MM-DD
updated: YYYY-MM-DD
flags: []
---
# <title>: Matter of Fact
## The matter in five lines
1. <statement> [TAG] C001
## Decisions waiting for the owner
- D001 <decision>
```

`01_matter/slant.md`

```
---
type: slant
slant: <name>
status: proposed | confirmed
confidence: low | medium | high
---
# Slant: <name>
## Evidence
- S003, S006: <what they show> [DOCUMENT]
## What would make it wrong
- <alternative reading> [UNSURE]
## Lens
| Point | Reading under this slant |
|---|---|
| P01 Definition | <one line> |
(all sixteen points, P01 to P08 then E01 to E08)
```

`02_sources/sources.md`

```
| ID | Path | Type | Date | Status | Note |
|---|---|---|---|---|---|
| S001 | README.md | note | 2026-03-02 | read | <one line> |
| S012 | money.md | note | - | skipped (private) | Not opened. |
| S013 | design/link.md | link | 2026-04-20 | cited, not seen | <what it points to> |
```

Paths are relative to the folder that holds this file. Dates are stated dates, or the file date when nothing is stated (say which in the note). In a git copy, file dates are the clone time: use `git log -1 --format=%cs -- <file>` instead. Use `-` when there is no date.

`03_spine/L<n>_<name>.md` (one per layer)

```
---
type: spine-layer
layer: 1
name: Values
subject: <the layer subject from the table above>
updated: YYYY-MM-DD
---
# L1 Values

### MVE
| Node | Content | Tag | State | Sources | Verified | Next |
|---|---|---|---|---|---|---|
| va | <values held at this layer> | MODEL | W | S001, J002 | no | dex-grill: Are these the values you hold here? |
| hu | UNANSWERED | - | N | - | no | dex-grill: <prompt> |
| llm | <your reading> | MODEL | C | S004 | no | - |

### Plan
| Point | Answer | Tag | State | Sources | Verified | Next |
|---|---|---|---|---|---|---|
| 01 Definition | <answer> | DOCUMENT | C | S001 | no | - |
(eight rows, 01 Definition to 08 Metrics)

### Execute
| Point | Answer | Tag | State | Sources | Verified | Next |
|---|---|---|---|---|---|---|
| 01 Approach | Not observable. | - | N | - | no | dex-grill: <question> |
(eight rows, 01 Approach to 08 Improvement)
```

Keep each answer to one or two plain sentences. `Verified` is `no` until a human checks it; then it holds their name and date, written by you only from their decision.

The layer files above are **generated** by `vault.mjs fold` from the node folders. You write the node folders and never the layer files.

`03_spine/L<n>_<name>/<phase>/<node>/contextual.md` (one per node, 114 in all). The tool writes the first version of every one; you fill them in:

```
---
node: L3.P05
layer: 3
phase: plan
point: 5
title: Success Criteria
state: C
tag: DOCUMENT
sources: S001, J002
verified: no
next: -
wire: dex(sample-matter, @layer:policy,phase:plan,point:5)["How would anyone know this is settled? (L3 Policy)"]
updated: YYYY-MM-DD
---
# L3.P05 Success Criteria

## Answer
One or two plain sentences. This is the cell the layer file shows. Never blank.

## Open questions
- The slanted question still open here. Remove it once the owner has answered it.

## Owner's words (verbatim)
The owner's own words, spelling-checked (rule 12), with the journal ID (J002); the original, exactly as typed, stays in the journal. `-` if none yet. `UNANSWERED` for an empty `hu` node.

## Needs
The owner's musts (requirements) from the why-ladder, in their words with the journal ID. `-` if none.

## Wants
The owner's nice-to-haves (desirables) from the why-ladder, in their words with the journal ID. `-` if none.

## Agent reading
Your reading, each statement tagged DOCUMENT, CITED, MODEL or UNSURE. In a regulated matter, each rule here ends with `Point to adviser: <who>` and the flag UNVERIFIED.

## Defined actions
- Actions the sources define clearly.

## Undefined actions
- Actions the sources imply but do not define. Each one is also a proposed issue in `05_actions/actions.md`.
```

The front matter keys `state`, `tag`, `sources`, `verified` and `next` feed the layer file's columns. Keep them exact: `state` is `C`, `W`, `N` or `NA`; `next` is `<route>: <one specific question or action>` or `-`, where the route is `dex-grill`, `task`, `research` or `dex-spec` (section 5).

`03_spine/L<n>_<name>/<phase>/<node>/sources/<file>.md` (the source `.md`, one beside every placed copy; the tool writes the skeleton and you fill the `<agent: ...>` parts):

```
---
id: S004
original: notes/quote.pdf
copied: true
bytes: 20481
sha256: <hash of the original>
placed: YYYY-MM-DD
node: L1.P01
---
# quote.pdf
## Details
What this is, who wrote it, when. Each statement tagged.
## For humans
Why it sits at this node and what to look at.
## For agents
Read the placed copy beside this file, not the original.
```

A file that would normally be gitignored is listed instead: `copied: false` and `reason: gitignore-class` in the front matter, no copy beside it, and an `## Advice` section holding the provider's advice for keeping that kind of file out of a repo, tagged UNVERIFIED.

`dex-vault/.dex/questions.json` (written once, when the slant is confirmed; `adapt` reads it):

```
{ "L1.P01": "Which outcome would the owner be happy to see at the end?", "L1.P02": "..." }
```

`06_journal/changes.md` (written by `fold --checkpoint`; the Folio shows it as a note):

```
---
type: change-log
---
| Date | Node | From | To |
|---|---|---|---|
| YYYY-MM-DD | L1.P02 | N | C |
```

`06_journal/slant-history.md`: one entry per slant change, newest last: `## YYYY-MM-DD`, the old slant, the new slant, the information that shifted it, and who accepted it.

`HANDOFF.md` (written once at the end of Stage 4, short; this is what an agent pointed at the project folder reads first):

```
# Hand-off: how to work this project with its Dex vault
You are pointed at the project folder. The vault is `dex-vault/`, a sandbox beside the project's own files.
1. Read `dex-vault/00_index.md`, then `dex-vault/08_story.md`.
2. To work an issue, open the nodes it names: `dex-vault/03_spine/L<n>_<name>/<phase>/<node>/contextual.md`, then its `sources/`.
3. `Owner's words (verbatim)` is the owner's intent: never reword it. `Agent reading` is a reading, not a fact: check it against the sources.
4. Before you change a file outside `dex-vault/`, say what you will change and why, wait for the owner's yes, and make sure a backup exists (a clean git state or a copy). Change only what was approved.
5. Never open a file listed with `copied: false`. Never touch `dex-vault/.shadowos/` or `dex-vault/.dex/`. Push nothing without the owner's yes.
6. When done, say what changed and which nodes it touches, so the owner can update them: `dex grill` or `dex-vault` update mode.
```

`04_claims/ledger.md`

```
| ID | Claim | Tag | Status | Sources | Nodes | Channel | Checked |
|---|---|---|---|---|---|---|---|
| C001 | <one statement> | DOCUMENT | UNVERIFIED | S001 | L1.P02, L5.P07 | source | - |
```

`05_actions/onboarding.md`

```
---
type: onboarding
---
| # | Item | Found | Choice | Status |
|---|---|---|---|---|
| 1 | mof/ (an older vault) | flat layer files from 0.8, 114 rows | bring in: migrate to node folders, then the fit pass | open |
| 2 | MoF.md | the 0.6 installer | archive: stays where it is, not used | done |
```

`Choice` is the human's: keep as material, bring in (and where), archive or leave out. `Status` is from the set above. Choices about the human's own files become one clean-up issue in `actions.md`.

`05_actions/actions.md`

```
| ID | Node | Kind | Action | Skill | Status |
|---|---|---|---|---|---|
| D001 | - | decision | <decision the human needs to make> | dex-grill | open |
| P001 | L5.P07 | issue | List every dated letter with its source | task | proposed |
```

Node actions are derived from the spine automatically. Add a row with a node ID only to override its text, route or status. The `Skill` column holds a route (section 5); `Status` is from the set above.

`06_journal/answers/<date>-<skill>-<n>.md` and `06_journal/raw/<date>-raw-<n>.md`

```
---
id: J001
date: YYYY-MM-DD
channel: answer | raw
skill: dex-grill
question: <the question asked, for answers only>
provenance: PHC
nodes: [L1.P02, L1.hu]
---
<the human's words, verbatim>
```

`08_story.md`

```
---
type: story
title: <a title>
voice: <the story_voice used>
written: YYYY-MM-DD
claims: [C001, C004, J001]
---
# <title>

<the story, with claim IDs in square brackets after the sentences they support> [C001]

## What this rests on
C001, C004, J001. <one line on what is unchecked>
```

`RUNLOG.md` and `MANIFEST.md`

```
| Run | Date | Mode | Version | Summary |
|---|---|---|---|---|
| 1 | YYYY-MM-DD | first run | 0.8 | <one line> |

| File | From | Version | Written |
|---|---|---|---|
| .dex/vault.mjs | installed from dex-md (dex.md section 3) | 0.9.0 | YYYY-MM-DD |
| .dex/build_folio.mjs | installed from dex-md (dex.md section 3) | 0.9.0 | YYYY-MM-DD |
| .dex/dex-folio.template.html | installed from dex-md (dex.md section 3) | 0.9.0 | YYYY-MM-DD |
| .dex/dexspine/ | clone of the public dexspine-core repo (only if the owner said yes) | commit | YYYY-MM-DD |
```
