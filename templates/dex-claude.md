<!-- dex:managed:start -->
# CLAUDE.md (managed by Dex)

This file was placed by `dex.md`. Edit it freely: Dex only ever changes the text between the `dex:managed` markers, and only after showing you a diff and getting your yes.

## What this folder is
<!-- Dex fills this from the slant the human confirmed: what the matter is, and the outcome wanted. -->
Not set yet. Run `dex-grill`, which asks you and records the answer in `dex-vault/01_matter/slant.md`.

## Verify command
<!-- Dex asks you and writes the confirmed command here. It never guesses. -->
Not set yet.

## Where the work lives
- The vault is `dex-vault/`: one folder per spine node, each with a `contextual.md`. Read `dex-vault/00_index.md` first.
- The dashboard is `dex-vault/dex-folio.html`; it is generated, never edited by hand.
- The vault tool is `node dex-vault/.dex/vault.mjs` (commands: scaffold, place, adapt, fold, check, classify, checkpoint, modules, run).

## How to work here
1. **The human decides.** You propose. Nothing outward (issues, pushes, comments, new files outside `dex-vault/`) without a yes, one action at a time.
2. **Grill before you build.** Use `dex-grill` to get the human's answers across the nodes; do not answer for them. An answer that did not come from the human is tagged `[SIMULATED]` and never verifies anything.
3. **The loop:** `dex-grill`, `dex-spec`, `dex-implement`, `dex-review`, then spec and implement again until the outcome is met. A task gets 2 attempts; after the second failed review it goes to a higher model. At most 8 agents live.
4. **Every skill ends with** `node dex-vault/.dex/vault.mjs checkpoint --skill <name> --summary "<what was done>"`. A checkpoint never applies node changes; those wait for the human's yes.
5. Keep the human's words verbatim. Keep your own reading separate and tagged (`DOCUMENT`, `CITED`, `MODEL`, `UNSURE`).
6. Secrets (`.env`, keys, tokens) are listed, never copied, opened or quoted.

## Not here
Anything specific to one matter belongs in the vault, not in this file.
<!-- dex:managed:end -->
