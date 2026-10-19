---
provenance: AAC
layer: L1
---

# DexSpine

## For a person

DexSpine is the standard that Dex follows. It sits at L1: it defines, and the L2 products (ShadowOS, DexCLI, DexFolio, DexScape and dex.md) conform to it. All L2 products are pre-1.0 prototypes.

It has three parts:

1. **DEX838**, the wire syntax for a request. See `dex838.md`.
2. **The 8:3:8 Dexfilter**, a fixed set of questions you can slide over any subject:
   - 8 **plan** questions (what it is, why, scope, who cares, success, needs, limits, measures);
   - 3 **MVE** files: `va.md` (values), `hu.md` (your own human words), `llm.md` (what an agent finds);
   - 8 **execute** questions (approach, tools, workflow, artefacts, checks, undo, monitoring, improvement).
3. **dexspine-core**, the reference implementation in code.

The idea: where a clear yes or no cannot be reached, the filter adds structure instead of stopping. That is "reduction by addition".

The spine also has six rungs you climb when you ask "why". You start at Pattern (what you have seen happen), then Procedure, Process, Policy, Principles and Values. `slant-flow.md` uses them.

Human authority (Layer 8) sits over everything. Your veto beats any automated step.

## For an LLM

- DexSpine is L1. Dex (dex.md) is L2 and conforms. Do not describe any L2 product as shipped.
- One filter application is 19 files: 8 plan, 3 MVE, 8 execute. The filter is constant; only the subject changes ("filter sliding").
- `hu.md` is the human's. `generateMveFiles` in `packages/dexspine-core/src/mve.js` withholds `hu.md` if no human insight is given. Never write one for them, and never stamp `PHC` on your own text.
- Provenance tags: `PHC` (pure human), `OHC` (original human context), `AAC` (AI-assisted).
- Inventory nodes are the cheaper default; a full filter application is for subjects that earn one (see `CONTEXT.md`).
- Canonical text: `DEXFILTER.md` and `README.md` in `dexspine-core`. This repo explains; it does not redefine.
- Use the terms in `CONTEXT.md`. Do not write the retired names it lists.
