---
provenance: AAC
---

# START (for an LLM working on this repo)

1. Read `README.md` and `CLAUDE.md`.
2. Tests: `npm test` (the 100 module tests) and `npm run testdrive` (follows dex.md end to end in a temporary sandbox against this repo's own tag).
3. To change a module: edit `engine/build/lib/p<n>/<slug>.mjs` and its test, then `npm run build` to regenerate `engine/dex-lib.mjs`. Never edit `engine/dex-lib.mjs` by hand.
4. To change the vault tool: edit `engine/build/src/vault-additions.js` or `engine/build/base/src/vault.mjs`, then `npm run build`.
5. Before any push: `npm run scan` (sensitive-data check). Nothing personal goes in this repo.
6. A release: bump the tag in `dex.md` section 3, commit, tag `vX.Y.Z`, run the test drive, then push the tag on the owner's yes.
