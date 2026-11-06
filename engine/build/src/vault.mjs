#!/usr/bin/env node
// Dex vault tool (Node 18 or later, no packages). Unpacked from dex.md into dex-vault/.dex/.
//
//   node dex-vault/.dex/vault.mjs scaffold --title "<matter>" [--scope <slug>] [--spine <dexspine-core folder>]
//        make all 114 node folders (6 layers x 19 nodes), each with contextual.md and sources/. Never overwrites.
//   node dex-vault/.dex/vault.mjs place <file> --node L1.P01 --id S004 [--material <folder>]
//        copy a source into the node's sources/ with a <file>.md beside it. Gitignore-class files are listed, not copied.
//   node dex-vault/.dex/vault.mjs adapt <questions.json>
//        once the owner confirms the slant: set each named node's question from {"L1.P01": "...", ...}. Updates the open
//        question, the Next column and the wire string together.
//   node dex-vault/.dex/vault.mjs fold [--checkpoint]
//        write the flat layer files (03_spine/L<n>_<name>.md) that the Folio and ShadowOS read, from the node folders.
//        --checkpoint also logs nodes whose state changed since the last checkpoint in 06_journal/changes.md.
//   node dex-vault/.dex/vault.mjs check
//        check the vault has the node-folder shape. Exit code 1 if not. Mirrors validateVault in dexspine-core.
//   node dex-vault/.dex/vault.mjs migrate
//        build node folders from an older flat vault. The flat tables are copied to dex-vault/.dex/backup/<date>/ first.
//
//   node dex-vault/.dex/vault.mjs modules
//        list the bundled Dex modules (pure functions) with the node each serves and the input each expects.
//   node dex-vault/.dex/vault.mjs run <module> --json '{...}'   (or --input file.json)
//        run one bundled module and print its JSON result. Modules never write; they return what should be written.
//   node dex-vault/.dex/vault.mjs classify [folder]
//        list a folder's top level (names only) and classify it: blank, blank-with-context or in-flight; lists secret-class files.
//   node dex-vault/.dex/vault.mjs checkpoint [--skill <name>] [--summary "<text>"] [--chapter "<text>"] [--now <ISO>]
//        close a skill: fold, coverage, RUNLOG row, story chapter, then the vault check. Never applies a node change.
//   node dex-vault/.dex/vault.mjs audit [--all] [--json] [--strict] | audit --output <draft.md> [--strict]
//        the meaning check (check tests the shape): nodes that do not fit their question, open nodes with no route or a generic one,
//        missing Needs and Wants, entry points older than this tool, action statuses. --output checks a draft's audience and trace list. Read-only.
//   node dex-vault/.dex/vault.mjs park --skill <name> --question "<text>" [--issue <n>] [--thought "<text>"]
//        hold where a skill stopped in .dex/state/<skill>.json so a later session can come back to the same question.
//   node dex-vault/.dex/vault.mjs resume [--skill <name>]
//        print the held skill, issue and question, or "nothing held".
//
// Paths come from this file's location (dex-vault/.dex/), so it works from any folder. The node folders are the vault;
// the flat layer files are generated from them. Never edit a flat layer file by hand.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // dex-vault/.dex
const VAULT = path.dirname(HERE); // dex-vault
const ROOT = path.dirname(VAULT); // the folder that holds dex.md
const SPINE = path.join(VAULT, '03_spine');
const CONFIG = path.join(HERE, 'vault.json');
const STATES = path.join(HERE, 'states.json');
const today = () => new Date().toISOString().slice(0, 10);

