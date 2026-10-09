---
provenance: AAC
source: dex.md 0.9 section 2
---

## 2. Start: choose the mode

**Step 1. Check what you can do.** Can you read files in a folder? Write files? Run `node` (version 18 or later: the vault tool and ShadowOS need it) and optionally `python3`? Is the folder a git repository? Is `gh` installed and signed in (`gh auth status`)? Reading these is allowed. Nothing is installed or changed.

- **Vault mode:** you can read and write files. This is Claude Code in a terminal, the Code section of the Claude desktop app, Cowork with a folder connected, or any agent harness with file access.
- **Single-document mode:** you cannot write files (a chat window, NotebookLM, a web chat with attachments). Follow section 8.

**Step 2. Look for an earlier run.** Check for `dex-vault/RUNLOG.md` in the folder that holds this file (or the folder the human points at).

- **No `dex-vault/` at all:** a **new vault**. Go to section 3 and walk it stage by stage.
- **`dex-vault/` exists** (any stage, with or without `RUNLOG.md`): an **existing vault**. Do not start over and do not pick a branch for the human. Go to section 2b and walk it.
- If the version in `RUNLOG.md` differs from this file's version, say so and **offer** (do not just do it) to check out the newer pinned tag and run the installer again (section 9), then rebuild.
- **A flat vault** (`dex-vault/03_spine/L1_values.md` and the other layer files, but no node folders): an older vault. Do not convert it silently. Section 2b proposes the move to node folders and the owner approves it.
- **Where is the material?** It is the folder that holds this file unless the human names another (for example the parent folder `../`). Ask once, in the same message as step 3. Record it as `material:` in `00_index.md` and write source paths relative to the folder that holds this file (so `../README.md` for a parent). Nothing outside this folder is ever written to.

**Step 3. Say where you are** in one line, for example: "Vault mode, new vault. I'll read this folder now. Nothing will be written yet." or "Vault mode, existing vault at stage built (run 2, version 0.7). I'll show you each section and you choose to change it or skip it." If the owner already asked for something later in the order (for example "launch ShadowOS"), say it will happen at its place in the order, after the sections before it.
