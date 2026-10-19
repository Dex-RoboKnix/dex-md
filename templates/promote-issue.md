---
provenance: AAC
template: promote-issue
---

# Promote: make the {{vault}} vault live in {{project}}

A vault is a **test** vault while it lives in `dex-vault/` as a sandbox. It becomes **live** when this issue has been worked: the vault is rebuilt in the real project folder, it passes the check, and the owner ticks this plan. Dex writes this issue; it never does the move. An agent pointed at the project folder works it, one step at a time, each step on the owner's yes.

## 1. What moves and where

- From: `dex-vault/` in {{project}}.
- To: the place in the project the owner chose.
- One line for each folder or file that moves.

## 2. What is replaced

Every existing file or folder in the project that the live vault replaces or changes, one line each. If nothing is replaced, say "Nothing".

## 3. Backup evidence (checked first)

What counts as a backup here: {{backup}}

- [ ] The backup exists. Its location and date are written here.
- [ ] It was checked (by hash, file count or a test restore) before part 1 starts.

## 4. The test

How this project shows the move worked: {{test}}

- [ ] `node dex-vault/.dex/vault.mjs check` passes on the rebuilt vault.
- [ ] The owner has gone through this plan and says it passed.

## 5. Rollback

How to undo the move: restore from the backup in part 3, then remove what part 1 added. One line for each step.

## 6. Overview before any push (Layer 8)

Before anything is committed or pushed, show the owner every file changed, added and removed, and where each goes. Nothing is pushed without the owner's yes.
