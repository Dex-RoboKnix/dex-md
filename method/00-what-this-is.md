---
provenance: AAC
source: dex.md 0.9 section 0
---

## 0. What this is

A **Matter of Fact** is a plain, objective description of what a matter is: what exists, what state it is in, what is claimed, what is actually known and what nobody knows yet. A matter can be anything a folder is about: a half-built product, a research pile, a plan, a recipe collection, a dispute, a job search, a codebase.

**Dex is the entry point into Dex: one file you attach to a live or blank project that acts as a lens on the matter, builds and keeps updating its DexSpine vault (a shared second brain for you and an LLM), and turns the work into issues.** Dex is a workspace for adding the owner's own thoughts to actions and issues in a project before an agent reasons about them and fixes them. Dex builds the DexSpine, DEX838 gives every node one universal wire form, the folio and ShadowOS are the human interface, and an agent working at project level implements the issues or passes them on.

It is not a hosted service, not a model or a fine-tune, not a prompt library and not a replacement for a task tracker or GitHub. It works with those and helps improve them.

This file is a **universal installer** (an L2 product; DEX838 and DexSpine, L1, define it). It needs nothing except this file, a folder and an agent that can read it. **It holds nothing about any particular matter.** You start open and slant-free. You read the folder first, then draft what kind of help the matter needs (its **slant**: what it is, five takeaways, the outcome wanted) from where you are and what is there, and the human edits and confirms it. The same file slants differently in a half-built app folder, a pile of chat exports or a legal file, because the slant comes from the location and never from this file.

**dex.md finds a better balance between quality and efficiency, keeping the human in the loop before things change.** The workflow is a brake: nothing changes without the human's yes. If the human follows it, it works. If a stage is skipped, it does not. You do not take over: you grill the human across the nodes first and you assess coverage at every checkpoint.

**Two steps.** Step 1 sets up and cleans up: the vault, the requirements (needs) and desirables (wants), the confirmed slant, and a sort of everything from an older version or another system, asking the human what to keep, what goes where and what to archive (Stages 1 to 7). Step 2 keeps the work going until the slant is achieved: the skills loop works the issues (Stage 8, section 3b), and a slant is achieved when every loop under it has met its success criteria (P05) and the human agrees.

**The sandbox.** Everything Dex makes goes in `dex-vault/`, next to this file. The owner's own files are only ever read. Changing the main project area is a separate step, done by an issue (Stage 8), never by Dex itself.

**What you produce**

1. A short overview of the matter, given back to the human as your first output.
2. A decision on where the work lives: local only, or a private GitHub repo (Stage 1b).
3. A setup list: everything from an older version or another system, with the human's choice for each (keep, where, archive), asked one item at a time.
4. After the sort and the first grill rounds: a vault in `dex-vault/` with the matter transformed across the six DEXSPINE layers. **Every node is a folder**: 6 layers x 19 nodes, all 114 from the first run. Empty nodes hold questions adapted to the slant, so `dex grill` can work them.
5. `dex-vault/08_story.md`: **the Matter of Fact story**, a short retelling of what has happened, built only from what the vault holds (Stage 5).
6. `dex-vault/dex-folio.html`: a single file that visualises the vault on a desktop browser as a DEXSPINE node map. It is generated from the vault and never edited by hand.
7. Optionally, ShadowOS: a desktop opened on this folder only, with a project-level hand-off for the agent that will work the issues (Stages 6b and 8).

**Who decides.** You are the conductor: you read, map, propose and build. The human decides. Nothing you write is a fact about the matter until the human has checked it.
