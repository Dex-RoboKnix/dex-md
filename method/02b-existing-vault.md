---
provenance: AAC
source: dex.md 0.9 section 2b
---

## 2b. Walking an existing vault

The walk is one question per section, in this order. For each section, **first detect** its state, **then show it in two or three lines**, **then ask once** (use the question tool if the harness has one; recommended option first):

1. Overview and slant
2. Five skills (status of each)
3. Sources
4. Claims
5. Spine (six layers: coverage counts, not the tables). **If the vault is flat** (layer files, no node folders), this is where you **propose the move to node folders** and explain it in two lines: each row becomes a node folder with a `contextual.md`, the old tables are copied to `dex-vault/.dex/backup/<date>/` and kept until the owner verifies the result. Only on the owner's yes, run `node dex-vault/.dex/vault.mjs migrate`, then `scaffold`, `fold` and `check`, and show the owner the counts before and after. Never delete the old tables.
6. Actions and decisions
7. Story
8. Folio
9. ShadowOS

**Detect** means: `absent` (file or folder missing), `present` (there and its `updated` or `written` date is not older than the newest change in the material or in `07_inbox/`), or `stale` (older than that, or missing IDs the other files use). Use `node dex-vault/.dex/build_folio.mjs --changes` when the builder exists; otherwise compare dates and say the check is rough.

**Ask** with exactly these choices:

- **Skip (keep as it is)**: touch nothing, go on to the next section. The default when the section is `present`.
- **Change it**: say what you propose to change, wait for the owner's yes, apply only that, then go on.
- **Rebuild it**: write the section again from the sources. Only when asked. Back it up first by copying it to `dex-vault/.dex/backup/<date>/`.

For `absent` or `stale` sections the recommended option is **Change it**. For `present` it is **Skip**.

Rules for the walk:

- **Human edits win.** Never overwrite a node, claim or journal entry a human wrote or checked. Say so when you skip one.
- **Journal IDs continue.** New journal entries carry on from the highest existing `J` number. Ids are never reused.
- **Skills already `done` are not re-run.** Offer them only as "Change it" if the owner raises one.
- **Record each choice** (section, state, choice) in the `RUNLOG.md` summary so the next run sees what was skipped and why.
- **An early request keeps its place.** A request such as "launch ShadowOS" is noted, then done at section 9 after the Folio is current. Never run a later section first.
- **Say what you did not do.** In the hand back (Stage 7) list the sections skipped.

After section 9, go to Stage 7.
