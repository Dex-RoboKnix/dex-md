---
provenance: AAC
source: dex.md 0.9 section 9
---

## 9. The engine: cloned and installed

The engine lives in the `dex-md` repo, not in dex.md. Stage 2 clones it at the pinned tag into `dex-vault/.dex/dex-md/` and `engine/install.mjs` copies eleven files into `dex-vault/.dex/`: `vault.mjs` (the vault tool), `dex-lib.mjs` (100 small tested modules the tool and you call), `build_folio.mjs` and `build_folio.py` (the two Folio builders), `dex-folio.template.html` (the Folio), `dex-claude.md` (the CLAUDE.md template) and five skill files (`skills/dex-grill.md`, `dex-spec.md`, `dex-implement.md`, `dex-review.md`, `dex-checkpoint.md`). They are tested code and prototype skills. You do not write them and you do not read them. Run every command from the folder that holds dex.md.

**Which runtime.** The vault tool and ShadowOS need Node 18 or later: check `node --version`. The Python builder is optional. On a Mac, `python3` comes with Apple's Command Line Tools: run `xcode-select -p` before `python3 --version`, because without the tools `python3` opens an installer.

### 9.1 Install

After the pinned clone (dex.md, Stage 2) run `node dex-vault/.dex/dex-md/engine/install.mjs`. It should say it installed 13 files. Record them, with the tag, in `MANIFEST.md`. It writes only inside `dex-vault/.dex/`; the skill files are **not** placed in `.claude/skills/` until Stage 4b and the human's yes. To update, the owner approves a new tag, you fetch and check it out in the clone and run the installer again.

### 9.2 The vault tool

`node dex-vault/.dex/vault.mjs <command>`. It is the only thing that creates, moves or counts node folders, so the shape is always right.

| Command | What it does |
|---|---|
| `scaffold --title "<matter>" [--spine dex-vault/.dex/dexspine]` | Makes all 114 node folders, each with `contextual.md` and `sources/`. Never overwrites a node. `--spine` takes the base questions from the cloned DexSpine standard. |
| `place <file> --node L1.P01 --id S004` | Copies a source into the node's `sources/` beside a source `.md`. A gitignore-class file is listed with `copied: false` and never copied. Never changes the original. |
| `adapt <questions.json>` | Sets each named node's slanted question: the open question, the Next column and the wire string together. |
| `fold [--checkpoint]` | Writes the six flat layer files from the node folders. `--checkpoint` logs nodes whose state moved since the last checkpoint. |
| `check` | Checks the shape: 114 node folders, both sections in every `contextual.md`, a source `.md` per placed source, no gitignore-class file copied. Exit code 1 and a plain list of problems if not. |
| `migrate` | Builds node folders from an older flat vault. Copies the flat tables to `dex-vault/.dex/backup/<date>/` first. |
| `modules` | Lists the 100 bundled modules with the spine node each serves and the input each expects. |
| `run <module> --json '{...}'` (or `--input file.json`) | Runs one bundled module and prints its JSON result. Modules are pure: they never write. They return `audit` (what to log), `effects` (what to write, as `{kind, path, content}`) and `trace`; you apply an effect only after the human's yes where rule 17 asks for one. Timestamps are passed in as `now`; a module never reads the clock. |
| `classify [folder]` | Lists a folder's top level (names only, never contents) and classifies it blank, blank-with-context or in-flight; also lists secret-class file names. |
| `checkpoint [--skill <name>] [--summary "<text>"] [--chapter "<text>"]` | Closes a skill (rule 18): folds the vault, counts node states, computes coverage (covered 1, weak half, not observable and unsure 0, not applicable out of the denominator; no layer weights), appends a RUNLOG row and, when `08_story.md` exists, one dated story chapter that never rewrites an earlier one, then runs the vault check. It prints the coverage and whether it is below the 90% bar (ask the human) or at it (suggest changes). It does **not** apply node changes, write the journal or rebuild the Folio: do those next. |

### 9.3 Build the Folio

