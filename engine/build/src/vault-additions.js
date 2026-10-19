// ---- Dex additions: bundled modules, classify and checkpoint ---------------------------------------
// The modules in dex-lib.mjs are pure: they return what must be written; this tool does the writing.
const DEX_VERSION = '0.9';
async function lib() {
  const f = path.join(HERE, 'dex-lib.mjs');
  if (!fs.existsSync(f)) die('dex-lib.mjs is missing next to vault.mjs. Run the installer again (dex.md section 3).');
  return import(pathToFileURL(f).href);
}
async function modulesCmd() {
  const L = await lib();
  for (const n of L.modules()) { const i = L.info(n); console.log(`${n}  [${i.node}]  ${i.input}`); }
}
function jsonInput(a) {
  try {
    if (typeof a.input === 'string') return JSON.parse(fs.readFileSync(a.input, 'utf8'));
    if (typeof a.json === 'string') return JSON.parse(a.json);
  } catch (e) { die(`The input is not valid JSON: ${e.message}`); }
  return undefined;
}
async function runCmd(a) {
  const name = a._[1];
  if (!name) die('Usage: node dex-vault/.dex/vault.mjs run <module> --json \'{...}\' | --input file.json   (modules: see the "modules" command)');
  const L = await lib();
  const r = L.run(name, jsonInput(a));
  console.log(JSON.stringify(r, null, 2));
  if (!r.ok) process.exitCode = 1;
}
// List the top level of a folder and classify it: blank, blank-with-context or in-flight. Reads names only, never file contents.
async function classifyCmd(a) {
  const dir = path.resolve(a._[1] || ROOT);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) die(`Not a folder: ${dir}`);
  const files = fs.readdirSync(dir, { withFileTypes: true }).map((e) => (e.isDirectory() ? e.name + '/' : e.name));
  const L = await lib();
  const c = L.run('p2/folder-classify', { files });
  const secrets = L.run('p2/secret-detect', { files });
  console.log(JSON.stringify({ folder: dir, entries: files.length, classification: c, secrets }, null, 2));
  if (!c.ok) process.exitCode = 1;
}

