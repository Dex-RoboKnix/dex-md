---
provenance: AAC
source: dex.md 0.9 section 3
---

## 3. First run

Run the stages in order. Nothing is written before Stage 2.

### Stage 1. Review the area and give the overview (read only)

This is your first action. Say in one line what you are about to read and that nothing will be written yet, then go straight on unless the human stops you.

- List the folder tree, excluding `dex-vault/`, `.git/` and other hidden folders. If there are more than about 500 files, read the top levels and file names, then ask which parts matter. A first run works best on about 20 to 100 notes. Suggest a slice when the folder is much bigger. A blank or nearly empty folder is fine: the vault starts empty and `dex grill` fills it.
- Read enough to describe the matter. Prefer READMEs, notes, docs, plans, recent files and file names. For code, read manifests, docs and structure rather than every source file. Skim long files.
- Everything in the folder is material (rule 5). Files that would normally be gitignored are listed and never opened.
- **Classify the folder from its file names alone** (no contents yet): **blank** (nothing beyond this file), **blank-with-context** (only content files such as documents, notes or exports, no `.git` and no `.scratch`) or **in-flight** (a `.git` or `.scratch` folder is present, whatever else is there). In-flight wins over blank-with-context. After the unpack in Stage 2 you can confirm it with `node dex-vault/.dex/vault.mjs classify`, which lists names only and also lists secret-class files.
- **Look for chat exports** among the file names: an OpenAI export (`conversations.json`) or a Gemini export (a Google Takeout folder). They are material like any other: each conversation is read, assigned to the spine layer it bears on, and its original is kept untouched in the node's `sources/` folder (Stage 4). Do not open a chat export until Stage 4.
- Keep a list of every file you read, listed (not opened) or saw cited. It becomes `02_sources/sources.md`.
- Give the human the **overview in no more than eight lines**:
  - **What this is:** one or two sentences.
  - **What it looks like it is for.**
  - **State:** where things stand.
  - **Size:** files read, listed as secrets and not opened, cited but not seen.
  - **Flags:** safety concerns, confidential material, dates a source states. Only if present.
- Then propose the **slant** (section 4) with the files that led you there and what would make it wrong. A slant has two parts: what the matter is, and what the owner wants done with it.
- If the folder holds two separate matters, say so. Each matter gets its own folder, its own copy of this file and its own slant: two spines, never one mixed.
- Ask: "Is that right? What did I miss?" Keep the reply word for word. It becomes journal entry `J001` (channel `answer`) once you are allowed to write in Stage 2.
- Then run the **slant flow**, the six-rung why-ladder (`docs/slant-flow.md`). One question per turn, each answer kept word for word:
  1. **6 Pattern:** "What have you seen happen: results, actions, or things outside the plan?"
  2. **5 Procedure:** what they want done, and what the outcome looks like.
  3. **4 Process, 3 Policy, 2 Principles, 1 Values:** ask *why*, one rung up at a time. After each why answer, ask "Is that a must or a nice-to-have?" A must is a requirement (a need) and a nice-to-have is a desirable (a want). In Stage 4 it is saved on that rung's node under `## Needs` or `## Wants`, in their words.
  4. Stop when they reach Values, say that's it, or an answer repeats the one below. Write the slant from the highest rung they confirm, then come back down through the nodes.

### Stage 1a. Where the vault lives

Dex does not decide this: you review the area, recommend, and the **human chooses**. The choice is recorded in `00_index.md` as `vault_location:` and honoured on every later run.

| Folder kind | Recommend | Why |
|---|---|---|
| blank or blank-with-context | the folder that holds this file as the vault (a **parent vault**) | a new or context-only area benefits from the vault living with it |
| in-flight (a stuck or running project) | a **sandbox**: a `dex-vault/` folder inside the folder that holds this file | the project is left exactly as it is; Dex writes only into its own folder |

**This version builds and tests the sandbox layout (`dex-vault/`).** The Folio builder and the folder picker assume a folder named `dex-vault/`. If the human picks a parent vault, say plainly that this version does not support it yet and offer the sandbox instead. If a folder named `dex/` exists from an earlier version, it is **never used as the vault**: tell the owner to copy it into `dex-vault/` (copy, never move) and keep the original untouched.

### Stage 1b. Where the work lives (git and GitHub)

