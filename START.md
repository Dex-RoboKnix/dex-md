---
provenance: AAC
---

# START (for an agent working on this repo)

1. Read `README.md` and `CLAUDE.md`.
2. Tests: `npm test` runs every module and tool test. `npm run testdrive -- <empty dir>` follows dex.md end to end in that sandbox: it clones this repo at the tag dex.md pins, installs the engine and runs the vault tool, so it tests the released tag, not your working tree.
3. To change a module: edit `engine/build/lib/p<n>/<slug>.mjs` and its test in `engine/build/test/p<n>/`, then `npm run build`. Modules are pure: no writes, no clock, no network, no environment. Never edit `engine/dex-lib.mjs` by hand.
4. To change the vault tool: edit `engine/build/src/vault-additions.js` (new commands go in `engine/build/tools/make-vault.mjs` too), then `npm run build`. Tool tests are in `engine/build/test/tool/`.
5. The DEX838 parser module is built from dexspine-core at a pinned commit by `engine/build/tools/make-dex838.mjs`. Run its check with `DEXSPINE_CORE=<dexspine-core clone> npm test`.
6. Before any push: `npm run scan` (sensitive data in tracked files and commit addresses) and the public-push check from dexspine-core (`scripts/public-push-check.mjs`), which also reads the history. A hit the owner decides may stay goes in `.public-push-clear` with their journal reference. Nothing personal goes in this repo.
7. A release, each step on the owner's yes: set the version in `package.json` and dex.md's front matter, move the tag in dex.md section 3, date the CHANGELOG section, `npm run build`, `npm test`, both checks, commit, tag `vX.Y.Z`, push `main` and the tag, then run the test drive against the pushed tag.
