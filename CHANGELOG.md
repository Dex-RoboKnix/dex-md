---
provenance: AAC
---

# Changelog

## Unreleased (0.11.3)

- **Get back on track (rule 22).** A stopped or closed question means stop, say what is held and wait. An answer to something else parks the open question, deals with the new point, then asks the held question again as it was asked. The rule is in dex.md, `method/01-rules.md`, dex-grill, dex-loop and the CLAUDE.md template.
- **An install that stopped part-way carries on.** `stage` in `00_index.md` records the last stage finished (`2` to `6b`, then `built`). A new session reads it and offers to carry on from the next stage.
- **Rules mirror.** `method/01-rules.md` rules 2 and 3 now match dex.md (the Stage 4b exception and the pinned clones).
- **README.** A Start section: the download link, where to put the file, what to say, and what is needed.

## 0.11.2 (2026-11-12)

- **Install needs no GitHub sign-in.** dex-md is public, so the pinned clones in dex.md section 3 need no sign-in. A sign-in is needed only for the private-repo option (Stage 1b) and for ShadowOS (Stage 6b, a private repo for now).
- **README header.** The README states the layer (L2), the licence (AGPL-3.0-or-later for the open Core edition) and the pre-1.0 status.
- **Licence text.** The full AGPL-3.0 text is in `LICENSE`.
- **Consistency pass.** Current names are used throughout, the licence wording is the same in every file, and the private-repo and ShadowOS notes match dex.md.
- **Send what you make.** dex-loop (hard rule 6) and dex-checkpoint (step 4) send every file made for the human to their device with `SendUserFile`, with a one-line caption; a path in the chat is not delivery. Working files and secrets are never sent.
- **Provenance on the skills.** Each of the seven skills in `skills/` carries `provenance: AAC` in its frontmatter.
- **Version.** dex.md, `package.json` and the vault tool report 0.11.2. Nothing in the vault changes on upgrade.
