---
provenance: AAC
layer: L2
---

# dex.md

**One file that turns your AI coding agent into a working partner: it remembers the project, asks before it acts, and keeps a record you can check.**

Put `dex.md` in a project folder, open Claude Code (or another coding agent) there, and say **"Follow dex.md."** The agent reads the folder, asks what the work is for, and builds a vault of everything it learns, next to the file. From then on every session starts where the last one stopped, and nothing outside the vault changes without your yes.

Version 0.12.0 · pre-1.0 prototype · [AGPL-3.0-or-later](LICENSE) · [What changed](CHANGELOG.md)

## Start

1. Download [`dex.md`](https://raw.githubusercontent.com/Dex-RoboKnix/dex-md/main/dex.md). It is the only file you need.
2. Put it in the folder you want Dex to work in: a project already in motion, or an empty folder.
3. Open your agent in that folder and say: **"Follow dex.md."**

You need Git and Node.js 18 or later. A GitHub sign-in is optional: it lets the vault live in a private repo and lets you answer questions from your phone.

The agent tells you what it can do and writes nothing until you say yes. It fetches the rest of Dex (this repo, at a pinned release) only when a stage needs it, and asks first.

## What you get

| | |
|---|---|
| **A vault** | `dex-vault/`, next to `dex.md`: 114 small notes, one per question, arranged on the DexSpine (six layers from Values down to Pattern). Plain markdown files you can read, diff and keep in git. |
| **The Folio** | `dex-vault/dex-folio.html`: one page that shows what is covered, what is weak and what to do next. Opens offline, on a phone too. |
| **Seven skills** | One loop for every piece of work: `dex-grill` asks you, `dex-spec` writes the plan, `dex-implement` builds it, `dex-review` checks it, `dex-checkpoint` writes it back. `dex-loop` runs a batch of issues through them; `dex-sprint` runs several batches. |
| **A journal** | Your words, kept twice: the original, never edited, and a spelling-checked copy for anything shared. |
| **Issues** | The open work, each with its route (ask you, do it, research it, or spec it), on GitHub or in the vault's own action list. |
| **A story** | The matter retold in a few pages, one chapter added at each checkpoint. |

## Why use it

| Without Dex | With Dex |
|---|---|
| Every session starts from nothing, and decisions drift. | The vault holds the context; every skill ends by writing back what was built, decided and assumed. |
| The agent fills gaps with guesses and answers for you. | It asks you, a few questions at a time, and never answers for you. Every claim is tagged by where it came from; only you verify. |
| A prototype gets built before anyone agreed what was needed. | The goal and what counts as done come first; a five-phase plan is agreed; each phase is reviewed before the next. |
| Files are moved, pushed or posted while you were not looking. | One yes per action. The agent writes only inside the vault; anything else waits for you. |
| An interruption, or a closed session, loses the thread. | The open question is held in the vault and asked again. A new session picks up where the last one stopped. |

## New in 0.12.0: it keeps going when you step away

- **Questions outlive the session.** A question you have not answered yet is a file in the vault, so it travels with the vault repo to any machine.
- **Answer from your phone.** Reply to the question as a comment on its GitHub issue. The next session reads it first, records your words twice and carries on from that question. Comments from anyone else are listed and never acted on.
- **Reminders and schedules.** The agent sets its own follow-ups; a reminder that comes due shows up at the start of the next session. A week away fires a daily reminder once, not seven times.
- **A quiet outbox.** At most one digest a day, holding only what you have not been told yet. Nothing new, nothing sent.

## How a first session goes

1. You say "Follow dex.md." The agent says what it can do, whether it is signed in to GitHub, and writes nothing yet.
2. It reads the folder and tells you what the matter seems to be.
3. It asks what you have seen happen, then why, one step at a time, until it can state what the work is for in one line (the **slant**). You confirm or correct it.
4. On your yes it builds the vault, then asks about whatever is weak or missing.
5. It hands back: what was done, what was skipped, and the first issues to work.
6. From then on `dex-loop` works the issues with you, one batch at a time.

## Is it for you?

It is for founders and small teams building with an AI agent, people with a project already in motion (notes, half-finished code, chat exports), domain experts who are not engineers, and anyone who needs a record of who decided what.

It is not an autopilot: it stops for your yes. It is not a swarm of agents: one agent does the work. It is not professional advice: in legal, medical or financial matters it maps and describes, and points you to an adviser.

## DEX838: the line every instruction carries

Every note, held question, late answer and reminder in the vault opens with one line of DEX838, and the engine checks it before acting on it. A line that does not parse is not acted on; it waits for you.

```
dex(dex-loop, @issue:115,held:dex-loop-115)["Which phase first? dex(prove the whole cycle) dex[record the answer twice]"]
```
Readable: the scope (`dex-loop`, what may be touched), what is known (`issue:115`, the held question), and the instruction: the intent in `dex(...)` and the musts in `dex[...]`.

DEX838 and the DexSpine are defined in [dexspine-core](https://github.com/Dex-RoboKnix/dexspine-core).

## Which document do I read?

| You are | Read |
|---|---|
| A person who wants to use Dex | This page, then put `dex.md` in a folder and say "Follow dex.md." |
| A person who wants to know how it works | [`docs/`](docs/README.md): explainers, a worked example and the install steps |
| An agent running dex.md | `dex.md`, then the `method/` file each stage names. Do not read `engine/` |
| An agent or person working on this repo | [`START.md`](START.md), then `CLAUDE.md` |

## What is in this repo

This repo holds everything `dex.md` fetches. **What dex.md uses it for:** at Stage 2 dex.md clones this repo at a pinned tag into `dex-vault/.dex/dex-md/` and installs the engine and skills from it.

| Path | What it is | When dex.md uses it |
|---|---|---|
| `dex.md` | The one file people download: the rules, the consent steps and the stage list | Always |
| `method/` | What each stage does, in detail | The agent reads the file each stage names |
| `engine/` | The vault tool (`vault.mjs`), over 100 small tested modules (`dex-lib.mjs`), the Folio builders and template, `install.mjs` | Installed into `dex-vault/.dex/` at Stage 2 |
| `engine/build/` | Module sources, tests and the tools that build `engine/` | Not used during a run |
| `skills/` | The seven dex skills | Placed in `.claude/skills/` at Stage 4b, on your yes |
| `templates/` | The CLAUDE.md block and the promote-issue template | Installed at Stage 2; the CLAUDE.md block is placed at Stage 4b, on your yes |
| `docs/` | Explainers for people | Not read during a run |

## How it fits together

Dex is built in layers. **L1** defines the standard; **L2** products follow it.

| Repo | Layer | What dex.md takes from it |
|---|---|---|
| [dex-md](https://github.com/Dex-RoboKnix/dex-md) (this repo) | L2, the way in | The method, engine and skills, at the tag in dex.md section 3 |
| [dexspine-core](https://github.com/Dex-RoboKnix/dexspine-core) | L1, the standard | The DexSpine base questions (an optional clone at a pinned commit) and the DEX838 parser, built into the engine |
| [dexfolio](https://github.com/Dex-RoboKnix/dexfolio) | L2, parked | Nothing: the Folio dex.md builds is DexFolio, and its builders and template ship from this repo's `engine/`. dexfolio holds v0.1.0, where it started |
| shadowos | L2, private for now | An optional desktop for the vault (Stage 6b) |

## Working on this repo

```sh
npm test                          # every module and tool test
npm run testdrive -- <empty dir>  # follow dex.md end to end in a sandbox, against the tag dex.md pins
npm run scan                      # sensitive-data check; run before every push
```

Releases are tags (`vX.Y.Z`). dex.md pins one; a new release is a new tag and a new dex.md, and an older dex.md keeps working against its own tag. Steps: [`START.md`](START.md).

## Licence

AGPL-3.0-or-later, the open Core edition. No Enterprise edition exists.
