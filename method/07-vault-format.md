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
  05_actions/onboarding.md the five skills and their status
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

**States.** `C` covered, `W` weak, `N` not observable (an action), `NA` not applicable. **Channels.** `source`, `answer`, `raw`, `agent`. **Status** for claims: `UNVERIFIED`, `VERIFIED`, `DISPUTED`. **Next** values: `SK-<NAME>: <action>` or `-`.

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
stage: onboarding | skills | built
mode: vault | single-document
material: . | ../ | <path relative to this folder>
home: local | github
dex_version: 0.9
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
| va | <values held at this layer> | MODEL | W | S001, J002 | no | SK-GRILL: Confirm these |
| hu | UNANSWERED | - | N | - | no | SK-JOURNAL: <prompt> |
| llm | <your reading> | MODEL | C | S004 | no | - |

### Plan
| Point | Answer | Tag | State | Sources | Verified | Next |
|---|---|---|---|---|---|---|
| 01 Definition | <answer> | DOCUMENT | C | S001 | no | - |
(eight rows, 01 Definition to 08 Metrics)

### Execute
| Point | Answer | Tag | State | Sources | Verified | Next |
|---|---|---|---|---|---|---|
| 01 Approach | Not observable. | - | N | - | no | SK-GRILL: <question> |
(eight rows, 01 Approach to 08 Improvement)
```

Keep each answer to one or two plain sentences. `Verified` is `no` until a human checks it; then it holds their name and date, written by you only from their decision.

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
| # | Skill | Why this matter needs it | Feeds | Status |
|---|---|---|---|---|
| 1 | Inventory (SK-INVENTORY) | <one line> | L4.P03, L6.P08 | proposed |
```

Status moves through `proposed`, `approved`, `running` and `done` (or `skipped`).

`05_actions/actions.md`

```
| ID | Node | Kind | Action | Skill | Status |
|---|---|---|---|---|---|
| D001 | - | decision | <decision the human needs to make> | SK-GRILL | open |
```

Node actions are derived from the spine automatically. Add a row with a node ID only to override its text, skill or status.

`06_journal/answers/<date>-<skill>-<n>.md` and `06_journal/raw/<date>-raw-<n>.md`

```
---
id: J001
date: YYYY-MM-DD
channel: answer | raw
skill: SK-GRILL
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
| .dex/vault.mjs | unpacked from dex.md section 9 | 0.8 | YYYY-MM-DD |
| .dex/build_folio.mjs | unpacked from dex.md section 9 | 0.8 | YYYY-MM-DD |
| .dex/dex-folio.template.html | unpacked from dex.md section 9 | 0.8 | YYYY-MM-DD |
| .dex/dexspine/ | clone of the public dexspine-core repo (only if the owner said yes) | commit | YYYY-MM-DD |
```