const LAYERS = [
  ['L1_values', 'Values', 'What the owner wants, who or what comes first and the rules that will not be broken.', 'what matters'],
  ['L2_principles', 'Principles', 'How the work should be done. The working rules applied to this matter.', 'how the work should be done'],
  ['L3_policy', 'Policy', 'Rules, standards, agreements and frames that govern the matter. The type of matter sits here.', 'what rules apply'],
  ['L4_process', 'Process', 'The stages the matter moves through, who decides at each one and the test applied.', 'how the matter moves'],
  ['L5_procedure', 'Procedure', 'Concrete steps, tools, artefacts and stated dates.', 'what the steps are'],
  ['L6_pattern', 'Pattern', 'What keeps happening, for every party including the owner.', 'what keeps happening'],
];
const PLAN = ['Definition', 'Purpose', 'Scope', 'Stakeholders', 'Success Criteria', 'Dependencies', 'Constraints', 'Metrics'];
const EXECUTE = ['Approach', 'Tools', 'Workflow', 'Artifacts', 'Validation', 'Rollback', 'Monitoring', 'Improvement'];
// The base question per point, from the 8 Plan and 8 Execute questions of the DexSpine corpus (dex/plan.md, dex/execute.md).
const BASE = {
  plan: ['What IS the subject?', 'WHY does the subject exist?', 'What is included and excluded?', 'Who cares about the subject?', 'How do we know it works?', 'What does the subject need?', 'What limits the subject?', 'How do we measure the subject?'],
  execute: ['How do we implement the subject?', 'What tools enable the subject?', 'What is the process or workflow?', 'What gets produced?', 'How do we verify the output?', 'How do we undo or revert changes?', 'How do we track the subject in operation?', 'How do we improve the subject over time?'],
};
const GITIGNORE_CLASS = [/^\.env(\..+)?$/i, /\.(pem|key|p12|pfx|jks|keystore|kdbx|token)$/i, /^id_(rsa|dsa|ecdsa|ed25519)(\..+)?$/i, /^credentials(\..+)?$/i, /^secrets?(\..+)?$/i, /^\.(npmrc|netrc|pypirc)$/i];
const GITIGNORE_SAFE = /\.(example|sample|template)$/i;
const isGitignoreClass = (name) => !GITIGNORE_SAFE.test(name) && GITIGNORE_CLASS.some((re) => re.test(name));

// ---- the 114 nodes -------------------------------------------------------
function nodes() {
  const out = [];
  LAYERS.forEach(([dir, name, subject, hu], i) => {
    const n = i + 1;
    const add = (phase, folder, id, title, key) => out.push({ layer: n, layerDir: dir, layerName: name, layerSubject: subject, huPrompt: hu, phase, folder, id: `L${n}.${id}`, title, key, rel: `${dir}/${phase}/${folder}` });
    for (const t of ['va', 'hu', 'llm']) add('mve', t, t, t, t);
    PLAN.forEach((t, k) => add('plan', `P${pad(k + 1)}_${snake(t)}`, `P${pad(k + 1)}`, t, `${pad(k + 1)} ${t}`));
    EXECUTE.forEach((t, k) => add('execute', `E${pad(k + 1)}_${snake(t)}`, `E${pad(k + 1)}`, t, `${pad(k + 1)} ${t}`));
  });
  return out;
}
const pad = (n) => String(n).padStart(2, '0');
const snake = (t) => t.toLowerCase().replace(/\s+/g, '_');
const slug = (t) => (String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'matter');
const nodeDir = (nd) => path.join(SPINE, ...nd.rel.split('/'));
const find = (id) => nodes().find((nd) => nd.id.toLowerCase() === String(id).toLowerCase());

