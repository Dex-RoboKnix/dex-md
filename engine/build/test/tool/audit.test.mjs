import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// The meaning check (audit), the scaffold backfill and the version, run on a synthetic old vault laid out like the
// first real user test: migrated from flat tables, SK- routes, generic actions, a list spread across sibling nodes,
// no Needs or Wants, stale entry points. No real material is in it.
const BUILD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REPO = path.resolve(BUILD, '../..');
const TOOL = path.join(BUILD, 'src/vault.mjs');
const LIB = path.join(BUILD, 'dist/dex-lib.mjs');
const VERSION = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).version;

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dex-audit-'));
  const vault = path.join(root, 'dex-vault');
  const dex = path.join(vault, '.dex');
  fs.mkdirSync(dex, { recursive: true });
  fs.copyFileSync(TOOL, path.join(dex, 'vault.mjs'));
  fs.copyFileSync(LIB, path.join(dex, 'dex-lib.mjs'));
  const run = (...a) => spawnSync(process.execPath, [path.join(dex, 'vault.mjs'), ...a], { encoding: 'utf8', cwd: root });
  assert.equal(run('scaffold', '--title', 'Sample matter').status, 0);
  const node = (rel) => path.join(vault, '03_spine', ...rel.split('/'), 'contextual.md');
  const edit = (rel, fn) => fs.writeFileSync(node(rel), fn(fs.readFileSync(node(rel), 'utf8')));
  const write = (rel, text) => { fs.mkdirSync(path.dirname(path.join(vault, rel)), { recursive: true }); fs.writeFileSync(path.join(vault, rel), text); };
  const audit = () => { const r = run('audit', '--json'); assert.equal(r.status, 0, r.stderr); return JSON.parse(r.stdout); };
  return { root, vault, run, node, edit, write, audit };
}
const setAnswer = (text, answer, state = 'W') => text.replace(/^state: .*$/m, `state: ${state}`).replace(/(## Answer\r?\n)[^\n]*/, `$1${answer}`);
const setNext = (text, next) => text.replace(/^next: .*$/m, `next: ${next}`);
const stripNeedsWants = (text) => text.replace(/## Needs\n-\n\n## Wants\n-\n\n/, '');

function oldVault() {
  const s = sandbox();
  s.write('00_index.md', '---\ntype: dex-index\ntitle: Sample matter\ndex_version: 0.9.2\n---\n# Sample matter\n');
  s.write('HANDOFF.md', '# Hand-off\n1. Read `mof/00_index.md` first.\n');
  s.write('01_matter/slant.md', '---\ntype: slant\nslant: Planner\nstatus: accepted\n---\n# Slant\n');
  // a list of parties spread one per node across L6 Plan, as an older flat build did
  for (const p of ['P03_scope', 'P04_stakeholders', 'P05_success_criteria']) s.edit(`L6_pattern/plan/${p}`, (t) => setAnswer(t, 'Party B: something the records show.'));
  s.edit('L4_process/plan/P01_definition', (t) => setNext(t, 'SK-SOURCES: Strengthen this node'));
  s.edit('L4_process/plan/P02_purpose', (t) => setNext(t, 'banana: ask about it'));
  s.edit('L4_process/plan/P03_scope', (t) => setNext(setAnswer(t, 'Thin.'), '-'));
  s.edit('L4_process/plan/P04_stakeholders', stripNeedsWants);
  s.edit('L5_procedure/plan/P01_definition', (t) => t.replace('## Agent reading\n-', `## Agent reading\n${'DOCUMENT S001: a long reading. '.repeat(400)}`));
  s.write('05_actions/actions.md', '| ID | Node | Kind | Action | Skill | Status |\n|---|---|---|---|---|---|\n| P001 | L4.P01 | issue | List the letters | SK-RULES | PARTLY DONE: v1 in the work file |\n| P002 | L4.P02 | issue | Ask about the date | dex-grill | open |\n');
  return s;
}
const kinds = (r) => new Set(r.findings.map((f) => f.kind));
const where = (r, kind) => r.findings.filter((f) => f.kind === kind).map((f) => f.where).join(' | ');

test('audit reports every kind of finding the first user test had, on a synthetic old vault', () => {
  const r = oldVault().audit();
  assert.equal(r.version, VERSION);
  for (const k of ['entry', 'older', 'route', 'generic', 'no-action', 'sections', 'fit', 'ladder', 'status']) assert.ok(kinds(r).has(k), `missing finding: ${k}`);
  assert.match(where(r, 'entry'), /00_index\.md/);
  assert.match(where(r, 'entry'), /HANDOFF\.md/);
  assert.match(where(r, 'fit'), /L6\.P03, L6\.P04, L6\.P05/, 'the list spread across sibling nodes');
  assert.match(where(r, 'fit'), /L5\.P01/, 'the catch-all node over 8 KB');
  assert.match(where(r, 'older'), /L4\.P01/);
  assert.match(where(r, 'older'), /P001/, 'an SK- skill in actions.md');
  assert.match(where(r, 'route'), /L4\.P02/);
  assert.match(where(r, 'generic'), /L4\.P01/);
  assert.match(where(r, 'no-action'), /L4\.P03/);
  assert.match(where(r, 'sections'), /L4\.P04/);
  assert.match(where(r, 'status'), /P001/);
  assert.doesNotMatch(where(r, 'status'), /P002/, 'a status from the set is not a finding');
  assert.match(r.info, /0 of 114 nodes and 0 of 0 claims verified/);
});

test('a fresh vault on this version has no findings, and --strict passes it', () => {
  const s = sandbox();
  s.write('00_index.md', `---\ntype: dex-index\ntitle: Sample matter\ndex_version: ${VERSION}\n---\n# Sample matter\n`);
  const r = s.audit();
  assert.deepEqual(r.findings, [], JSON.stringify(r.findings.slice(0, 3)));
  assert.equal(s.run('audit', '--strict').status, 0);
});

test('--strict exits 1 on findings; plain audit never fails', () => {
  const s = oldVault();
  assert.equal(s.run('audit').status, 0);
  const strict = s.run('audit', '--strict');
  assert.equal(strict.status, 1);
  assert.match(strict.stdout, /older system still in use/);
});

test('a confirmed slant with Needs saved on a rung hu node clears the ladder finding', () => {
  const s = oldVault();
  assert.ok(kinds(s.audit()).has('ladder'));
  s.edit('L3_policy/mve/hu', (t) => t.replace('## Needs\n-', '## Needs\n- "It has to be done before the move." (J004)'));
  assert.ok(!kinds(s.audit()).has('ladder'));
});

test('audit --output checks a draft for its audience and full trace list', () => {
  const s = sandbox();
  const bare = path.join(s.root, 'bare.md');
  fs.writeFileSync(bare, '# Draft letter\n\nDear Sir,\nThe repair is still not done.\n');
  const r1 = s.run('audit', '--output', bare, '--strict');
  assert.equal(r1.status, 1);
  for (const gap of ['audience', 'claim IDs', 'source IDs', 'vault commit', 'count by tag']) assert.match(r1.stdout, new RegExp(gap), gap);
  const full = path.join(s.root, 'full.md');
  fs.writeFileSync(full, '# Draft letter\nAudience: the landlord\nBuilt from commit 693768a. Claims C001, C014. Sources S007.\nTags: DOCUMENT 6, CITED 0, MODEL 1, UNSURE 0\n\nDear Sir,\n');
  const r2 = s.run('audit', '--output', full, '--strict');
  assert.equal(r2.status, 0, r2.stdout);
  assert.match(r2.stdout, /audience and trace list complete/);
});

test('scaffold adds missing Needs and Wants to existing nodes, once, and changes nothing else', () => {
  const s = sandbox();
  const before = stripNeedsWants(fs.readFileSync(s.node('L2_principles/plan/P02_purpose'), 'utf8')).replace('## Answer\nNot observable.', '## Answer\nThe owner keeps their own wording.');
  fs.writeFileSync(s.node('L2_principles/plan/P02_purpose'), before);
  const crlf = stripNeedsWants(fs.readFileSync(s.node('L2_principles/plan/P03_scope'), 'utf8')).replace(/\n/g, '\r\n');
  fs.writeFileSync(s.node('L2_principles/plan/P03_scope'), crlf);
  const r = s.run('scaffold');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Needs and Wants sections added to 2 existing node\(s\)/);
  const after = fs.readFileSync(s.node('L2_principles/plan/P02_purpose'), 'utf8');
  assert.match(after, /## Needs\n-\n\n## Wants\n-\n\n## Agent reading/);
  assert.equal(after.replace('## Needs\n-\n\n## Wants\n-\n\n', ''), before, 'only the two sections were added');
  const afterCrlf = fs.readFileSync(s.node('L2_principles/plan/P03_scope'), 'utf8');
  assert.match(afterCrlf, /## Needs\r\n-\r\n\r\n## Wants\r\n-\r\n\r\n## Agent reading/, 'line endings kept');
  const again = s.run('scaffold');
  assert.doesNotMatch(again.stdout, /sections added/, 'a second run adds nothing');
  assert.equal(fs.readFileSync(s.node('L2_principles/plan/P02_purpose'), 'utf8'), after);
});

test('a new node routes to dex-grill, and adapt converts an older SK- route', () => {
  const s = sandbox();
  assert.match(fs.readFileSync(s.node('L1_values/mve/hu'), 'utf8'), /^next: dex-grill: In your own words/m);
  assert.match(fs.readFileSync(s.node('L1_values/plan/P01_definition'), 'utf8'), /^next: dex-grill: /m);
  s.edit('L1_values/plan/P02_purpose', (t) => setNext(t, 'SK-GRILL: old question'));
  const q = path.join(s.root, 'q.json');
  fs.writeFileSync(q, JSON.stringify({ 'L1.P02': 'Which outcome would let you stop?' }));
  assert.equal(s.run('adapt', q).status, 0);
  assert.match(fs.readFileSync(s.node('L1_values/plan/P02_purpose'), 'utf8'), /^next: dex-grill: Which outcome would let you stop\?$/m);
});

test('the tool reports the package version, and so do the checkpoint rows it writes', () => {
  for (const f of [TOOL, path.join(REPO, 'engine/vault.mjs')]) assert.match(fs.readFileSync(f, 'utf8'), new RegExp(`const DEX_VERSION = '${VERSION.replace(/\./g, '\\.')}'`), f);
  const dex = fs.readFileSync(path.join(REPO, 'dex.md'), 'utf8');
  assert.match(dex, new RegExp(`^version: ${VERSION.replace(/\./g, '\\.')}$`, 'm'), 'dex.md version');
  assert.match(dex, new RegExp(`--branch v${VERSION.replace(/\./g, '\\.')} `), 'dex.md pins its own version');
  const s = sandbox();
  const r = s.run('checkpoint', '--skill', 'dex-grill', '--summary', 'baseline');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(fs.readFileSync(path.join(s.vault, 'RUNLOG.md'), 'utf8'), new RegExp(`\\| checkpoint \\| ${VERSION.replace(/\./g, '\\.')} \\|`));
});

test('checkpoint says when nodes were edited but no state moved, and when one did', () => {
  const s = sandbox();
  assert.equal(s.run('checkpoint', '--skill', 'dex-grill', '--summary', 'baseline').status, 0);
  // Date every node and the last checkpoint into the past, so only an edit made after this counts as edited.
  const settle = () => {
    const t = Date.now() / 1000;
    for (const f of fs.readdirSync(path.join(s.vault, '03_spine'), { recursive: true }).filter((x) => x.endsWith('contextual.md'))) fs.utimesSync(path.join(s.vault, '03_spine', f), t - 300, t - 300);
    fs.utimesSync(path.join(s.vault, '.dex', 'states.json'), t - 200, t - 200);
  };
  settle();
  s.edit('L1_values/plan/P01_definition', (t) => t.replace('## Answer\nNot observable.', '## Answer\nNot observable. A note was added.'));
  const r1 = s.run('checkpoint', '--skill', 'dex-grill', '--summary', 'edited only');
  assert.equal(r1.status, 0, r1.stdout + r1.stderr);
  assert.match(r1.stdout, /1 node\(s\) edited since the last checkpoint, 0 changed state\. Coverage only moves when a state moves/);
  assert.match(r1.stdout, /Audit \(meaning; check tests the shape\)/);
  settle();
  s.edit('L1_values/plan/P02_purpose', (t) => setAnswer(t, 'The outcome, in the owner\'s words.', 'C'));
  const r2 = s.run('checkpoint', '--skill', 'dex-grill', '--summary', 'one covered');
  assert.match(r2.stdout, /1 node\(s\) edited since the last checkpoint, 1 changed state\./);
  assert.doesNotMatch(r2.stdout, /Coverage only moves/);
});
