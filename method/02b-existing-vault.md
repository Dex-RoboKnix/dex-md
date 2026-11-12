---
provenance: AAC
source: dex.md 0.9 section 2b
---

## 2b. Walking an existing vault

### 0. Upgrade (only when the vault is older than this dex.md)

Read the version in the last row of `RUNLOG.md` and `dex_version` in `00_index.md`. If either is older than this dex.md, do this section first. A newer tool alone does not upgrade a vault: what each version added must be brought into it, or the vault keeps the older shape while the tool reports the new one.

1. **Show the delta.** List each row below that is newer than the vault, in two lines each: what the version added, and what the backfill would change here.

   | Since | What it added | Backfill on upgrade |
   |---|---|---|
   | 0.9 | node folders | flat vault: the move to node folders (section 5 below) |
   | 0.10 | two steps; the why-ladder with `## Needs` and `## Wants` on each rung's `hu` node; words kept twice; `dex-loop` and `dex-sprint` | `scaffold` adds the empty Needs and Wants sections to every node that lacks them. Offer the why-ladder (Stage 1) on the current slant, from rung 6, for the human to answer: never fill it from earlier answers. Place the two new skills (Stage 4b) |
   | 0.10.1 | one agent; the six-part promote | withdraw any subagent proposal. If the vault is already used as the working record, offer `dex promote` |
   | 0.11.0 | no SK skill library: Next values route to `dex-grill`, `task`, `research` or `dex-spec`; Stage 3 sorts older versions and other systems; `audit`; document mode; a fixed action Status set | the sort (Stage 3) for every older item; each `SK-` Next value and action converted to a route, shown as a list and applied on a yes; then `audit`, each finding a proposal (sections 5 and 6 below) |
   | 0.11.1 | the Folio plain view: every note also written as static HTML, for viewers that never run scripts (iPhone file previews, in-app browsers) | rebuild the Folio; nothing in the vault changes |
| 0.11.2 | install needs no GitHub sign-in (dex-md is public); README header; the AGPL-3.0 licence text; provenance on the seven skills | nothing in the vault changes |

2. **Refresh the entry points**, each shown as a diff, each on its own yes:
   - `00_index.md`: `dex_version`, `updated` and the matter in five lines;
   - `HANDOFF.md`: rewritten from the section 7 template with `dex-vault/` paths, keeping the owner's own lines;
   - the CLAUDE.md managed block, from `templates/dex-claude.md`;
   - the `dex-vault/.gitignore` lines (dex.md section 3);
   - a `MANIFEST.md` row for each installed file.
3. **Backfill and measure.** On a yes, run `node dex-vault/.dex/vault.mjs scaffold` (it adds missing sections and never changes a line already written), then `fold --checkpoint`, `check` and `audit`. Show the audit findings: they become the proposals for sections 5 and 6.
4. **Record** the upgrade in `RUNLOG.md` (old version, new version, what was backfilled, what was declined).

Then walk the sections below.

### The walk

The walk is one question per section, in this order. For each section, **first detect** its state, **then show it in two or three lines**, **then ask once** (use the question tool if the harness has one; recommended option first):

1. Overview and slant
2. Setup list (`05_actions/onboarding.md`): every item from an older version or another system has the human's choice (the sort, Stage 3)
3. Sources
4. Claims
5. Spine (six layers: coverage counts, not the tables). **If the vault is flat** (layer files, no node folders), this is where you **propose the move to node folders** and explain it in two lines: each row becomes a node folder with a `contextual.md`, the old tables are copied to `dex-vault/.dex/backup/<date>/` and kept until the owner verifies the result. Only on the owner's yes, run `node dex-vault/.dex/vault.mjs migrate`, then `scaffold`, `fold` and `check`, and show the owner the counts before and after. Never delete the old tables.
   **Fit pass.** A migrate copies each row to the node with the same number, so a list that an older build spread across rows (one party or one rule per row) lands in nodes whose questions it does not answer. After a migrate, and whenever `audit` reports a fit finding, check each named node: does its Answer answer its own question? If not, propose where the material belongs (the node that asks about it, or one node with a heading per item) and leave the node with an answer to its own question or an open question. Move nothing without a yes.
6. Actions and decisions. Every open node's Next names a skill and one specific question, and every action's Status starts with a word from the set in section 7. `audit` lists the ones that do not; propose each fix.
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