After the overview and before any writes, settle where the Dex work lives. Ask once (use the question tool if the harness has one, recommended option first):

1. **A private GitHub repo for the Dex work (recommended).** The vault and its dashboard live in a private repo of their own, rooted at `dex-vault/`. It can be used to build the next version, and changes go to the project's own repo later. Say what you found with `gh auth status`. If there is no signed-in account, guide the owner to create one and sign in; do not do it for them. Ask whether this is a **new** repo or an **existing** one for the Dex work. Suggest the name `<folder>-dex`.
2. **Local only.** Nothing is created on GitHub. The owner can add a repo later (`dex-vault` then offers it again).

Record the choice in `00_index.md` as `home: local | github`. The repo commands run only after `dex-vault/` exists, at the end of Stage 2, each shown first and each after its own yes (rule 3). The repo is always private. If the owner later shares it with another person, that person is treated as public access, so nothing private belongs in it. Never change a repo's visibility.

### Stage 2. Onboarding: suggest five skills

1. Make a quick **coverage forecast**: for each of the six layers, is the material for Plan and for Execute rich, thin or absent? Which parts can only the human answer? Show it as a small table.
2. Choose **five skills** from the library in section 5 that cover the thinnest areas and the places that need human input. `dex grill` (the skill `SK-GRILL`) is always one of the five. If nothing in the library fits a gap, write a custom skill with the template in section 5.
3. Present the five as a numbered list. For each: name and ID, why this matter needs it (one line), the nodes it feeds, whether it needs the human.
4. Ask the human to approve, swap or reorder. In the same message ask which **voice** the story should be told in: `plain` (the default), `storybook`, or a voice they describe. Wait for the answer.
5. On approval, ask for consent to create `dex-vault/`. **Consent is per action** (rule 17): this yes covers creating the folder only. Then ask separately whether you may fetch the DexSpine reference. It is **pinned**: show the owner the repository, the exact ref and the destination first, for example:

   > Fetch `<repo>` at `<ref>` into `dex-vault/.dex/dexspine/` (about a megabyte)? It supplies the standard's own base questions and the DEX838 notation. Without it the vault tool uses a built-in copy of the same questions.

   The ref must be a tag (`vX.Y.Z`) or a full 40-character commit hash, never a branch name (check it with `node dex-vault/.dex/vault.mjs run p2/pin-ref --json '{"ref":"<ref>"}'` once the tool is unpacked). Record the repo and ref in `RUNLOG.md`. Then, in this order:
   1. Create `dex-vault/` and `dex-vault/.dex/`. Clone dex-md at its pinned tag and install the engine (dex.md, Stage 2; section 9).
   2. If the owner said yes to the fetch: `git clone <repo> dex-vault/.dex/dexspine`, then `git -C dex-vault/.dex/dexspine checkout <ref>`. The pinned repo and ref for this version are in section 9.6.
   3. Create the starter vault: `00_index.md` (stage `onboarding`), `01_matter/overview.md`, `01_matter/slant.md`, `02_sources/sources.md`, `05_actions/onboarding.md`, `06_journal/answers/` holding `J001` (the reply to the overview), plus empty `06_journal/raw/`, `05_actions/work/` and `07_inbox/` folders, `RUNLOG.md` (run 1, started) and `MANIFEST.md`. Record the story voice as `story_voice` in `00_index.md`.
   4. **Scaffold all 114 node folders now**: `node dex-vault/.dex/vault.mjs scaffold --title "<short title>" --spine dex-vault/.dex/dexspine` (leave out `--spine` if the clone was declined). Every node starts as a question: state `N`, a base question from the standard, ready for `dex grill`.
   5. Fold and build the Folio (section 9) so the human can watch progress. The Folio shows the onboarding state and an unlit spine.
   6. If the owner chose a private GitHub repo (Stage 1b): write `dex-vault/.gitignore` with the lines `.shadowos/`, `.dex/dexspine/`, `.dex/backup/` and `.dex/state/`, then show each command and run it only after a yes to that command: `git -C dex-vault init -b main`, `gh repo create <name> --private --source dex-vault --remote origin`, `git -C dex-vault add -A`, `git -C dex-vault commit -m "DEX: starter vault"`, and, as its own yes, `git -C dex-vault push -u origin main`. Say what the push sends before you ask.

### Stage 3. Run the five skills