// ---- small readers/writers ----------------------------------------------
function parseFront(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text.replace(/^﻿/, ''));
  const fields = {};
  if (!m) return { fields, body: text };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) fields[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fields, body: m[2] };
}
function sections(body) {
  const out = {};
  let cur = null;
  for (const line of body.split(/\r?\n/)) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) { cur = h[1].toLowerCase().replace(/[‘’]/g, "'"); out[cur] = []; continue; }
    if (cur) out[cur].push(line);
  }
  for (const k of Object.keys(out)) out[k] = out[k].join('\n').trim();
  return out;
}
const oneLine = (s) => s.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim();
const readConfig = () => (fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, 'utf8')) : {});
const writeConfig = (c) => fs.writeFileSync(CONFIG, JSON.stringify(c, null, 2) + '\n');
function args(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { const k = argv[i].slice(2); a[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; } else a._.push(argv[i]);
  }
  return a;
}
function die(msg) { console.error(msg); process.exit(1); }
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// ---- scaffold --------------------------------------------------------------
function baseQuestions(spine) {
  const q = { plan: [...BASE.plan], execute: [...BASE.execute] };
  if (!spine) return q;
  for (const phase of ['plan', 'execute']) {
    const f = path.join(spine, 'dex', `${phase}.md`);
    if (!fs.existsSync(f)) continue;
    const found = [...fs.readFileSync(f, 'utf8').matchAll(/^(\d)\.\s+\*\*[^*]+:\*\*\s+(.+?)\s*$/gm)];
    if (found.length === 8) found.forEach((m) => { q[phase][Number(m[1]) - 1] = m[2]; });
  }
  return q;
}
function questionFor(nd, q) {
  if (nd.phase === 'mve') {
    if (nd.key === 'va') return `What values are held at this layer (L${nd.layer} ${nd.layerName})?`;
    if (nd.key === 'hu') return `In your own words: ${nd.huPrompt}?`;
    return `What does the agent read at L${nd.layer} ${nd.layerName}, from the sources?`;
  }
  const k = Number(nd.id.slice(-2)) - 1;
  const base = q[nd.phase][k].replace(/\bthe subject\b/i, 'this matter');
  return `${base} (L${nd.layer} ${nd.layerName})`;
}
const wireFor = (scope, nd, question) => {
  const ctx = `layer:${nd.layerDir.split('_')[1]},phase:${nd.phase},point:${nd.phase === 'mve' ? nd.key : Number(nd.id.slice(-2))}`;
  return `dex(${scope}, @${ctx})["${question.replace(/"/g, "'")}"]`;
};
function contextual(nd, { scope, question, answer = 'Not observable.', tag = '-', state = 'N', sources = '-', verified = 'no', next, owner = '-', reading = '-', date = today() }) {
  const nextCol = next ?? (nd.key === 'llm' ? '-' : `dex-grill: ${question}`);
  return `---
node: ${nd.id}
layer: ${nd.layer}
phase: ${nd.phase}
point: ${nd.phase === 'mve' ? nd.key : Number(nd.id.slice(-2))}
title: ${nd.title}
state: ${state}
tag: ${tag}
sources: ${sources}
verified: ${verified}
next: ${nextCol}
wire: ${wireFor(scope, nd, question)}
updated: ${date}
---
# ${nd.id} ${nd.title}

## Answer
${answer}

## Open questions
${question ? `- ${question}` : '-'}

## Owner's words (verbatim)
${owner}

## Needs
-

## Wants
-

## Agent reading
${reading}

## Defined actions
-

## Undefined actions
-
`;
}
function scaffold(a) {
  const prev = readConfig();
  const title = typeof a.title === 'string' ? a.title : prev.title || 'Matter';
  const scope = typeof a.scope === 'string' ? slug(a.scope) : prev.scope || slug(title);
  const spine = typeof a.spine === 'string' ? a.spine : prev.spine;
  const q = baseQuestions(spine);
  fs.mkdirSync(HERE, { recursive: true });
  writeConfig({ title, scope, spine: spine || null });
  let made = 0, kept = 0, filled = 0;
  for (const nd of nodes()) {
    const dir = nodeDir(nd);
    fs.mkdirSync(path.join(dir, 'sources'), { recursive: true });
    const keep = path.join(dir, 'sources', '.gitkeep');
    if (!fs.existsSync(keep)) fs.writeFileSync(keep, '');
    const file = path.join(dir, 'contextual.md');
    if (fs.existsSync(file)) { kept++; if (backfillSections(file)) filled++; continue; }
    const question = questionFor(nd, q);
    fs.writeFileSync(file, contextual(nd, { scope, question, answer: nd.key === 'hu' ? 'UNANSWERED' : 'Not observable.', owner: nd.key === 'hu' ? 'UNANSWERED' : '-' }));
    made++;
  }
  console.log(`Scaffold: ${made} node folders written, ${kept} already there (left as they are). ${nodes().length} nodes in all.${filled ? ` Needs and Wants sections added to ${filled} existing node(s); nothing else in them changed.` : ''}`);
}

