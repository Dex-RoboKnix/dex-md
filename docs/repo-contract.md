---
provenance: AAC
---

# Repo contract

Every Dex repo that dex.md uses meets this. It applies to dex-md first, then to dexspine-core in a branch for review. Nothing is pushed without the owner's yes.

1. **README.** States the repo's layer (L1, L2 or L3), what dex.md uses it for, and a "Which document do I read?" table.
2. **START.md.** Steps for an LLM: build, test, scan.
3. **docs/.** Steps and explainers for a person.
4. **Provenance tags.** `PHC`, `OHC` or `AAC` in the frontmatter of every markdown spec or doc.
5. **Release tags.** `vX.Y.Z`. dex.md pins a tag or a full commit, never a branch.
6. **No personal or sensitive data.** No personal email, legal matter, journals or chat contents. Run the scan before every push. Commit as the GitHub no-reply address.
7. **CLAUDE.md.** Short project rules for the agent.
8. **Licence line.** OpenCore: AGPL-3.0 Core. No Enterprise edition exists.

Pre-1.0 status is stated where it applies. Human authority (Layer 8) overrides any check here.