- Set `stage: skills` in `00_index.md`. Run the skills one at a time in the agreed order. Set each one's status to `running` in `05_actions/onboarding.md` and to `done` when it finishes.
- Follow the skill's procedure in section 5. Ask one question at a time, give your suggested answer from the files and wait.
- **Two channels.** An answer to a question you asked is co-produced: save it verbatim in `06_journal/answers/` with the question (channel `answer`). Anything the human says that was not an answer to your question is raw human input: save it verbatim in `06_journal/raw/` (channel `raw`, provenance `PHC`) and run it through the spine at build time. You make the call on which is which. If you are unsure, ask.
- Skill outputs (inventories, timelines, maps) go in `05_actions/work/<SKILL-ID>.md`.
- After each skill give a three-line summary: what was learned, what is still open, what comes next. Fold and rebuild the Folio.
- The human can stop at any point. The vault stays in progress and the Folio shows exactly where it stopped.

### Stage 4. Build the vault

First re-read sections 5 and 7 of this file: the formats matter and long sessions lose them. The vault is the **node folders**. The flat layer files are generated from them.

1. **Confirm the slant, then adapt the questions.** The slant is confirmed when the human has said what the matter is and what they want done with it. If it is not confirmed yet, ask now: adaptation waits for it. Then write a file `dex-vault/.dex/questions.json` of node id to question for every node that is still open, each question reworded for this matter through the slant's lens (section 4). Keep each to one plain sentence. Run `node dex-vault/.dex/vault.mjs adapt dex-vault/.dex/questions.json`.
2. **Sources.** Write `02_sources/sources.md`: every file read, listed or cited, with ID, path, type, date, status and a one-line note. Gitignore-class files get the status `listed, not copied`.
3. **Place the sources.** For each source that bears on a node, run `node dex-vault/.dex/vault.mjs place <path> --node <node id> --id <S id>`. The tool copies it into the node's `sources/` folder next to a source `.md`, or lists it without copying if it is gitignore-class. The original is never changed. Then fill in every `<agent: ...>` placeholder in the source `.md` files: details, instructions for humans and instructions for agents, and the Advice section for a listed file (rule 5).
4. **Claims.** Write The layer files above are **generated** by `vault.mjs fold` from the node folders. You write the node folders and never the layer files.

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
Only the owner's own words, with the journal ID (J002). `-` if none yet. `UNANSWERED` for an empty `hu` node.

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

The front matter keys `state`, `tag`, `sources`, `verified` and `next` feed the layer file's columns. Keep them exact: `state` is `C`, `W`, `N` or `NA`; `next` is `SK-<NAME>: <action>` or `-`.

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

`04_claims/ledger.md`: one statement per row, tagged, with its sources and the nodes it supports. Claims from the human carry the journal ID and channel `answer` or `raw`. Your own readings carry channel `agent` and tag `MODEL` or `UNSURE`. Every claim starts `UNVERIFIED`. A stated deadline is a claim: the owner's words, the source, and a verified-by name and date, or `UNVERIFIED`.
5. **Nodes.** Open each node's `contextual.md` and fill it in (formats in section 7). Use the slant's lens to decide what each point means for this matter.
   - **MVE nodes per layer:** `va` holds the values held at this layer; `hu` holds the human's own words only, verbatim with the journal ID, or `UNANSWERED`; `llm` holds your reading, tagged `MODEL`.
   - **Plan and Execute points:** sixteen per layer, defined in section 7.
   - **Empty nodes stay as questions.** A node with nothing behind it keeps state `N`, the answer `Not observable.` and its Next value `SK-GRILL: <the slanted question>`. A thin node gets state `W` and a strengthen action. An empty `hu` keeps `UNANSWERED` and `SK-JOURNAL`. A node that does not apply gets `NA` and `Not applicable: <why>`.
   - **Actions in the node.** List each action the sources define under `Defined actions`, and each one they imply but do not define under `Undefined actions`. Every undefined action becomes a proposed issue: a row in `05_actions/actions.md`.
