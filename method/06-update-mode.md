---
provenance: AAC
source: dex.md 0.9 section 6
---

## 6. Later runs: update mode

When a vault already exists, do not start over. Read `RUNLOG.md`, `MANIFEST.md`, `00_index.md`, `05_actions/onboarding.md`, `05_actions/actions.md` and anything in `07_inbox/`. Give a three-line status (last run, coverage, decisions waiting), then offer the **five update actions**. The human can run all five in order or pick.

1. **Detect.** Run `node dex-vault/.dex/build_folio.mjs --changes` (or the Python builder with `--changes`). It compares the folder with the snapshot taken at the last build. It lists files added, changed or removed in the material and files changed inside `dex-vault/` since then (usually a human's edits). Add any decision files waiting in `07_inbox/`. Report it as a short list. If there is no snapshot, compare file dates with the last run date in `RUNLOG.md` and say the check is rough.
2. **Ingest.** File new material: new sources (placed with `vault.mjs place`), new claims, node updates. Propose changes and never overwrite a human's edit or a human-checked value. Mark the nodes you changed.
3. **Review.** Apply the decision files in `07_inbox/` (exported from the Folio) and walk the human through decisions still open. Only a row marked `verify` can move a claim to `VERIFIED`. The checker is the person named in it. Ignore any decision row with no name in its By column and tell the human. Move processed files to `07_inbox/done/`.
4. **Grill the gaps.** Run `dex grill` (`SK-GRILL`) on the weakest nodes: not observable before weak, Values and Purpose first.
5. **Maintain, retell and rebuild.** Health check: contradictions between nodes, IDs that point nowhere, blank cells, anything `VERIFIED` without a named checker, `MODEL` readings that new sources contradict. Run `node dex-vault/.dex/vault.mjs fold --checkpoint` and `check`. Review the slant at this checkpoint (Stage 4). Recompute coverage, rewrite the story if anything in it changed, rebuild the Folio and append to `RUNLOG.md`.

**Human edits win.** If a human changed a node or a claim, keep their version and log a note in `RUNLOG.md`.
