// ---- Dex additions: bundled modules, classify and checkpoint ---------------------------------------
// The modules in dex-lib.mjs are pure: they return what must be written; this tool does the writing.
const DEX_VERSION = '__DEX_VERSION__'; // set from package.json by make-vault.mjs
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

  // 1. fold the node folders into the flat layer files and log state changes since the last checkpoint.
  // Edited against moved: coverage only moves when a node's state moves, so say when edits moved nothing.
  const lastCheckpoint = fs.existsSync(STATES) ? fs.statSync(STATES).mtimeMs : null;
  const statesBefore = lastCheckpoint === null ? null : JSON.parse(fs.readFileSync(STATES, 'utf8'));
  const edited = lastCheckpoint === null ? 0 : nodes().filter((nd) => { const f = path.join(nodeDir(nd), 'contextual.md'); return fs.existsSync(f) && fs.statSync(f).mtimeMs > lastCheckpoint; }).length;
  fold({ checkpoint: true });
  const statesAfter = JSON.parse(fs.readFileSync(STATES, 'utf8'));
  const movedCount = statesBefore ? Object.keys(statesAfter).filter((k) => statesBefore[k] !== undefined && statesBefore[k] !== statesAfter[k]).length : 0;

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
  if (lastCheckpoint !== null) {
    console.log(`${edited} node(s) edited since the last checkpoint, ${movedCount} changed state.${edited > 0 && movedCount === 0 ? ' Coverage only moves when a state moves: propose the state changes these edits earn, for the human\'s yes.' : ''}`);
  }
  console.log('Not done here, on purpose: node changes (they need the human yes), the journal (write it verbatim with place or the journal notes), and the Folio. Rebuild the Folio next, then the vault check below runs.');

  // 5. the meaning check (never fails a checkpoint), then the shape check last: it exits 1 on a problem
  printAudit(auditFindings(), { brief: true });
  check();
}
// Hold a question so a later session, on any machine, can come back to it (rule 22, dex-loop 4b).
// park writes dex-vault/07_inbox/held/<skill>[-<issue>].md: front matter and one DEX838 line, checked in strict mode
// by the engine's parser module before it is written. The file is tracked with the vault, so a held question leaves
// the machine. Parking again for the same skill and issue replaces it. resume lists what is held and checks each line;
// a line that does not parse waits for the owner and is never acted on.
// A held place from before 0.12 (dex-vault/.dex/state/<skill>.json) is moved into held/ the first time park or resume runs.
const STATE = path.join(HERE, 'state');
const HELD = path.join(VAULT, '07_inbox', 'held');
const DEX838 = 'p6/dex838-parse';
const heldId = (skill, issue) => (issue ? `${skill}-${issue}` : skill);
function heldWire(h) {
  const ctx = [h.issue ? `issue:${h.issue}` : null, `held:${h.id}`, h.repo ? `repo:${h.repo}` : null].filter(Boolean).join(',');
  return `dex(${h.skill}, @${ctx})["${h.question}"]`;
}
function heldText(h) {
  const fm = ['---', `id: ${h.id}`, `skill: ${h.skill}`, h.issue ? `issue: ${h.issue}` : null, h.repo ? `repo: ${h.repo}` : null, `parked: ${h.parked}`, 'status: held', '---'].filter((l) => l !== null);
  const readable = `Readable: ${h.skill} holds this question${h.issue ? ` for #${h.issue}` : ''}; \`vault.mjs resume\` lists it.`;
  return [...fm, heldWire(h), '', readable, ...(h.thought ? ['', `Thought: ${h.thought}`] : []), ''].join('\n');
}
function readHeld(file) {
  const t = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n/.exec(t);
  if (!m) return null;
  const fm = {};
  for (const l of m[1].split('\n')) { const i = l.indexOf(': '); if (i > 0) fm[l.slice(0, i)] = l.slice(i + 2); }
  const body = t.slice(m[0].length);
  const wire = (/^dex\(.*$/m.exec(body) || [])[0] || '';
  const thought = (/^Thought: (.*)$/m.exec(body) || [])[1] || null;
  return { ...fm, wire, thought };
}
// Older held places (.dex/state/<skill>.json) move into held/ once. An unreadable one is reported and left where it is.
async function migrateState(L) {
  if (!fs.existsSync(STATE)) return;
  for (const f of fs.readdirSync(STATE).filter((x) => x.endsWith('.json')).sort()) {
    let h;
    try { h = JSON.parse(fs.readFileSync(path.join(STATE, f), 'utf8')); } catch {
      console.error(`Cannot read the held place in state/${f}: it is not valid JSON. Park again to replace it.`);
      process.exitCode = 1;
      continue;
    }
    if (!h || typeof h.skill !== 'string' || typeof h.question !== 'string' || !/^[a-z0-9-]+$/.test(h.skill)) continue;
    const issue = typeof h.issue === 'string' && /^\d+$/.test(h.issue) ? h.issue : null;
    const held = { id: heldId(h.skill, issue), skill: h.skill, issue, repo: null, question: h.question.replace(/\s+/g, ' ').trim(), thought: typeof h.thought === 'string' ? h.thought.replace(/\s+/g, ' ').trim() : null, parked: typeof h.parked === 'string' ? h.parked : new Date().toISOString() };
    if (!L.run(DEX838, { line: heldWire(held) }).ok) { console.error(`The held place in state/${f} cannot become a DEX838 line; it is left where it is.`); process.exitCode = 1; continue; }
    fs.mkdirSync(HELD, { recursive: true });
    const dest = path.join(HELD, `${held.id}.md`);
    if (!fs.existsSync(dest)) fs.writeFileSync(dest, heldText(held));
    fs.rmSync(path.join(STATE, f));
    console.log(`Moved the held question for ${held.skill} from .dex/state/ into 07_inbox/held/.`);
  }
}
async function parkCmd(a) {
  const skill = typeof a.skill === 'string' ? a.skill : '';
  const question = typeof a.question === 'string' ? a.question.replace(/\s+/g, ' ').trim() : '';
  if (!skill || !question) die('Usage: node dex-vault/.dex/vault.mjs park --skill <name> --question "<text>" [--issue <n>] [--repo <owner/name>] [--thought "<text>"]');
  if (!/^[a-z0-9-]+$/.test(skill)) die(`Skill names are lowercase letters, digits and dashes: ${skill}`);
  const issue = typeof a.issue === 'string' ? a.issue.replace(/^#/, '') : null;
  if (issue !== null && !/^\d+$/.test(issue)) die(`An issue is a number: ${a.issue}`);
  const repo = typeof a.repo === 'string' ? a.repo : null;
  if (repo !== null && !/^[\w.-]+\/[\w.-]+$/.test(repo)) die(`A repo is written owner/name: ${repo}`);
  const L = await lib();
  await migrateState(L);
  const held = { id: heldId(skill, issue), skill, issue, repo, question, thought: typeof a.thought === 'string' ? a.thought.replace(/\s+/g, ' ').trim() : null, parked: typeof a.now === 'string' ? a.now : new Date().toISOString() };
  const checked = L.run(DEX838, { line: heldWire(held) });
  if (!checked.ok) die(`The question cannot be held as a DEX838 line (${checked.error}). Reword it without "dex(" or "dex[".`);
  fs.mkdirSync(HELD, { recursive: true });
  fs.writeFileSync(path.join(HELD, `${held.id}.md`), heldText(held));
  console.log(`Parked ${skill}${issue ? ` #${issue}` : ''} in 07_inbox/held/${held.id}.md: ${question}`);
}
async function resumeCmd(a) {
  const L = await lib();
  await migrateState(L);
  const files = fs.existsSync(HELD) ? fs.readdirSync(HELD).filter((f) => f.endsWith('.md')) : [];
  const held = [];
  for (const f of files) {
    const h = readHeld(path.join(HELD, f));
    if (!h) { console.error(`Cannot read 07_inbox/held/${f}: it has no front matter. It waits for the owner and is not acted on.`); process.exitCode = 1; continue; }
    if ((h.status || 'held') !== 'held') continue;
    if (typeof a.skill === 'string' && h.skill !== a.skill) continue;
    held.push({ ...h, file: f });
  }
  if (!held.length) { if (!process.exitCode) console.log('nothing held'); return; }
  held.sort((x, y) => String(x.parked).localeCompare(String(y.parked)) || x.file.localeCompare(y.file));
  for (const h of held) {
    const r = L.run(DEX838, { line: h.wire });
    if (!r.ok) {
      console.log(`Waiting for the owner: 07_inbox/held/${h.file}: its DEX838 line does not parse (${r.error}). Not acted on.`);
      process.exitCode = 1;
      continue;
    }
    console.log(`Held: ${h.skill}${h.issue ? ` #${h.issue}` : ''} (parked ${h.parked})`);
    console.log(`  Question: ${r.parsed.subject}`);
    if (h.thought) console.log(`  Thought: ${h.thought}`);
  }
}

// ---- inbox: a late answer arrives ---------------------------------------------------------------
// The owner answers a held question as a comment on its issue, from any device. inbox reads those comments with the
// GitHub CLI and writes each new one as 07_inbox/events/<comment-id>.md: front matter, one DEX838 line checked in strict
// mode, and the comment verbatim, status pending. The comment id is the key, so a second pull adds nothing. Only the
// signed-in account's comments count; comments from other accounts are listed in one line and never acted on, and a
// comment the agent posted carries <!-- dex:agent --> and is skipped. One worker at a time: a lock in .dex/state/.
// No gh, or not signed in: one plain line, exit 0, nothing written. --dry-run lists what would be added and writes nothing.
// DEX_GH names the GitHub CLI to run (default gh); a path ending .mjs runs with node, which is how the tests stub GitHub.
const EVENTS = path.join(VAULT, '07_inbox', 'events');
const LOCK = path.join(STATE, 'inbox.lock');
const LOCK_STALE_MS = 15 * 60 * 1000;
function gh(argv) {
  const bin = process.env.DEX_GH || 'gh';
  const [cmd, list] = /\.mjs$/i.test(bin) ? [process.execPath, [bin, ...argv]] : [bin, argv];
  return spawnSync(cmd, list, { cwd: ROOT, encoding: 'utf8', timeout: 60000, windowsHide: true });
}
const firstLine = (s) => String(s || '').trim().split(/\r?\n/)[0].slice(0, 160);
function pidAlive(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } }
// Take the lock, or say who holds it. A lock whose process has gone, or older than 15 minutes, is cleared with a note.
function takeLock() {
  fs.mkdirSync(STATE, { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      fs.writeFileSync(LOCK, JSON.stringify({ pid: process.pid, started: new Date().toISOString() }), { flag: 'wx' });
      return true;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
    }
    let held = null;
    try { held = JSON.parse(fs.readFileSync(LOCK, 'utf8')); } catch { /* unreadable: treated as stale */ }
    const since = held && typeof held.started === 'string' ? Date.parse(held.started) : NaN;
    if (held && Number.isInteger(held.pid) && pidAlive(held.pid) && Date.now() - since < LOCK_STALE_MS) {
      console.log(`Inbox: another run holds the lock (process ${held.pid}, since ${held.started}). Stopped; nothing written.`);
      return false;
    }
    fs.rmSync(LOCK, { force: true });
    console.log(`Inbox: cleared a stale lock${held && held.pid ? ` (process ${held.pid}, since ${held.started})` : ''}.`);
  }
  console.log('Inbox: could not take the lock. Stopped; nothing written.');
  return false;
}
async function inboxCmd(a) {
  const L = await lib();
  const dry = !!a['dry-run'];
  const listHeld = () => (fs.existsSync(HELD) ? fs.readdirSync(HELD).filter((f) => f.endsWith('.md')).sort() : [])
    .map((f) => ({ ...readHeld(path.join(HELD, f)), file: f })).filter((h) => h.id && (h.status || 'held') === 'held' && /^\d+$/.test(h.issue || ''));
  const hasState = fs.existsSync(STATE) && fs.readdirSync(STATE).some((f) => f.endsWith('.json'));
  if (!listHeld().length && !hasState) { console.log('Inbox: no held question names an issue, so no late answer can arrive. Nothing read.'); return; }
  const who = gh(['api', 'user', '--jq', '.login']);
  if (who.error && who.error.code === 'ENOENT') { console.log('Inbox: the GitHub CLI (gh) is not installed here, so late answers were not read. Nothing written.'); return; }
  const login = !who.error && who.status === 0 ? who.stdout.trim() : '';
  if (!login) { console.log('Inbox: gh is not signed in, or GitHub could not be reached (gh auth status), so late answers were not read. Nothing written.'); return; }
  if (!dry) await migrateState(L);
  // A held line that does not parse waits for the owner and is not acted on, here as in resume.
  const held = listHeld().filter((h) => {
    const r = L.run(DEX838, { line: h.wire });
    if (!r.ok) console.log(`Waiting for the owner: 07_inbox/held/${h.file}: its DEX838 line does not parse (${r.error}). Its comments are not read.`);
    return r.ok;
  });
  if (!held.length) { console.log('Inbox: no held question can be read. Nothing written.'); return; }
  let fallbackRepo = null;
  if (held.some((h) => !h.repo)) {
    const r = gh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
    if (r.status === 0 && /^[\w.-]+\/[\w.-]+$/.test(r.stdout.trim())) fallbackRepo = r.stdout.trim();
  }
  const groups = new Map();
  let noRepo = 0;
  for (const h of held) {
    const repo = h.repo || fallbackRepo;
    if (!repo) { noRepo++; continue; }
    const k = `${repo}#${h.issue}`;
    if (!groups.has(k)) groups.set(k, { repo, issue: h.issue, held: [] });
    groups.get(k).held.push({ id: h.id, skill: h.skill, issue: h.issue, parked: h.parked });
  }
  if (noRepo) console.log(`Inbox: ${noRepo} held question(s) name no repo and this folder has no GitHub remote: park them again with --repo <owner/name>.`);
  if (!dry && !takeLock()) return;
  let added = 0;
  try {
    const known = fs.existsSync(EVENTS) ? fs.readdirSync(EVENTS).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)) : [];
    const received = new Date().toISOString();
    for (const g of groups.values()) {
      const where = `#${g.issue} (${g.repo})`;
      const r = gh(['issue', 'view', g.issue, '-R', g.repo, '--json', 'comments']);
      let data = null;
      if (r.status === 0) { try { data = JSON.parse(r.stdout); } catch { /* reported below */ } }
      if (!data || !Array.isArray(data.comments)) { console.log(`Inbox: ${where}: its comments could not be read (${firstLine(r.stderr) || 'no JSON from gh'}). Skipped.`); continue; }
      const comments = data.comments.map((c) => ({ id: c && c.id, url: c && c.url, author: c && c.author && c.author.login, body: c && c.body, createdAt: c && c.createdAt }));
      const res = L.run('p6/inbox-events', { held: g.held, comments, login, repo: g.repo, known, received });
      if (!res.ok) { console.log(`Inbox: ${where}: ${res.error}. Skipped.`); process.exitCode = 1; continue; }
      for (const ev of res.events) {
        const p = L.run(DEX838, { line: ev.line });
        if (!p.ok) { console.log(`Inbox: ${where}: comment ${ev.id} cannot become a DEX838 line (${p.error}); it waits for the owner and is not written.`); continue; }
        if (dry) { console.log(`Would add 07_inbox/events/${ev.file}: ${where} answers ${ev.resumes}: ${p.parsed.subject}`); continue; }
        fs.mkdirSync(EVENTS, { recursive: true });
        try { fs.writeFileSync(path.join(EVENTS, ev.file), ev.text, { flag: 'wx' }); } catch (e) { if (e.code === 'EEXIST') continue; throw e; }
        known.push(ev.id);
        added++;
        console.log(`New event 07_inbox/events/${ev.file}: ${where} answers ${ev.resumes}: ${p.parsed.subject}`);
      }
      const s = res.skipped;
      if (s.othersCount) console.log(`Inbox: ${where}: ${s.othersCount} comment(s) by other accounts (${s.others.join(', ')}): listed, never acted on.`);
      if (s.agent) console.log(`Inbox: ${where}: ${s.agent} comment(s) the agent posted (marked <!-- dex:agent -->): skipped.`);
      if (s.unreadable) console.log(`Inbox: ${where}: ${s.unreadable} comment(s) could not be read: skipped.`);
    }
  } finally {
    if (!dry) fs.rmSync(LOCK, { force: true });
  }
  console.log(dry ? 'Inbox: dry run; nothing written.' : `Inbox: ${added} new event(s) in 07_inbox/events/.`);
}

// ---- scaffold backfill: sections a newer version added to the node template ----------------------
// An existing node keeps every line it has. Only a missing "## Needs" or "## Wants" section is added, before the agent reading.
function backfillSections(file) {
  const text = fs.readFileSync(file, 'utf8');
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const has = (h) => new RegExp(`^## ${h}\\s*$`, 'm').test(text);
  if (has('Needs') && has('Wants')) return false;
  const add = [has('Needs') ? null : `## Needs${eol}-${eol}`, has('Wants') ? null : `## Wants${eol}-${eol}`].filter(Boolean).join(eol) + eol;
  const at = text.search(/^## Agent reading\s*$/m);
  fs.writeFileSync(file, at < 0 ? `${text}${text.endsWith(eol) ? '' : eol}${eol}${add}` : `${text.slice(0, at)}${add}${text.slice(at)}`);
  return true;
}

// ---- audit: the meaning check. check tests the shape (folders, headings, sources); audit reads what is in them ----------
// Read-only. Exit 0 unless --strict. Each finding is a proposal for the human, never applied here.
const ROUTES = ['dex-grill', 'task', 'research', 'dex-spec'];
const STATUSES = ['proposed', 'open', 'doing', 'done', 'parked', 'dropped'];
const GENERIC = /^(strengthen( this node)?|tbd|todo|to do|fill (this|it) in|review|check|more detail|-+)\s*\.?$/i;
const clip = (s, n = 60) => { const t = String(s).replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const readText = (p) => fs.readFileSync(p, 'utf8');
function auditFindings() {
  const out = [];
  const add = (kind, where, text) => out.push({ kind, where, text });
  // 1. entry points: the files an agent reads first must match this version
  const idx = path.join(VAULT, '00_index.md');
  if (fs.existsSync(idx)) {
    const v = parseFront(readText(idx)).fields.dex_version;
    if (!v) add('entry', '00_index.md', `no dex_version (this tool is ${DEX_VERSION})`);
    else if (v !== DEX_VERSION) add('entry', '00_index.md', `dex_version is ${v}; this tool is ${DEX_VERSION}: run the upgrade (02b section 0)`);
  }
  const handoff = path.join(VAULT, 'HANDOFF.md');
  if (fs.existsSync(handoff) && /(^|[^-\w])mof\//m.test(readText(handoff))) add('entry', 'HANDOFF.md', 'still points at mof/: rewrite it from the template with dex-vault/ paths');
  // 2. nodes: route, action, sections, size; answers grouped by layer and phase for the fit check
  const groups = {};
  let verifiedNodes = 0, total = 0;
  for (const nd of nodes()) {
    const file = path.join(nodeDir(nd), 'contextual.md');
    if (!fs.existsSync(file)) continue;
    total++;
    const raw = readText(file);
    const { fields, body } = parseFront(raw);
    const sec = sections(body);
    const state = String(fields.state || 'N').toUpperCase();
    const next = String(fields.next || '-').trim();
    if (fields.verified && !/^(no|-|)$/i.test(fields.verified)) verifiedNodes++;
    if (next && next !== '-') {
      const m = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(next);
      if (!m) add('route', nd.id, `Next has no route: "${clip(next)}"`);
      else if (/^SK-/i.test(m[1])) add('older', nd.id, `Next names ${m[1]}, from the older skill library: convert it to a route (${ROUTES.join(', ')})`);
      else if (!ROUTES.includes(m[1])) add('route', nd.id, `Next names an unknown route "${m[1]}" (routes: ${ROUTES.join(', ')})`);
      if (m && GENERIC.test(m[2].trim())) add('generic', nd.id, `Next is generic ("${clip(m[2])}"): name one specific question or action`);
    } else if ((state === 'W' || state === 'N') && nd.key !== 'llm') { // llm is the agent's own reading, filled in Stage 4
      const acts = [sec['defined actions'], sec['undefined actions']].filter((s) => s && s !== '-');
      if (!acts.length) add('no-action', nd.id, `state ${state} with no Next and no action: what one question or action would cover it?`);
    }
    for (const k of ['open questions', 'defined actions', 'undefined actions']) if (sec[k] && /strengthen this node/i.test(sec[k])) add('generic', nd.id, `"${k}" says "strengthen this node", which no one can act on`);
    if (!('needs' in sec) || !('wants' in sec)) add('sections', nd.id, 'no ## Needs or ## Wants section: run scaffold, which adds them and changes nothing else');
    const kb = Buffer.byteLength(raw) / 1024;
    if (kb > 8) add('fit', nd.id, `${Math.round(kb)} KB: a catch-all? Keep what answers this node's question; move the rest to the node that asks for it`);
    // a short, name-like label (a party, a role, a thing), not a sentence opener such as "Outcome wanted, in the owner's words:"
    const lab = /^([A-Z][\w'’-]*(?: [\w'’-]+){0,2}):\s/.exec(String(sec.answer || '').trim());
    const label = lab && !nd.title.toLowerCase().startsWith(lab[1].trim().toLowerCase()) ? lab[1].trim() : null;
    (groups[`L${nd.layer} ${nd.phase}`] ||= []).push({ id: nd.id, label });
  }
  for (const [g, list] of Object.entries(groups)) {
    const by = {};
    for (const x of list) if (x.label) (by[x.label] ||= []).push(x.id);
    for (const [label, ids] of Object.entries(by)) if (ids.length >= 3) add('fit', ids.join(', '), `${ids.length} sibling nodes in ${g} start with "${label}:": one list spread across slots? Each node should answer its own question`);
    const labelled = list.filter((x) => x.label);
    if (labelled.length >= 5 && Object.values(by).every((ids) => ids.length < 3)) add('fit', labelled.map((x) => x.id).join(', '), `${labelled.length} sibling nodes in ${g} start with a label: a list spread across slots? Each node should answer its own question`);
  }
  // 3. Needs and Wants: a confirmed slant means the why-ladder ran, so L1 to L4 hu should hold some
  const slant = path.join(VAULT, '01_matter', 'slant.md');
  if (fs.existsSync(slant) && /^status:\s*(confirmed|accepted)\b/im.test(readText(slant))) {
    const any = [1, 2, 3, 4].some((l) => {
      const f = path.join(nodeDir(find(`L${l}.hu`)), 'contextual.md');
      if (!fs.existsSync(f)) return false;
      const s = sections(parseFront(readText(f)).body);
      return [s.needs, s.wants].some((x) => x && x !== '-');
    });
    if (!any) add('ladder', 'L1.hu to L4.hu', 'the slant is confirmed but no Needs or Wants are saved: run the why-ladder (Stage 1) with the human; never fill it from earlier answers');
  }
  // 4. actions: a route in Skill, a Status a loop can read
  const acts = path.join(VAULT, '05_actions', 'actions.md');
  if (fs.existsSync(acts)) {
    let head = null;
    for (const line of readText(acts).split(/\r?\n/)) {
      if (!line.trim().startsWith('|')) { head = null; continue; }
      const cs = splitRow(line);
      if (cs.some((c) => /^status$/i.test(c))) { head = cs.map((c) => c.toLowerCase()); continue; }
      if (!head || /^:?-{2,}/.test(cs[0]) || !/^[A-Z]+\d{2,}$/.test(cs[0])) continue;
      const status = cs[head.indexOf('status')] || '';
      const skill = head.includes('skill') ? cs[head.indexOf('skill')] || '' : '';
      const first = status.toLowerCase().split(/[\s:;,(]/)[0];
      if (!STATUSES.includes(first)) add('status', cs[0], `Status "${clip(status, 40)}" does not start with ${STATUSES.join(', ')}`);
      if (/^SK-/i.test(skill)) add('older', cs[0], `Skill ${skill} is from the older skill library: convert it to a route`);
      else if (skill && skill !== '-' && !ROUTES.includes(skill)) add('route', cs[0], `Skill "${clip(skill, 30)}" is not a route (${ROUTES.join(', ')})`);
    }
  }
  // 5. verification (information, not a finding): only a human verifies
  let claims = 0, verifiedClaims = 0;
  const ledger = path.join(VAULT, '04_claims', 'ledger.md');
  if (fs.existsSync(ledger)) for (const line of readText(ledger).split(/\r?\n/)) { if (!/^\|\s*C\d{3,}\s*\|/.test(line)) continue; claims++; if (/\|\s*VERIFIED\s*\|/.test(line)) verifiedClaims++; }
  out.info = `${verifiedNodes} of ${total} nodes and ${verifiedClaims} of ${claims} claims verified by a human.`;
  return out;
}
const AUDIT_KINDS = { entry: 'entry points out of date', older: 'older system still in use', route: 'no route or an unknown one', generic: 'generic action', 'no-action': 'open node with no action', sections: 'node sections missing', fit: 'node does not fit its question', ladder: 'why-ladder not run', status: 'action status a loop cannot read' };
function printAudit(findings, { brief = false, all = false } = {}) {
  const kinds = Object.keys(AUDIT_KINDS).filter((k) => findings.some((f) => f.kind === k));
  console.log(`Audit (meaning; check tests the shape): ${findings.length ? `${findings.length} finding(s) of ${kinds.length} kind(s).` : 'no findings.'}`);
  for (const k of kinds) {
    const list = findings.filter((f) => f.kind === k);
    console.log(`  ${AUDIT_KINDS[k]}: ${list.length}${brief ? ` (e.g. ${list.slice(0, 3).map((f) => f.where).join('; ')})` : ''}`);
    if (!brief) for (const f of all ? list : list.slice(0, 8)) console.log(`    ${f.where}: ${f.text}`);
    if (!brief && !all && list.length > 8) console.log(`    ... ${list.length - 8} more (--all lists every one)`);
  }
  if (findings.info) console.log(`  ${findings.info}`);
  if (brief && findings.length) console.log('  Run `node dex-vault/.dex/vault.mjs audit` for the details. Each finding is a proposal for the human.');
}
// A draft document (document mode): an audience line and a complete trace list.
function auditOutput(file) {
  if (!fs.existsSync(file)) die(`No such file: ${file}`);
  const t = readText(file);
  const miss = [];
  if (!/^\W*(audience|for)\s*:/im.test(t)) miss.push('no audience line ("Audience: <who it is for>")');
  if (!/\bC\d{3,}\b/.test(t)) miss.push('no claim IDs (C001)');
  if (!/\bS\d{3,}\b/.test(t)) miss.push('no source IDs (S001)');
  if (!/\b(commit|built from)\b[^\n]*\b[0-9a-f]{7,40}\b/i.test(t)) miss.push('no vault commit ("Built from commit <hash>")');
  const tags = new Set([...t.matchAll(/\b(DOCUMENT|CITED|MODEL|UNSURE)\s*:?\s*\d+/g)].map((m) => m[1]));
  if (tags.size < 4) miss.push(`no count by tag ("Tags: DOCUMENT n, CITED n, MODEL n, UNSURE n"; found ${tags.size} of 4)`);
  return miss;
}
function auditCmd(a) {
  if (typeof a.output === 'string') {
    const miss = auditOutput(path.resolve(a.output));
    console.log(miss.length ? `Draft ${a.output}: ${miss.length} gap(s) in its header or trace list.\n${miss.map((m) => `  ${m}`).join('\n')}` : `Draft ${a.output}: audience and trace list complete.`);
    if (miss.length && a.strict) process.exitCode = 1;
    return;
  }
  const findings = auditFindings();
  if (a.json) console.log(JSON.stringify({ version: DEX_VERSION, findings, info: findings.info }, null, 2));
  else printAudit(findings, { all: !!a.all });
  if (findings.length && a.strict) process.exitCode = 1;
}
