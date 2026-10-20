---
provenance: AAC
layer: L2
---

# dex.md

## For a person

dex.md is one short file you drop into a project folder. You tell your agent: "Read dex.md and follow it." It then:

1. Reads the folder and tells you what it sees (it changes nothing).
2. Asks you why you want the work done, step by step (the slant flow).
3. Builds a vault called `dex-vault/` next to the file. This is a shared second brain for you and the agent.
4. Sorts anything from an older version or another system by asking you what to keep, where it goes and what to archive, then grills you one question at a time and keeps your words twice: exactly as typed, and spelling-checked.
5. Writes a short story of the matter, builds a folio (a one-page view of the vault) and turns open work into issues.

It asks before every action. A yes to one thing is not a yes to the next. It never edits your own files.

The file is short because the detail lives in this repo. dex.md clones the parts it needs, at a fixed tag, when a stage needs them. The repo is private, so you must be signed in to GitHub with access. See `implement-human.md`.

Dex is L2 and pre-1.0. It is a working prototype.

## For an LLM

- You read `dex.md` (about 300 lines): rules, consent, sign-in check, pinned clones, stage list.
- Run `gh auth status` first. If it fails, stop and give the human the sign-in text. Do not sign in for them.
- Clone per stage: Stage 2 clones `dex-md` at a tag; `dexspine-core` only on its own yes; ShadowOS only if wanted. Shallow, pinned, shown first, logged in `RUNLOG.md`.
- Read the `method/` file for each stage before you run it. Do not read `engine/`.
- Spend tokens on the grilling. Placing files is mechanical.
- Write only in `dex-vault/` unless a named exception has a yes.
- Keep the human's words verbatim. Tag statements `DOCUMENT`, `CITED`, `MODEL` or `UNSURE`. Never write `VERIFIED` yourself.
- See `implement-llm.md` for the steps and `slant-flow.md` for Stage 1.
