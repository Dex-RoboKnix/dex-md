---
provenance: AAC
---

# Run Dex: steps for an LLM

Follow `dex.md`. This file is the short path.

1. **Check ability.** Can you read and write files? If not, you are in single-document mode: run Stages 1 to 3 in conversation only.
2. **Check tools.** `node --version` (18+), `git --version`, `gh auth status`. If `gh` is missing or signed out, stop and give the human the sign-in text from dex.md. Do not sign in.
3. **Detect state.** `dex-vault/RUNLOG.md` present means an existing vault: follow `method/02b-existing-vault.md` once cloned. Otherwise it is a new vault.
4. **Stage 1 (read only).** Classify the folder from file names: blank, blank-with-context, in-flight (`.git` or `.scratch` wins). Never open secret-class files. Give an overview. Run the slant flow (`slant-flow.md`). Ask where the vault and the work live.
5. **Stage 2.** On separate yeses: create `dex-vault/`; show then run `git clone --depth 1 --branch <tag> <dex-md url> dex-vault/.dex/dex-md`; run `node dex-vault/.dex/dex-md/engine/install.mjs`; optional dexspine-core clone on its own yes; update `.gitignore`; scaffold nodes.
6. **Stage 3.** Run the five skills, one question per turn, answers verbatim.
7. **Stages 4 and 4b.** Build the vault. Place the Claude files and skills as diffs, each on its own yes.
8. **Stages 5 to 8.** Story, folio, optional ShadowOS, hand back, issues.
9. **Throughout.** Log every yes in `RUNLOG.md`. End each skill with a `checkpoint`. Label simulated answers `[SIMULATED]`. Stop and ask if unsure.

Before each stage read its `method/` file in the clone. Do not read `engine/`.
