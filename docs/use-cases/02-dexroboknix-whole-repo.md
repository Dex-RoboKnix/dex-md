---
provenance: AAC
---

# Use case 2: DexRoboKnix, one Folio for the whole repo

**Profile.** Dan, owner of DexRoboKnix, a monorepo that holds L1 governance, DexSpine and several L2 products, all pre-1.0. Directory paths do not encode layers, so the repo is hard to read from its folders.

**Folder kind.** In-flight: `.git` and `.scratch` are present.

**Configuration.** One vault at the repo root, one folio over the whole repo. Good for a single map of everything and the layer map. Costs: the vault is large and the slant must cover many products.

## Why-ladder (illustrative answers)

| Rung | Answer |
|---|---|
| 6 Pattern | "Prototypes pile up and I lose track of which ones still run." |
| 5 Procedure | "I want to see what is real, what is a prototype and what is stalled." |
| 4 Process | "So I can decide what to build next at L1." |
| 3 Policy | "Core never imports Enterprise; layers come from CONTEXT.md." |
| 2 Principles | "Human authority sits over every automated choice." |
| 1 Values | "Deterministic collaboration between a person and an LLM." |

## Slant

Technical audit: specs and code of unclear status. Evidence: many products started, none shipped. Wrong if the real aim is to ship one product. The lens reads Success Criteria as "which pieces are verified".

## Sort and first grill angles

Stage 3 first sorts anything from an older version or another system (keep, where, archive). Then `dex-grill` works the gaps through the inventory, stall, rules and done angles (method section 5).

## Privacy notes

- Nested git repos are separate; Dex does not touch them.
- Secrets and `.env` files are listed, never opened.
- Personal notes and scratch material stay out of any public push. Scan first.
- Dex writes only inside `dex-vault/`. Changes to the repo become issues.

## What done looks like

One vault with an inventory of every product and its real state, a stall review, one folio, and an issue list. Dan has confirmed the slant. No L2 product is described as shipped.