Run `node dex-vault/.dex/vault.mjs fold`, then `node dex-vault/.dex/build_folio.mjs` (or, if there is Python, `python3 dex-vault/.dex/build_folio.py`; on Windows `python`). The builder uses the installed Folio template, embeds every markdown file in `dex-vault/` except the node folders (the layer files carry those), writes `dex-vault/dex-folio.html` and takes a snapshot. Add `--changes` to list what changed since the last build without building. Rebuild after every change. Never edit the HTML by hand: the vault is the source of truth.

### 9.4 If you cannot run Node

Create the node folders and their `contextual.md` files yourself with your file tools, in the section 7 format, and write the six layer files by hand in the layer-file format. For the Folio, copy `engine/dex-folio.template.html` from the clone to `dex-vault/.dex/` with your file tool, then ask the human to open it in a browser, click **Link folder** and pick the `dex-vault` folder.

The Folio then reads the vault directly. Chrome and Edge keep a live link that refreshes as the vault changes. Safari and Firefox load it once per pick. Never edit the template.

### 9.5 What the Folio does

Read only. It never writes to the vault. It looks like a dark mode Mac app and opens as a knowledge base first. The visual views sit in the tabs at the top.

- **Notes (opens first):** the vault as a knowledge base. A sidebar with search, favourites (Home, Overview, Story, Actions, Claims) and every folder and note. The note in the middle with its title, its front matter as properties and its body. Wiki links and `[C001]` style IDs are clickable. On the right: a small spine preview, the note's outline, the notes that link to it and the nodes and claims it mentions. Home (`00_index.md`) opens with cards for the spine, the story, actions and the ledger. Back and forward with `[` and `]`. **Source** shows the raw markdown.
- **Pictures in notes:** `![caption](path)` or `![[file.png]]` shows a picture from the folder that holds dex.md. Paths are from that folder, like source paths. Nothing is copied or uploaded: the picture shows when the Folio sits in its vault and a placeholder shows anywhere else. Web images are never loaded.
- **Spine, as a node map:** DEXSPINE laid out the way it is built. Six layers run down the page from L1 Values to L6 Pattern. Each layer runs across: eight Plan points, the three MVE nodes, eight Execute points. Dotted lines carry each point down the spine and sources sit along the bottom. Colour shows state, pulsing rings are actions and a green ring means a human checked it. Click a node for its entry, its sources (with evidence beams), its claims and its slant reading. Press `O` to fold the map into an orbit view. Drag, scroll or pinch to move, hold Shift for a lens and use the arrow keys to walk the spine.
- **Story:** the Matter of Fact story, typeset for reading, with its claim footnotes. **Read aloud** uses the computer's own voices (a British English voice when there is one).
- **Actions, Ledger, Sources:** the five onboarding skills and every action, the claims table and the sources. A **Media** tab appears when the vault has a `02_sources/media.md` table (columns ID, File, Shows, Use, Call, Notes).
- **Timeline:** scrub or play through dated sources, journal entries and runs to watch the spine assemble.
- **Decisions:** the human can verify, dispute, prioritise or defer from the Folio. Decisions export as a markdown file for `dex-vault/07_inbox/`, applied by the agent on `dex review`. A decision needs the person's name.
- **Copy prompt:** each action copies a ready-made prompt for the agent.
- **Checks:** the Folio's own health check of the vault: blank entries, missing rows, broken IDs and anything marked verified without a named person.
- **Command palette** with Cmd+K or Ctrl+K. **Link folder** for a live view.

### 9.6 The pinned DexSpine reference

The reference the install may fetch (Stage 2, on its own yes) is pinned for this version of dex.md. It is shown to the owner first and recorded in `RUNLOG.md`.

| | |
|---|---|
| Repository | `https://github.com/Dex-RoboKnix/dexspine-core` |
| Ref (a full commit hash, never a branch) | `fbcd0a89008e87416c5a0bfe6b56524b584b49a8` |
| Checked | the ref was on `origin/main` in the maintainer's local clone on `2026-10-09`; it was not re-checked against the remote. If the clone cannot check it out, say so and use the built-in questions. |