6. **Fold and check.** Run `node dex-vault/.dex/vault.mjs fold --checkpoint`, then `node dex-vault/.dex/vault.mjs check`. Fix every problem it names before moving on. The first checkpoint records the baseline.
7. **Actions.** Write `05_actions/actions.md` with the decisions waiting for the human (IDs `D001` onward), the proposed issues from the undefined actions and any override to a node's action.
8. **Index.** Update `00_index.md`: stage `built`, the matter in five lines (tagged, with claim IDs), decisions waiting, links.
9. **Hand-off.** Write `dex-vault/HANDOFF.md` from the template in section 7. It tells an agent pointed at the project folder how to read this vault and how to work an issue.
10. **Self-check.** Count covered, weak, not observable and not applicable per layer. Never flatten weak and not observable together. Fix blank cells and broken IDs before moving on.

**Checkpoints.** The end of Stage 4 and the end of every update run are checkpoints. At each one, run `fold --checkpoint`: it appends to `06_journal/changes.md` the nodes whose state moved since the last checkpoint, so understanding is visibly growing. Then review the slant against what you have learned. If something has shifted it, **propose** the new slant; only the owner can accept it. If they do, keep the old slant in `06_journal/slant-history.md` (date, old slant, new slant, why), rewrite `slant.md`, and run `adapt` again for the nodes still open.

### Stage 4b. Place the Claude project files and the seven dex skills (each on its own yes)

A project needs more than a `CLAUDE.md`. This stage fills the gaps, using what Anthropic documents for Claude Code (sources at the end of this stage). **Rules for every file here:** write only inside a **marked block** (`<!-- dex:managed:start -->` to `<!-- dex:managed:end -->`) or into a **new `dex-` file**; never overwrite or reorder text outside a block; show the **diff first**; one yes per file (rule 17); the human can veto any of it; never write a secret, token or key value (an environment variable **name** is the most a file may carry). The bundled modules do the planning and return what they would write; you do the writing, after the yes. Run one with `node dex-vault/.dex/vault.mjs run <module> --json '{...}'`; `node dex-vault/.dex/vault.mjs modules` lists the input each expects.