// ---- place -------------------------------------------------------------------
function place(a) {
  const file = a._[1];
  if (!file || typeof a.node !== 'string' || typeof a.id !== 'string') die('Usage: place <file> --node L1.P01 --id S004 [--material <folder>]');
  const nd = find(a.node) || die(`Unknown node: ${a.node}`);
  const material = path.resolve(typeof a.material === 'string' ? a.material : ROOT);
  const src = path.resolve(material, file);
  const original = path.relative(material, src).split(path.sep).join('/');
  if (original.startsWith('..') || path.isAbsolute(original)) die(`Not inside the material folder: ${src}`);
  if (src.startsWith(VAULT + path.sep)) die('Sources are never taken from inside dex-vault/.');
  if (!fs.existsSync(src) || !fs.statSync(src).isFile()) die(`Not a file: ${src}`);
  const name = path.basename(src);
  const dest = path.join(nodeDir(nd), 'sources');
  if (!fs.existsSync(nodeDir(nd))) die(`Node folder missing: ${nd.rel}. Run scaffold first.`);
  fs.mkdirSync(dest, { recursive: true });
  const sidecar = path.join(dest, `${name}.md`);
  if (fs.existsSync(sidecar)) die(`Already placed: ${path.relative(VAULT, sidecar)}`);
  const bytes = fs.statSync(src).size;
  if (isGitignoreClass(name)) {
    fs.writeFileSync(sidecar, `---
id: ${a.id}
original: ${original}
copied: false
reason: gitignore-class
bytes: ${bytes}
placed: ${today()}
node: ${nd.id}
---
# ${name}

Listed, not copied. This file looks like a secret, key or token: the kind of file that is normally gitignored. It stays where it is. Do not open it, quote it or copy it into the vault, so a repo that goes public cannot leak it.

## Details
Original: \`${original}\` (${bytes} bytes). Not read.

## Advice
<agent: say what kind of file this is, and cite the provider's own advice for the service it belongs to. Tag it UNVERIFIED. Name a statute only if you can name it exactly. This is not legal advice.>

## For humans
Review it locally. Keep it out of anything that is pushed. Rotate it if it was ever shared.

## For agents
Never open, summarise or quote this file. Treat its contents as unknown.
`);
    console.log(`Listed, not copied (gitignore-class): ${original} -> ${path.relative(VAULT, sidecar)}`);
    return;
  }
  const copy = path.join(dest, name);
  if (fs.existsSync(copy)) die(`Already placed: ${path.relative(VAULT, copy)}`);
  fs.copyFileSync(src, copy);
  const digest = sha(src);
  if (sha(copy) !== digest) { fs.rmSync(copy); die(`Copy did not match the original: ${original}`); }
  fs.writeFileSync(sidecar, `---
id: ${a.id}
original: ${original}
copied: true
bytes: ${bytes}
sha256: ${digest}
placed: ${today()}
node: ${nd.id}
---
# ${name}

## Details
<agent: what this is, who wrote it, when. Tag each statement DOCUMENT, CITED, MODEL or UNSURE.>

## For humans
<agent: why it sits at this node, and what to look at in it.>

## For agents
Read the placed copy beside this file, not the original. The original is never changed.
`);
  console.log(`Placed: ${original} -> ${path.relative(VAULT, copy)} (+ ${name}.md)`);
}