// checkpoint: the mechanics that close every dex skill. It never applies a node change: those need the human's yes.
async function checkpointCmd(a) {
  const L = await lib();
  const now = typeof a.now === 'string' ? a.now : new Date().toISOString();
  const date = now.slice(0, 10);
  const summary = (typeof a.summary === 'string' ? a.summary : 'checkpoint').replace(/\s*\n\s*/g, ' ');
  const skill = typeof a.skill === 'string' ? a.skill : 'manual';

  // 1. fold the node folders into the flat layer files and log state changes since the last checkpoint
  fold({ checkpoint: true });

  // 2. coverage per question: covered 1, weak half, not observable and unsure 0, not applicable leaves the denominator
  const counts = { C: 0, W: 0, N: 0, NA: 0, U: 0 };
  for (const nd of nodes()) {
    const s = (readNode(nd).fields.state || 'N').toUpperCase();
    counts[s in counts ? s : 'N']++;
  }
  const total = counts.C + counts.W + counts.N + counts.U;
  let coverage = null, mode = null;
  if (total > 0) {
    const cov = L.run('p1/coverage-score', { answered: counts.C, weak: counts.W, total, now });
    if (cov.ok) {
      coverage = cov.percentage;
      const th = L.run('p1/coverage-threshold', { coverage });
      mode = th.ok ? th.mode : null;
    }
  }

  // 3. RUNLOG: next run number from the existing rows, one row per checkpoint
  const runlog = path.join(VAULT, 'RUNLOG.md');
  if (!fs.existsSync(runlog)) fs.writeFileSync(runlog, '---\ntype: runlog\n---\n# Run log\n\n| Run | Date | Mode | Version | Summary |\n|---|---|---|---|---|\n');
  const rl = fs.readFileSync(runlog, 'utf8');
  const existing = [...rl.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((m) => Number(m[1]));
  const alloc = L.run('p1/id-allocator', { existingIds: existing, now });
  const runNumber = alloc.ok ? alloc.nextId : existing.length + 1;
  const text = `${skill}: ${summary}${coverage === null ? '' : `; coverage ${coverage}%`}`;
  const row = L.run('p1/runlog-row', { runNumber, date, mode: 'checkpoint', version: DEX_VERSION, summary: text, now });
  if (!row.ok) die(`RUNLOG row refused: ${row.error}`);
  fs.appendFileSync(runlog, `${rl.endsWith('\n') ? '' : '\n'}| ${runNumber} | ${date} | checkpoint | ${DEX_VERSION} | ${text.replace(/\|/g, '\\|')} |\n`);

  // 4. story: one dated chapter per checkpoint date, never rewriting an earlier one (only when a story file exists)
  const story = path.join(VAULT, '08_story.md');
  let storyNote = 'no 08_story.md yet (written in the story stage)';
  if (fs.existsSync(story)) {
    const st = fs.readFileSync(story, 'utf8');
    const existingChapters = [...st.matchAll(/^### (\d{4}-\d{2}-\d{2})\s*$/gm)].map((m) => ({ date: m[1], text: '' }));
    const chapterText = typeof a.chapter === 'string' ? a.chapter : `Checkpoint after ${skill}: ${summary}. Coverage ${coverage === null ? 'not yet measurable' : coverage + '%'}.`;
    const ch = existingChapters.some((c) => c.date === date) ? { ok: false, error: 'a chapter for ' + date + ' already exists; chapters are never rewritten or duplicated' } : L.run('p1/story-chapter', { action: 'append', chapterText, date, existingChapters });
    if (ch.ok) { fs.appendFileSync(story, `${st.endsWith('\n') ? '' : '\n'}\n${ch.formattedEntry}\n`); storyNote = `chapter ${date} appended`; }
    else storyNote = `story chapter not added: ${ch.error}`;
  }

  console.log(`Checkpoint ${runNumber}: ${counts.C} covered, ${counts.W} weak, ${counts.N} not observable, ${counts.U} unsure, ${counts.NA} not applicable.`);
  console.log(`Coverage: ${coverage === null ? 'not measurable yet' : coverage + '%'}${mode ? ` (mode: ${mode}; the bar is 90%)` : ''}.`);
  console.log(`RUNLOG row ${runNumber} written. Story: ${storyNote}.`);
  console.log('Not done here, on purpose: node changes (they need the human yes), the journal (write it verbatim with place or the journal notes), and the Folio. Rebuild the Folio next, then the vault check below runs.');

  // 5. the vault check last: it exits 1 on a problem
  check();
}
// Hold a skill's place so a later session can come back to the same question (dex-loop 4b).
// park writes dex-vault/.dex/state/<skill>.json; resume prints what is held. The state folder is gitignored.
const STATE = path.join(HERE, 'state');
function parkCmd(a) {
  const skill = typeof a.skill === 'string' ? a.skill : '';
  const question = typeof a.question === 'string' ? a.question : '';
  if (!skill || !question) die('Usage: node dex-vault/.dex/vault.mjs park --skill <name> --question "<text>" [--issue <n>] [--thought "<text>"]');
  if (!/^[a-z0-9-]+$/.test(skill)) die(`Skill names are lowercase letters, digits and dashes: ${skill}`);
  fs.mkdirSync(STATE, { recursive: true });
  const held = { skill, issue: typeof a.issue === 'string' ? a.issue : null, question, thought: typeof a.thought === 'string' ? a.thought : null, parked: typeof a.now === 'string' ? a.now : new Date().toISOString() };
  fs.writeFileSync(path.join(STATE, `${skill}.json`), JSON.stringify(held, null, 2) + '\n');
  console.log(`Parked ${skill}${held.issue ? ` #${held.issue}` : ''}: ${question}`);
}
function resumeCmd(a) {
  const files = fs.existsSync(STATE) ? fs.readdirSync(STATE).filter((f) => f.endsWith('.json')) : [];
  const want = typeof a.skill === 'string' ? `${a.skill}.json` : null;
  const pick = want ? files.filter((f) => f === want) : files;
  if (!pick.length) { console.log('nothing held'); return; }
  for (const f of pick.sort()) {
    let h;
    try { h = JSON.parse(fs.readFileSync(path.join(STATE, f), 'utf8')); } catch {
      console.error(`Cannot read the held place in state/${f}: it is not valid JSON. Park again to replace it.`);
      process.exitCode = 1;
      continue;
    }
    console.log(`Held: ${h.skill}${h.issue ? ` #${h.issue}` : ''} (parked ${h.parked})`);
    console.log(`  Question: ${h.question}`);
    if (h.thought) console.log(`  Thought: ${h.thought}`);
  }
}
