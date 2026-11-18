---
provenance: AAC
layer: L1
---

# DexSpine

## For a person

DexSpine is the standard that Dex follows. It sits at L1: it defines, and the L2 products (dex.md among them) follow it. All L2 products are pre-1.0 prototypes.

It has three parts:

1. **DEX838**, the one-line format for a request. See `dex838.md`.
2. **The 8:3:8 Dexfilter**, a fixed set of questions you can slide over any subject:
   - 8 **plan** questions (what it is, why, scope, who cares, success, needs, limits, measures);
   - 3 **MVE** notes: values, your own human words, and what an agent finds;
   - 8 **execute** questions (approach, tools, workflow, artefacts, checks, undo, monitoring, improvement).
3. **dexspine-core**, the reference: the questions written out for six layers, and the DEX838 parser.

A Dex vault is the filter applied once per layer: six layers times 19 notes is the 114 notes in `dex-vault/`.

The idea: where a clear yes or no cannot be reached, the filter adds structure instead of stopping. That is "reduction by addition".

The six layers are also six rungs you climb when you ask "why". You start at Pattern (what you have seen happen), then Procedure, Process, Policy, Principles and Values. `slant-flow.md` uses them.

Human authority (Layer 8) sits over everything. Your veto beats any automated step.

## For an LLM

- DexSpine is L1. dex.md is L2 and conforms. Do not describe any L2 product as shipped.
- One filter application is 19 notes: 8 plan, 3 MVE, 8 execute. The filter is constant; only the subject changes ("filter sliding").
- The human-context note (`hu`) is the human's own words or `UNANSWERED`. Never write it for them, and never mark your own text `PHC`.
- Provenance tags: `PHC` (pure human), `OHC` (original human context), `AAC` (AI-assisted).
- Canonical text: `DEXFILTER.md`, `REDUCTION_BY_ADDITION.md` and the `dex/` corpus in [dexspine-core](https://github.com/Dex-RoboKnix/dexspine-core). This repo explains; it does not redefine.