| Item | Where | What Dex does | Module that plans it |
|---|---|---|---|
| Verify command | recorded in `CLAUDE.md` | detect from `package.json` scripts or a `Makefile`, **confirm with the human**, never guess | `p2/verify-detect` |
| `CLAUDE.md` | `./CLAUDE.md` or `./.claude/CLAUDE.md` | exists: append a marked dex block and show the diff (the owner's file is edited **with** the owner). Missing: place `dex-claude.md` as `CLAUDE.md` after the yes. Keep it short (the guidance is under 200 lines per file); note it if the file is longer | `p2/claude-md-merge-plan`, `p3/rules-split` |
| `AGENTS.md` | `./AGENTS.md` | Claude Code reads it **only when no `CLAUDE.md` exists**. Say which applies. Never hide an existing `AGENTS.md` behind a new `CLAUDE.md`; if one is needed, make it `@AGENTS.md` plus a Claude-only block (use the import, not a symlink, on Windows) | `p2/agents-md-note` |
| `.gitignore` | `./.gitignore` | propose `CLAUDE.local.md` and `.claude/settings.local.json`; check they are not already tracked | `p2/gitignore-lines` |
| Settings | `.claude/settings.json` | blank: minimal (a schema line and a verify allow rule). Existing: **merge, never overwrite**, show the permissions and hooks diff | `p2/settings-merge` |
| Hooks | `.claude/hooks/dex-*` registered in settings | propose only: a Stop hook that runs the verify command, a PreToolUse guard for paths, a SessionStart status line. A rule in `CLAUDE.md` that says "must" is a hook candidate (instructions are advisory, hooks are deterministic) | `p3/hooks-plan` |
| Subagent | `.claude/agents/dex-reviewer.md` | propose a read-only reviewer with a fresh context | `p3/subagent-plan` |
| MCP | `.mcp.json` | propose only, never silently. Tokens as `${VAR}` placeholders, flag a literal secret in an existing file, warn that non-interactive runs load project servers without asking | `p2/mcp-propose` |
| The seven dex skills | `.claude/skills/dex-<name>/SKILL.md` | copy `dex-grill`, `dex-spec`, `dex-implement`, `dex-review`, `dex-checkpoint`, `dex-loop` and `dex-sprint` from `dex-vault/.dex/skills/`, one yes per skill. Check the path and the frontmatter first | `p2/skill-path`, `p2/skill-frontmatter`, `p3/skill-registry` |
| Auto memory | `~/.claude/projects/<project>/memory/` | Dex does **not** write here. It may suggest lines for the owner to keep | none |

**What is not confirmed.** The research behind this table could not confirm from a primary page: the file-by-file contents of the `.claude` directory page, the exact key shapes of `permissions` and `env` in settings, any size guidance for settings, and the `.claude/output-styles`, `.worktreeinclude` and README conventions. Check the current Claude Code documentation before writing any of those, and say so to the human.

**By folder kind.** A *blank* folder gets a minimal `CLAUDE.md`, the gitignore lines and one verify skill. A *blank-with-context* folder (notes, exports) gets a `CLAUDE.md` that explains the folder layout and imports its index file. An *in-flight* folder gets the marked blocks and **proposals only** (hooks, rules, subagent): nothing structural is added unasked.

Sources (fetched 2026-10-09): code.claude.com/docs/en/memory, skills, settings, hooks, sub-agents, mcp, best-practices; agents.md; agentskills.io/specification.

### Stage 5. Write the Matter of Fact story

Write `dex-vault/08_story.md`: a short story of what has happened, told from the vault. It gives anyone a quick understanding of what the vault holds.

- **Length:** 300 to 700 words, with a title.
- **Order:** tell it in the order things happened, using the dates in the sources and the journal.
- **Only the vault.** Every fact in the story is a claim in the ledger. No new facts, no invented events, no invented quotes. Quote the human only word for word from the journal.
- **Keep the uncertainty.** Unchecked claims are told as what the notes say. `MODEL` readings are told as a reading ("it looks as though"). `UNSURE` items and empty nodes are told as what nobody knows yet.
- **People** appear under the labels the vault uses. Nothing about anyone's health, beliefs or private life. Whatever the voice, the story never mocks, judges or takes sides against any party.
- **End with what is open:** the decisions waiting and the next actions.
- **Footnotes:** put claim IDs in square brackets after the sentences they support. Finish with a section headed `## What this rests on` that lists every claim and journal ID used.
- **Voice** comes from `story_voice` in `00_index.md`. `plain` is clear and neutral. `storybook` is a warm narrative written to be read aloud. Any other value is a voice the human described. A named author or narrator is a style to echo, never a source to copy: no lines, characters, places or catchphrases from anyone's work. For legal or other regulated matters the story still says plainly what is fact and what is not. The voice never changes a fact.

### Stage 6. Build the folio

Run `node dex-vault/.dex/vault.mjs fold`, then the builder (section 9), and confirm `dex-vault/dex-folio.html` exists. The Folio reads the flat layer files that `fold` generates from the node folders, so always fold first. The builder also takes a snapshot of the folder, which the next run uses to see what changed. Tell the human to open it by double-clicking. It works offline in any modern browser.

### Stage 6b. Install ShadowOS (optional)

ShadowOS is a small local web desktop that opens on this folder only (a "fractional desktop"): Finder, the folio, Notes and tickets, Surf and a Claude window. Nothing outside the folder is visible to it. It is optional and **only on the owner's explicit yes**. It needs the Folio from Stage 6, so it always comes after it. If the owner asked for it earlier ("launch ShadowOS"), that is the yes: do not ask again, but still do it here, in order. Otherwise ask once: "Install ShadowOS? It is a small no-build app from the `Dex-RoboKnix/shadowos` repo (private while it is pre-1.0, so `gh` must be signed in to an account that can see it). It needs only Node 20 or newer, no install and no build, and everything stays in `dex-vault/.shadowos/`." If the answer is no, note it in `RUNLOG.md` and go to Stage 7.

**`dex-vault/.shadowos/` is tooling, never material.** Never read it, ingest it, cite it or count it in any stage, now or on later runs.

1. **Already installed?** If `dex-vault/.shadowos/src` exists, do not clone again: offer to launch it (step 4) or to update it (`git -C dex-vault/.shadowos/src fetch --tags`, then check out the ref pinned in section 3 of dex.md). Ask which. **If the owner names an existing copy elsewhere, copy it instead of cloning**: copy its source folder into `dex-vault/.shadowos/src`, write the `.gitignore` of step 3, then check the copy (`git -C dex-vault/.shadowos/src rev-parse --short HEAD` equals the original's, `git status` clean). Copy only. The original stays where it was and keeps running if it is running. Skip steps 2 and 3 and go to step 4.
2. **Check what is needed. Install nothing yourself.** `gh` signed in and able to see the repo (`gh repo view Dex-RoboKnix/shadowos`), `git`, and Node 20 or newer (`node -v`). Nothing else: no Rust, no compiler, no build tools. For anything missing, tell the owner what it is and the command or page that installs it, and let them do it. If something cannot be met, stop, say why, log it and go to Stage 7.
3. **Fetch.** Show the exact command first and run it only on its own yes: `git clone --depth 1 --branch v0.2.0 https://github.com/Dex-RoboKnix/shadowos dex-vault/.shadowos/src` (the ref is pinned in section 3 of dex.md). Then write `dex-vault/.shadowos/.gitignore` containing the single line `*`, so git never picks up the app.
4. **Launch** on the folder that holds this file, **detached**, so it does not hold up this session and stays open after it. Run `fold` and the Folio builder first so it opens on a current vault. The server finds `dex-vault/` under the root:
   - Windows (PowerShell): `Start-Process node -ArgumentList 'dex-vault/.shadowos/src/server.mjs','--root','"<that folder>"','--issues','"<that folder>/dex-vault/07_inbox/shadowos/issues"' -WindowStyle Minimized`
   - macOS and Linux: `nohup node dex-vault/.shadowos/src/server.mjs --root "<that folder>" --issues "<that folder>/dex-vault/07_inbox/shadowos/issues" >/dev/null 2>&1 &`
   The default port is 4174 (`--port` changes it). Open `http://localhost:4174/` and ask the owner to confirm the page shows this vault. If the vault changes afterwards (a rebuilt Folio), reload the page: no relaunch.
5. **Log it** in `RUNLOG.md`: the system, the repo ref and commit (`git -C dex-vault/.shadowos/src rev-parse --short HEAD`), the launch command and the port. If a step failed, log which step and the error. A failed install never fails the run.

ShadowOS writes only to its own `issues/` folder under `dex-vault/07_inbox/shadowos/` (notes and ticket drafts as markdown). It never edits the vault and never sends anything to GitHub: a ticket draft is a markdown file the owner files by hand if wanted. Later runs: `dex shadowos` does step 1.

### Stage 7. Hand back

In no more than ten lines: what was built or changed, the sections skipped, coverage per layer, the top five actions, decisions waiting, where the story is, how to open the Folio (and ShadowOS if it was installed), and how to continue: say `dex grill` to work the open nodes, `dex-vault` again for update mode, and see Stage 8 to get the issues worked. Append the run to `RUNLOG.md`.

### Stage 8. Getting the issues worked (an agent at project level, not Dex)

This is where step 2 starts: the work keeps going until the slant is achieved (every loop's P05 met and the human agrees). Working doesn't mean changing: each change needs its own yes. When an issue closes, offer up to three next actions in one popup (the next issue, a follow-up, or "stop here"). An idea for dex.md itself is filed as an issue and changed between runs, never mid-run. The loop is described in section 3b and run by `dex-loop` and `dex-sprint`.

Dex stays in `dex-vault/`. The work on the owner's own files is done by an agent pointed at the **project folder**, not at `dex-vault/`, so it can change what Dex may not. The path:

1. **Notes and tickets.** In ShadowOS (or by talking to you), the owner adds their own words to an action, and groups actions into a ticket. A ticket is a markdown draft in `dex-vault/07_inbox/shadowos/`. The owner previews it. Nothing is filed until they say so.
2. **Point an agent at the project.** The owner starts their agent (for example Claude Code) in the project folder and says: `Read dex-vault/HANDOFF.md, then work the ticket dex-vault/07_inbox/shadowos/<file>`. `HANDOFF.md` (section 7) tells it how to read the vault and how to work: the owner's words are the intent, each change to a file outside `dex-vault/` is described and approved first, and a backup exists before it is made.
3. **Changing the main project area itself** (for example, moving the vault out of the sandbox into the project, or restructuring the project around it) is never done by Dex. When the owner asks (`dex promote`), write only an **issue** that defines it as the objective: build the vault again in a new folder inside the project, test it with `vault.mjs check`, then migrate it, and only if the owner has confirmed they have a backup. Save it as a ticket draft in `dex-vault/07_inbox/` and add an action row. The agent that works that issue, with the owner's approval of each step, is the check.
