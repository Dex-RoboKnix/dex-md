---
provenance: AAC
layer: L2
---

# dex.md

## For a person

dex.md is one short file you drop into a project folder. You tell your agent: "Follow dex.md." It then:

1. Says what it can do and whether it is signed in to GitHub, and writes nothing yet.
2. Reads the folder and tells you what it sees (it changes nothing).
3. Asks you why you want the work done, step by step (the slant flow), until it can say in one line what the work is for.
4. Builds a vault called `dex-vault/` next to the file: a shared second brain for you and the agent.
5. Sorts anything from an older version or another system by asking you what to keep, where it goes and what to archive, then asks about whatever is weak, one point at a time. Your words are kept twice: exactly as typed, and spelling-checked.
6. Writes a short story of the matter, builds the Folio (a one-page view of the vault) and turns open work into issues.
7. From then on, `dex-loop` works the issues with you: ask, plan, build, review, write back.

It asks before every action, and a yes to one thing is not a yes to the next. It never edits your own files without your yes.

When you step away, your place is kept. An unanswered question is held in the vault; you can answer it later as a comment on its GitHub issue, from your phone, and the next session picks the work back up from your answer. The agent can set itself reminders, and it sends you at most one digest a day.

The file is short because the detail lives in this repo. dex.md clones the parts it needs, at a fixed tag, when a stage needs them. The repo is public, so installing needs no GitHub sign-in; a sign-in is needed only to keep the vault in a private repo and to answer from your phone. See `implement-human.md`.

dex.md is pre-1.0: a working prototype.

## For an LLM

- You read `dex.md` (about 220 lines): an opening for people, then the rules, consent, the sign-in check, the pinned clones and the stage list. Your instructions start at section 1.
- Run `gh auth status` first. If `gh` is missing or not signed in, say so in plain words and carry on locally. Never sign in for the human.
- Clone per stage: Stage 2 clones `dex-md` at a tag; `dexspine-core` only on its own yes; ShadowOS only if wanted. Shallow, pinned, shown first, logged in `RUNLOG.md`.
- Read the `method/` file for each stage before you run it. Do not read `engine/`.
- In a built vault, read late answers first: `vault.mjs inbox`, then `vault.mjs resume`; record each answer with `vault.mjs answer`.
- Spend tokens on the grilling. Placing files is mechanical.
- Write only in `dex-vault/` unless a named exception has a yes. End anything you post on GitHub with `<!-- dex:agent -->`.
- Keep the human's words verbatim. Tag statements `DOCUMENT`, `CITED`, `MODEL` or `UNSURE`. Never write `VERIFIED` yourself.
- See `implement-llm.md` for the steps and `slant-flow.md` for Stage 1.