// ---- adapt -------------------------------------------------------------------
function adapt(a) {
  const file = a._[1];
  if (!file) die('Usage: adapt <questions.json>   (a JSON object of node id to question)');
  const map = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const scope = readConfig().scope || 'matter';
  let n = 0;
  for (const [id, q] of Object.entries(map)) {
    const nd = find(id) || die(`Unknown node: ${id}`);
    const f = path.join(nodeDir(nd), 'contextual.md');
    if (!fs.existsSync(f)) die(`Missing ${nd.rel}/contextual.md. Run scaffold first.`);
    const question = String(q).replace(/\s+/g, ' ').trim();
    if (!question) die(`Empty question for ${id}`);
    const text = fs.readFileSync(f, 'utf8')
      .replace(/^next: (SK-[A-Z]+|dex-grill): .*$/m, () => `next: dex-grill: ${question}`)
      .replace(/^wire: .*$/m, () => `wire: ${wireFor(scope, nd, question)}`)
      .replace(/(## Open questions\r?\n)- .*/, (_, head) => `${head}- ${question}`)
      .replace(/^updated: .*$/m, `updated: ${today()}`);
    fs.writeFileSync(f, text);
    n++;
  }
  console.log(`Adapt: ${n} node question(s) set. Run fold to refresh the flat files.`);
}

// ---- fold --------------------------------------------------------------------
function readNode(nd) {
  const file = path.join(nodeDir(nd), 'contextual.md');
  if (!fs.existsSync(file)) die(`Missing ${nd.rel}/contextual.md. Run scaffold, or migrate for an older vault.`);
  const { fields, body } = parseFront(fs.readFileSync(file, 'utf8'));
  return { fields, sec: sections(body) };
}
function fold(a) {
  const all = nodes();
  const states = {};
  const counts = {};
  for (const [li, [dir, name, subject]] of LAYERS.entries()) {
    const rows = { mve: [], plan: [], execute: [] };
    for (const nd of all.filter((x) => x.layer === li + 1)) {
      const { fields: f, sec } = readNode(nd);
      const answer = oneLine(sec.answer || 'Not observable.');
      const state = f.state || 'N';
      states[nd.id] = state;
      counts[li + 1] = counts[li + 1] || {};
      counts[li + 1][state] = (counts[li + 1][state] || 0) + 1;
      rows[nd.phase].push(`| ${nd.key} | ${answer} | ${f.tag || '-'} | ${state} | ${f.sources || '-'} | ${f.verified || 'no'} | ${oneLine(f.next || '-')} |`);
    }
    const head = (first, second) => `| ${first} | ${second} | Tag | State | Sources | Verified | Next |\n|---|---|---|---|---|---|---|`;
    fs.writeFileSync(path.join(SPINE, `${dir}.md`), `---
type: spine-layer
layer: ${li + 1}
name: ${name}
subject: ${subject}
updated: ${today()}
generated: from the node folders by vault.mjs fold, never edit by hand
---
# L${li + 1} ${name}

### MVE
${head('Node', 'Content')}
${rows.mve.join('\n')}

### Plan
${head('Point', 'Answer')}
${rows.plan.join('\n')}

### Execute
${head('Point', 'Answer')}
${rows.execute.join('\n')}
`);
  }
  console.log('Folded 114 node folders into 6 flat layer files. Counts by state per layer:');
  for (const [l, c] of Object.entries(counts)) console.log(`  L${l}: ${Object.entries(c).map(([s, n]) => `${s}=${n}`).join(' ')}`);
  if (a.checkpoint) checkpoint(states);
}
function checkpoint(states) {
  const before = fs.existsSync(STATES) ? JSON.parse(fs.readFileSync(STATES, 'utf8')) : null;
  fs.writeFileSync(STATES, JSON.stringify(states));
  if (!before) { console.log('Checkpoint: first one, baseline recorded. Nothing to compare yet.'); return; }
  const moved = Object.keys(states).filter((k) => before[k] !== undefined && before[k] !== states[k]);
  const log = path.join(VAULT, '06_journal', 'changes.md');
  fs.mkdirSync(path.dirname(log), { recursive: true });
  if (!fs.existsSync(log)) fs.writeFileSync(log, '---\ntype: change-log\n---\n# Change log\n\nNodes whose state changed between checkpoints. N not observable, W weak, C covered, NA not applicable.\n\n| Date | Node | From | To |\n|---|---|---|---|\n');
  if (moved.length) fs.appendFileSync(log, moved.map((k) => `| ${today()} | ${k} | ${before[k]} | ${states[k]} |`).join('\n') + '\n');
  console.log(`Checkpoint: ${moved.length} node(s) changed state since the last one.${moved.length ? ' Logged in 06_journal/changes.md.' : ''}`);
}

// ---- check (mirrors validateVault in dexspine-core) -------------------------------
function check() {
  const problems = [];
  const warnings = [];
  const heads = (md) => { const s = new Set(); let fence = false; for (const l of md.split(/\r?\n/)) { if (/^\s{0,3}(```|~~~)/.test(l)) fence = !fence; if (fence) continue; const m = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(l); if (m) s.add(m[1].trim().toLowerCase().replace(/[‘’]/g, "'")); } return s; };
  const listed = (p) => { const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(p, 'utf8')); return !!m && /^copied:\s*false\s*$/m.test(m[1]); };
  const walk = (rel) => {
    const dir = path.join(VAULT, rel);
    if (!fs.existsSync(dir)) return;
    if (!fs.statSync(dir).isDirectory()) { problems.push(`${rel}: is a file, expected a folder`); return; }
    const ents = fs.readdirSync(dir, { withFileTypes: true });
    const files = new Set(ents.filter((e) => e.isFile()).map((e) => e.name));
    for (const e of ents) {
      if (e.isDirectory()) { walk(`${rel}/${e.name}`); continue; }
      const name = e.name, base = name.endsWith('.md') ? name.slice(0, -3) : null;
      if (base !== null && listed(path.join(dir, name))) continue;
      if (base === null && isGitignoreClass(name)) { problems.push(`${rel}/${name}: gitignore-class file was copied (list it in a source .md with copied: false instead)`); continue; }
      if (base === null && name.startsWith('.')) continue;
      if (base !== null && files.has(base)) continue;
      if (base !== null && base.includes('.')) { problems.push(`${rel}/${name}: source .md has no placed source (expected ${base})`); continue; }
      if (!files.has(`${name}.md`)) problems.push(`${rel}/${name}: placed source has no source .md (expected ${name}.md)`);
      else if (/<agent:/.test(fs.readFileSync(path.join(dir, `${name}.md`), 'utf8'))) warnings.push(`${rel}/${name}.md: still has an <agent: ...> placeholder to fill`);
    }
  };
  for (const nd of nodes()) {
    const rel = `03_spine/${nd.rel}`;
    if (!fs.existsSync(nodeDir(nd)) || !fs.statSync(nodeDir(nd)).isDirectory()) { problems.push(`missing node folder: ${rel}`); continue; }
    const file = path.join(nodeDir(nd), 'contextual.md');
    if (!fs.existsSync(file)) problems.push(`${rel}: missing contextual.md`);
    else {
      const h = heads(fs.readFileSync(file, 'utf8'));
      for (const s of ["Owner's words (verbatim)", 'Agent reading']) if (!h.has(s.toLowerCase())) problems.push(`${rel}/contextual.md: missing section "${s}"`);
    }
    walk(`${rel}/sources`);
    const flat = path.join(SPINE, `${nd.layerDir}.md`);
    if (fs.existsSync(file) && (!fs.existsSync(flat) || fs.statSync(flat).mtimeMs < fs.statSync(file).mtimeMs - 1000)) warnings.push(`${nd.layerDir}.md is older than its node folders: run fold`);
  }
  const uniq = (xs) => [...new Set(xs)];
  for (const w of uniq(warnings)) console.log(`warning: ${w}`);
  if (problems.length) { for (const p of problems) console.log(`PROBLEM: ${p}`); console.log(`${problems.length} problem(s).`); process.exit(1); }
  console.log(`OK: ${nodes().length} node folders, each with contextual.md (both sections); every placed source has its source .md; no gitignore-class file copied.`);
}

// ---- migrate (flat vault -> node folders) -------------------------------------------
function migrate() {
  const cfg = readConfig();
  let scope = cfg.scope;
  if (!scope) {
    const idx = path.join(VAULT, '00_index.md');
    scope = slug(fs.existsSync(idx) ? parseFront(fs.readFileSync(idx, 'utf8')).fields.title || '' : '');
    fs.mkdirSync(HERE, { recursive: true });
    writeConfig({ title: scope, scope, spine: null });
  }
  const q = baseQuestions(cfg.spine);
  const backup = path.join(HERE, 'backup', today(), '03_spine');
  fs.mkdirSync(backup, { recursive: true });
  let made = 0, kept = 0;
  for (const [li, [dir]] of LAYERS.entries()) {
    const flat = path.join(SPINE, `${dir}.md`);
    if (!fs.existsSync(flat)) { console.log(`No flat file for ${dir}: skipped.`); continue; }
    fs.copyFileSync(flat, path.join(backup, `${dir}.md`));
    const rows = {};
    let section = null;
    for (const line of fs.readFileSync(flat, 'utf8').split(/\r?\n/)) {
      const h = /^###\s+(MVE|Plan|Execute)\b/.exec(line);
      if (h) { section = h[1]; continue; }
      if (!section || !line.trimStart().startsWith('|')) continue;
      const cs = splitRow(line);
      if (cs.length < 7 || /^:?-{2,}:?$/.test(cs[0]) || cs[0] === 'Node' || cs[0] === 'Point') continue;
      rows[cs[0]] = cs;
    }
    for (const nd of nodes().filter((x) => x.layer === li + 1)) {
      const r = rows[nd.key];
      if (!r) continue;
      const dirPath = nodeDir(nd);
      fs.mkdirSync(path.join(dirPath, 'sources'), { recursive: true });
      const keep = path.join(dirPath, 'sources', '.gitkeep');
      if (!fs.existsSync(keep)) fs.writeFileSync(keep, '');
      const file = path.join(dirPath, 'contextual.md');
      if (fs.existsSync(file)) { kept++; continue; }
      const [, content, tag, state, sources, verified, next] = r;
      const question = questionFor(nd, q);
      fs.writeFileSync(file, contextual(nd, {
        scope, question, answer: content, tag, state, sources, verified, next,
        owner: nd.key === 'hu' && !/^UNANSWERED/i.test(content) ? content : nd.key === 'hu' ? 'UNANSWERED' : '-',
        reading: nd.key === 'llm' ? content : `Carried over from the flat vault on ${today()}. Re-read at the next update.`,
      }));
      made++;
    }
  }
  console.log(`Migrate: ${made} node folders written from the flat tables, ${kept} already there. Flat tables copied to dex-vault/.dex/backup/${today()}/ and kept until the owner verifies.`);
  console.log('Next: run scaffold to add any missing nodes, then fold, then check.');
}
function splitRow(line) {
  const out = [];
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\' && line[i + 1] === '|') { cur += '|'; i++; } else if (line[i] === '|') { out.push(cur.trim()); cur = ''; } else cur += line[i];
  }
  out.push(cur.trim());
  if (out[0] === '') out.shift();
  if (out[out.length - 1] === '') out.pop();
  return out;
}

// ---- Dex additions: bundled modules, classify and checkpoint ---------------------------------------
// The modules in dex-lib.mjs are pure: they return what must be written; this tool does the writing.
const DEX_VERSION = '0.11.1'; // set from package.json by make-vault.mjs
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

// ---- main -------------------------------------------------------------------------
const a = args(process.argv.slice(2));
const cmd = a._[0];
const commands = { scaffold, place, adapt, fold, check, migrate, modules: modulesCmd, run: runCmd, classify: classifyCmd, checkpoint: checkpointCmd, park: parkCmd, resume: resumeCmd, audit: auditCmd };
if (!commands[cmd]) die('Usage: node dex-vault/.dex/vault.mjs <scaffold|place|adapt|fold|check|audit|migrate|modules|run|classify|checkpoint|park|resume> ...');
Promise.resolve(commands[cmd](a)).catch((e) => die(`Error: ${e.message}`));
