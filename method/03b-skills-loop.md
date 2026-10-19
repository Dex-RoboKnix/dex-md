---
provenance: AAC
source: dex.md 0.9 section 3b
---

## 3b. The dex skills loop

After the vault is built, the work runs as a loop of five skills, installed in Stage 4b. Each one is a prototype: it is corrected after it has been run on a real project.

```
dex-grill -> dex-spec -> dex-implement -> dex-review -> (dex-spec -> dex-implement -> dex-review) until the outcome is met
every skill ends with: dex-checkpoint
```

| Skill | Does | Who |
|---|---|---|
| `dex-grill` | grills the human, one ticket or node at a time, up to 3 independent questions per popup, the human's words kept twice | the vault agent; a research agent only for up-to-date outside information |
| `dex-spec` | turns settled grill answers into a spec of 5 phases of tracer bullets. The spec is a DRAFT; it is **finalised late**, after the first slice has taught what the draft got wrong, and only after a `dex-review` PASS | the vault agent |
| `dex-implement` | builds one phase at a time against the FINAL spec. A builder never edits a FINAL spec: a disagreement becomes a dispute note | the vault agent |
| `dex-review` | checks the build against the spec: acceptance coverage, drift, tests that really test what they are named for, and devops checks | the vault agent, which says it built what it reviews; the human's verdict is the independent check |
| `dex-checkpoint` | the judgement half of a checkpoint (the verbatim journal and the node proposals for the human's yes); `vault.mjs checkpoint` does the mechanics | the vault agent |

**The pace is the human's choice** (asked at the start of `dex-implement`): **one phase at a time** (build, gate and review a phase, checkpoint, then the next; the default) or **all phases, one review** (every phase built and gated, then one review of the whole diff). One phase at a time catches a mistake before it is repeated; all phases finishes sooner. Offer it once a first phase has passed a review, or when the work is well understood.

**Limits (rule 20).** One vault agent does the work. A task gets **2 attempts**; after the second failed review round the human decides: park it, change the spec, or try a stronger model. A retry must carry a new change, otherwise it is refused and not counted. **Research agents** are the only subagents: started when an answer needs up-to-date information that is not in memory or the vault (a web search, scraping a site). Each one hands over in flight; the vault agent turns that text into an HTML page for the human and checks every claim in it before using it.

**Every finding is checked before it is acted on.** Reviewers (people or models) are advisory. A claim in a review is verified against the text before anything changes.

### Step 2: keeping the work going

The loop is step 2 of dex.md. Two skills run it: `dex-loop` works one batch of issues through the skills above, and `dex-sprint` runs several batches at once, gathering their questions into one popup per round (at most four).

1. **Working doesn't mean changing.** Reading, mapping, drafting and suggesting run freely. Each change (a file outside the working area, an issue comment or close, a commit, a push, a deploy) needs the human's yes to that change.
2. **Next actions.** When an issue closes, offer up to three next actions in one popup, the recommended one first: the next issue in the batch, a follow-up the work surfaced, or "stop here". Nothing starts before the human picks.
3. **When the slant is achieved.** A slant is achieved when every loop under it has met its success criteria (P05) and the human agrees. Until then, step 2 keeps going.
4. **Tool work is kept apart from project work.** During a project run, an idea for dex.md itself is filed as an issue, and the project keeps using dex.md at its pinned version. Changes to dex.md are made between runs and tagged.
