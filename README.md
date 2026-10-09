---
provenance: AAC
layer: L2
---

# dex-md

The method, engine and skills behind **dex.md**, the one-file installer for Dex. dex.md holds only the rules, the consent steps and the stage list; at Stage 2 it clones this repo at a pinned tag into `dex-vault/.dex/dex-md/` and installs the engine from it.

**Layer: L2** (a product that conforms to DEX838 and DexSpine, which are L1 and live in [dexspine-core](https://github.com/Dex-RoboKnix/dexspine-core)). Pre-1.0 prototype.

## Which document do I read?

| You are | Read |
|---|---|
| A person who wants to use Dex | `dex.md`: put it in a project folder and tell your agent "Read dex.md and follow it" |
| An agent running dex.md | `dex.md`, then the `method/` file each stage names. Do not read `engine/` |
| An agent working on this repo | `START.md`, then `CLAUDE.md` |
| A person working on this repo | `docs/` |

## Layout

| Folder | What | Used by dex.md for |
|---|---|---|
| `dex.md` | the installer | everything; it is the file people copy |
| `method/` | stage detail (one file per section of the 0.9 instructions) | read by the agent at each stage |
| `engine/` | the vault tool, `dex-lib.mjs` (100 modules), Folio builders and template, `install.mjs` | installed into `dex-vault/.dex/` at Stage 2 |
| `engine/build/` | module sources, tests and the tools that build `engine/` | not used at runtime |
| `skills/` | the five dex skills | installed at Stage 2, placed in `.claude/skills/` at Stage 4b on the owner's yes |
| `templates/` | the CLAUDE.md template | installed at Stage 2, used at Stage 4b |
| `docs/` | explainers and implementation steps | for people; not read during a run |

## Releases

dex.md pins a tag (`vX.Y.Z`). A new release is a new tag and a new dex.md; an old dex.md keeps working against its own tag.

## Licence

OpenCore: this Core edition is AGPL-3.0. No Enterprise edition exists.
