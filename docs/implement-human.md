---
provenance: AAC
---

# Install Dex: steps for a person

You need: a computer with Node 18 or later, `git`, and an agent that can read and write files (such as Claude Code).

1. **Optional: the GitHub CLI.** Only needed if you want the work kept in a private GitHub repo. Get it from https://cli.github.com.
2. **Optional: sign in.** Run `gh auth login` and follow the prompts. Check with `gh auth status`.
3. **Access.** The `Dex-RoboKnix/dex-md` repo is public: nothing to ask for.
4. **Pick a folder.** It can be empty, hold a few notes, or be a live project. Dex does not mind which.
5. **Copy `dex.md` into it.**
6. **Tell your agent:** `Read dex.md and follow it.`
7. **Answer the questions.** Your agent will:
   - Stage 1: look at the folder and ask why you want the work done (the why-ladder).
   - Stage 2: ask before it creates `dex-vault/`, clones the repo and installs the engine.
   - Stage 3: ask you, item by item, what to keep from older versions or other systems and where it goes, then grill you one question at a time.
   - Stage 4: build the vault, then ask before placing Claude project files and skills.
   - Stages 5 and 6: write the story and build the folio.
   - Stage 6b: ShadowOS, only if you want it.
   - Stages 7 and 8: hand back, and file issues for work that changes your files.
8. **Say no whenever you like.** Each action needs its own yes. Your veto wins.

Before pushing anything, check it holds nothing personal. Dex never changes a repo's visibility.

Later runs update the vault. See `method/06-update-mode.md`.
