#!/usr/bin/env node
// Test drive: follow dex.md mechanically in a sandbox (no LLM): read the short dex.md, make its pinned dex-md clone, install, then run the vault tool.
// Usage: node engine/build/tools/testdrive.mjs <sandbox-dir> [<dex-md remote>]
//   The remote defaults to this repo on disk (file://), so the drive runs before anything is pushed. The clone uses the tag dex.md pins.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BUILD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(BUILD, '..', '..');
const sandbox = path.resolve(process.argv[2] || '');
const remote = process.argv[3] || pathToFileURL(REPO).href;
if (!process.argv[2]) { console.log('usage: testdrive.mjs <empty sandbox dir> [<dex-md remote>]'); process.exit(1); }
if (fs.existsSync(sandbox) && fs.readdirSync(sandbox).length) { console.log('sandbox is not empty:', sandbox); process.exit(1); }
fs.mkdirSync(sandbox, { recursive: true });

// 1. the sandbox: a copy of the test shed fixture, a fake secret, a chat-export fixture, and the shipped dex.md
const shed = path.join(BUILD, 'test', 'fixtures', 'shed');
for (const f of fs.readdirSync(shed)) fs.copyFileSync(path.join(shed, f), path.join(sandbox, f));
fs.writeFileSync(path.join(sandbox, '.env'), 'EXAMPLE_TOKEN=not-a-real-secret-test-fixture\n');
fs.writeFileSync(path.join(sandbox, 'conversations.json'), JSON.stringify([
  { id: 'c1', title: 'Slab thickness question', create_time: 1727000000, mapping: {} },
  { id: 'c2', title: 'Timber frame quote comparison', create_time: 1727100000, mapping: {} },
  { id: 'c3', title: 'Who decides on the budget', create_time: 1727200000, mapping: {} },
], null, 2));
fs.copyFileSync(path.join(REPO, 'dex.md'), path.join(sandbox, 'dex.md'));

const results = [];
const node = (args, opts = {}) => spawnSync(process.execPath, args, { cwd: sandbox, encoding: 'utf8', timeout: 120000, ...opts });
const git = (...a) => spawnSync('git', a, { cwd: sandbox, encoding: 'utf8', timeout: 120000 });
const vault = (...a) => node([path.join('dex-vault', '.dex', 'vault.mjs'), ...a]);
const step = (name, fn) => {
  let r; try { r = fn(); } catch (e) { r = { pass: false, detail: 'threw: ' + e.message }; }
  results.push({ name, pass: !!r.pass, detail: String(r.detail ?? '').slice(0, 400) });
  console.log((r.pass ? 'PASS ' : 'FAIL ') + name + (r.pass ? '' : '  <- ' + String(r.detail ?? '').slice(0, 200)));
};
const J = (s) => { try { return JSON.parse(s); } catch { return null; } };

// 2. read the short dex.md as an agent would, then make the pinned clone it names and install
const md = fs.readFileSync(path.join(sandbox, 'dex.md'), 'utf8').replace(/\r\n/g, '\n');
const lines = md.split('\n').length;
step('dex.md is short (300 lines or fewer) and carries no packed assets', () => ({ pass: lines <= 300 && !md.includes('DEX:UNPACK'), detail: `${lines} lines, ${Math.round(md.length / 1024)} KB` }));
step('dex.md checks GitHub sign-in before any clone and says how to sign in', () => ({ pass: /gh auth status/.test(md) && /gh auth login/.test(md) && md.indexOf('gh auth status') < md.indexOf('git clone') }));
const m = /git clone --depth 1 --branch (v\d+\.\d+\.\d+) https:\/\/github\.com\/Dex-RoboKnix\/dex-md dex-vault\/\.dex\/dex-md/.exec(md);
step('dex.md pins the dex-md clone to a release tag, shallow, into dex-vault/.dex/dex-md', () => ({ pass: !!m, detail: m ? m[1] : 'no pinned clone command' }));
step('dex.md section 3 pins ShadowOS to a vX.Y.Z tag with a shallow clone command', () => { const x = /git clone --depth 1 --branch (v\d+\.\d+\.\d+) https:\/\/github\.com\/Dex-RoboKnix\/shadowos dex-vault\/\.shadowos\/src/.exec(md); return { pass: !!x, detail: x ? x[1] : 'no pinned ShadowOS clone' }; });
step('every git clone in dex.md uses a tag or a 40-hex ref, never a branch', () => {
  const bad = [];
  for (const line of md.split('\n')) for (const c of line.matchAll(/git clone ([^`|]*)/g)) {
    const b = /--branch (\S+)/.exec(c[1]);
    if (b) { if (!/^v\d+\.\d+\.\d+$/.test(b[1])) bad.push(c[1]); }
    else if (!/checkout [0-9a-f]{40}/.test(line)) bad.push(c[1]);
  }
  return { pass: bad.length === 0, detail: bad.join(' ; ') };
});
fs.mkdirSync(path.join(sandbox, 'dex-vault', '.dex'), { recursive: true });
step('the pinned clone succeeds at that tag', () => { const r = git('clone', '--depth', '1', '--branch', m[1], remote, path.join('dex-vault', '.dex', 'dex-md')); return { pass: r.status === 0, detail: (r.stderr || r.stdout).trim() }; });
const SKILLS = ['dex-grill', 'dex-spec', 'dex-implement', 'dex-review', 'dex-checkpoint', 'dex-loop', 'dex-sprint'];
step('install says it installed 14 files', () => { const r = node([path.join('dex-vault', '.dex', 'dex-md', 'engine', 'install.mjs')]); return { pass: /Installed 14 files/.test(r.stdout), detail: r.stdout + r.stderr }; });
step('installed tool files exist (vault, lib, builders, template, CLAUDE template, promote template, seven skills)', () => {
  const need = ['vault.mjs', 'dex-lib.mjs', 'build_folio.mjs', 'build_folio.py', 'dex-folio.template.html', 'dex-claude.md', 'promote-issue.md', ...SKILLS.map((s) => `skills/${s}.md`)];
  const missing = need.filter((f) => !fs.existsSync(path.join(sandbox, 'dex-vault', '.dex', f)));
  return { pass: missing.length === 0, detail: missing.join(', ') || `all ${need.length} present` };
});
step('skill files install with their frontmatter intact', () => {
  const bad = SKILLS.filter((s) => !new RegExp(`^---\\r?\\nname: ${s}\\r?\\n`).test(fs.readFileSync(path.join(sandbox, 'dex-vault', '.dex', 'skills', s + '.md'), 'utf8')));
  return { pass: bad.length === 0, detail: bad.join(', ') || 'seven skills ok' };
});

// 3. the vault tool
step('modules lists every bundled module the clone ships (100 or more)', () => {
  const r = vault('modules');
  const n = r.stdout.trim().split('\n').filter(Boolean).length;
  const shipped = J(fs.readFileSync(path.join(sandbox, 'dex-vault', '.dex', 'dex-md', 'engine', 'modules.json'), 'utf8'));
  return { pass: n >= 100 && Array.isArray(shipped) && n === shipped.length, detail: `${n} listed, ${shipped ? shipped.length : '?'} shipped` };
});
step('classify: shed + chat export is blank-with-context, .env listed as a secret, nothing opened', () => {
  const o = J(vault('classify').stdout);
  const kind = o && o.classification && (o.classification.state || o.classification.classification || o.classification.kind);
  return { pass: !!o && /blank-with-context/.test(JSON.stringify(o.classification)) && /\.env/.test(JSON.stringify(o.secrets)), detail: JSON.stringify(o && o.classification).slice(0, 220) };
});
step('p2/folder-classify: .git or .scratch means in-flight, in-flight wins', () => {
  const r = J(vault('run', 'p2/folder-classify', '--json', JSON.stringify({ files: ['README.md', '.git/', 'notes.txt'] })).stdout);
  return { pass: !!r && r.ok && /in-flight/.test(JSON.stringify(r)), detail: JSON.stringify(r).slice(0, 200) };
});
step('p2/pin-ref accepts the pinned 40-hex commit and rejects a branch name', () => {
  const ref = (md.match(/\| `([0-9a-f]{40})` \| `dex-vault\/\.dex\/dexspine\/` \|/) || [])[1];
  const ok = J(vault('run', 'p2/pin-ref', '--json', JSON.stringify({ ref })).stdout);
  const bad = vault('run', 'p2/pin-ref', '--json', JSON.stringify({ ref: 'main' }));
  return { pass: !!ref && ok && ok.ok === true && bad.status === 1, detail: `ref ${ref}; branch status ${bad.status}` };
});
step('scaffold makes 114 node folders', () => { const r = vault('scaffold', '--title', 'Garden shed'); return { pass: /114 nodes/.test(r.stdout), detail: r.stdout.trim().slice(0, 160) }; });
step('place copies README into L1.P01 with a source .md', () => {
  const r = vault('place', 'README.md', '--node', 'L1.P01', '--id', 'S001');
  const dir = path.join(sandbox, 'dex-vault', '03_spine', 'L1_values', 'plan', 'P01_definition', 'sources');
  return { pass: r.status === 0 && fs.existsSync(path.join(dir, 'README.md')) && fs.existsSync(path.join(dir, 'README.md.md')), detail: r.stdout.trim().slice(0, 200) + r.stderr.slice(0, 120) };
});
step('place LISTS .env and never copies it', () => {
  const r = vault('place', '.env', '--node', 'L3.P07', '--id', 'S002');
  const dir = path.join(sandbox, 'dex-vault', '03_spine', 'L3_policy', 'plan', 'P07_constraints', 'sources');
  const copied = fs.existsSync(path.join(dir, '.env'));
  const note = fs.existsSync(path.join(dir, '.env.md')) ? fs.readFileSync(path.join(dir, '.env.md'), 'utf8') : '';
  return { pass: !copied && /copied:\s*false/.test(note), detail: `copied=${copied}; note has copied:false=${/copied:\s*false/.test(note)}` };
});
step('the chat export is detected by p2/chat-export-detect', () => {
  const r = J(vault('run', 'p2/chat-export-detect', '--json', JSON.stringify({ files: fs.readdirSync(sandbox) })).stdout);
  return { pass: !!r && r.ok && /openai|conversations/i.test(JSON.stringify(r)), detail: JSON.stringify(r).slice(0, 220) };
});
step('conversations are split by p2/export-split', () => {
  const conv = JSON.parse(fs.readFileSync(path.join(sandbox, 'conversations.json'), 'utf8'));
  const r = J(vault('run', 'p2/export-split', '--json', JSON.stringify({ conversations: conv, exportType: 'openai' })).stdout);
  return { pass: !!r && r.ok === true, detail: JSON.stringify(r).slice(0, 260) };
});
step('fold writes the six flat layer files', () => { const r = vault('fold'); const n = fs.readdirSync(path.join(sandbox, 'dex-vault', '03_spine')).filter((f) => /^L\d_.*\.md$/.test(f)).length; return { pass: r.status === 0 && n === 6, detail: `${n} layer files` }; });
step('check passes on the scaffolded vault', () => { const r = vault('check'); return { pass: r.status === 0 && /OK:/.test(r.stdout), detail: r.stdout.trim().slice(-200) }; });

// 4. checkpoints
fs.writeFileSync(path.join(sandbox, 'dex-vault', '08_story.md'), '---\ntype: story\n---\n# The story\n\n### 2026-10-01\n\nThe shed was a plan.\n');
const states = path.join(sandbox, 'dex-vault', '03_spine', 'L1_values', 'plan', 'P01_definition', 'contextual.md');
step('checkpoint 1 (baseline) writes RUNLOG row 1, a story chapter and passes the vault check', () => {
  const r = vault('checkpoint', '--skill', 'dex-grill', '--summary', 'baseline', '--now', '2026-10-09T10:00:00Z');
  const rl = fs.readFileSync(path.join(sandbox, 'dex-vault', 'RUNLOG.md'), 'utf8');
  const st = fs.readFileSync(path.join(sandbox, 'dex-vault', '08_story.md'), 'utf8');
  return { pass: r.status === 0 && /\| 1 \| 2026-10-09 \| checkpoint/.test(rl) && /### 2026-10-09/.test(st) && /The shed was a plan\./.test(st), detail: r.stdout.trim().split('\n').slice(0, 5).join(' / ') + r.stderr.slice(0, 160) };
});
// the human's answer lands: node L1.P01 moves from N to C (done by editing the node file, as an agent would after the human's yes)
let ctx = fs.readFileSync(states, 'utf8');
step('node L1.P01 can be moved N to C and the state change is logged at the next checkpoint', () => {
  fs.writeFileSync(states, ctx.replace(/^state:\s*N\s*$/m, 'state: C'));
  const r = vault('checkpoint', '--skill', 'dex-spec', '--summary', 'one node answered', '--now', '2026-10-10T10:00:00Z');
  const rl = fs.readFileSync(path.join(sandbox, 'dex-vault', 'RUNLOG.md'), 'utf8');
  const ch = fs.existsSync(path.join(sandbox, 'dex-vault', '06_journal', 'changes.md')) ? fs.readFileSync(path.join(sandbox, 'dex-vault', '06_journal', 'changes.md'), 'utf8') : '';
  return { pass: r.status === 0 && /\| 2 \| 2026-10-10 \|/.test(rl) && /L1\.P01 \| N \| C/.test(ch), detail: r.stdout.trim().split('\n').slice(0, 3).join(' / ') + ' | changes: ' + ch.split('\n').slice(-2).join(' ') };
});
step('coverage is reported and a single covered node out of 113 is far below the 90% bar (ask the human)', () => {
  const r = vault('checkpoint', '--skill', 'dex-review', '--summary', 'third', '--now', '2026-10-11T10:00:00Z');
  return { pass: r.status === 0 && /Coverage: [0-9.]+%/.test(r.stdout) && /mode: ask/.test(r.stdout), detail: r.stdout.split('\n').find((l) => /Coverage/.test(l)) || r.stdout.slice(0, 160) };
});
step('a checkpoint on the same date a second time does not rewrite or duplicate the chapter', () => {
  const before = fs.readFileSync(path.join(sandbox, 'dex-vault', '08_story.md'), 'utf8');
  const r = vault('checkpoint', '--skill', 'dex-review', '--summary', 'same day again', '--now', '2026-10-11T18:00:00Z');
  const after = fs.readFileSync(path.join(sandbox, 'dex-vault', '08_story.md'), 'utf8');
  const count = (after.match(/### 2026-10-11/g) || []).length;
  return { pass: r.status === 0 && after.startsWith(before.trimEnd()) && count === 1, detail: `chapters for 2026-10-11: ${count}; story note: ${(r.stdout.match(/Story: .*/) || [''])[0]}` };
});
step('RUNLOG has 4 rows numbered 1 to 4 with no reuse', () => {
  const rl = fs.readFileSync(path.join(sandbox, 'dex-vault', 'RUNLOG.md'), 'utf8');
  const nums = [...rl.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((x) => Number(x[1]));
  return { pass: JSON.stringify(nums) === '[1,2,3,4]', detail: JSON.stringify(nums) };
});
step('checkpoint refuses to apply a node change by itself (node file untouched by the tool)', () => {
  const before = fs.readFileSync(states, 'utf8');
  vault('checkpoint', '--skill', 'dex-grill', '--summary', 'no-op', '--now', '2026-10-12T10:00:00Z');
  return { pass: fs.readFileSync(states, 'utf8') === before, detail: 'node file unchanged by checkpoint' };
});
step('a node-change proposal without the human yes is refused', () => {
  const r = vault('run', 'p1/node-change-proposal', '--json', JSON.stringify({ node: 'L1.P01', change: { state: 'C' }, human: { yes: false } }));
  return { pass: r.status === 1 || /"ok": false/.test(r.stdout), detail: r.stdout.replace(/\s+/g, ' ').slice(0, 200) };
});

// 5. the Folio
step('the Folio builds from the vault', () => {
  const r = node([path.join('dex-vault', '.dex', 'build_folio.mjs')]);
  const f = path.join(sandbox, 'dex-vault', 'dex-folio.html');
  return { pass: r.status === 0 && fs.existsSync(f) && fs.statSync(f).size > 100000, detail: (r.stdout + r.stderr).trim().slice(0, 200) + ` | ${fs.existsSync(f) ? fs.statSync(f).size : 0} bytes` };
});
// 6. a late answer: park a question on an issue, a comment arrives on GitHub (stubbed), the next run resumes it
const ghDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dex-drive-gh-'));
fs.writeFileSync(path.join(ghDir, 'gh.mjs'), [
  "const a = process.argv.slice(2);",
  "if (a[0] === 'api' && a[1] === 'user') { console.log('owner'); process.exit(0); }",
  "if (a[0] === 'issue' && a[1] === 'view') { console.log(JSON.stringify({ comments: [",
  "  { id: 'IC_1', url: 'https://github.com/acme/shed/issues/7#issuecomment-901', author: { login: 'owner' }, body: 'timber, not steel', createdAt: '2026-11-17T12:00:00Z' },",
  "  { id: 'IC_2', url: 'https://github.com/acme/shed/issues/7#issuecomment-902', author: { login: 'someone' }, body: 'steel!', createdAt: '2026-11-17T12:05:00Z' },",
  "] })); process.exit(0); }",
  "process.exit(1);",
].join('\n'));
const late = (...a) => node([path.join('dex-vault', '.dex', 'vault.mjs'), ...a], { env: { ...process.env, DEX_GH: path.join(ghDir, 'gh.mjs') } });
step('park holds a question on an issue as a tracked file with a DEX838 line', () => {
  const r = late('park', '--skill', 'dex-grill', '--issue', '7', '--repo', 'acme/shed', '--question', 'Timber or steel frame?', '--now', '2026-11-17T10:00:00.000Z');
  const f = path.join(sandbox, 'dex-vault', '07_inbox', 'held', 'dex-grill-7.md');
  return { pass: r.status === 0 && fs.existsSync(f) && /^dex\(dex-grill, @issue:7,held:dex-grill-7,repo:acme\/shed\)\["Timber or steel frame\?"\]$/m.test(fs.readFileSync(f, 'utf8')), detail: r.stdout + r.stderr };
});
step('inbox turns the owner\'s comment into one event and lists the other account', () => {
  const r = late('inbox');
  const ev = path.join(sandbox, 'dex-vault', '07_inbox', 'events');
  const files = fs.existsSync(ev) ? fs.readdirSync(ev) : [];
  return { pass: r.status === 0 && files.join() === '901.md' && /1 comment\(s\) by other accounts \(someone\)/.test(r.stdout), detail: r.stdout + r.stderr };
});
step('resume shows the answer under its held question', () => {
  const r = late('resume');
  return { pass: r.status === 0 && /Question: Timber or steel frame\?\n {2}Answered on GitHub by owner \(comment 901, [^)]+\): timber, not steel/.test(r.stdout), detail: r.stdout + r.stderr };
});
step('answer records it twice in the journal and says where to resume', () => {
  const r = late('answer', '--event', '901', '--checked', 'Timber, not steel.');
  const dir = path.join(sandbox, 'dex-vault', '06_journal', 'answers');
  const j = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /dex-grill/.test(f)).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n') : '';
  return { pass: r.status === 0 && /Resume dex-grill #7 at: Timber or steel frame\?/.test(r.stdout) && /source: GitHub comment 901 /.test(j) && /```text\ntimber, not steel\n```/.test(j) && /## Checked copy\nTimber, not steel\./.test(j), detail: r.stdout + r.stderr };
});
step('the next session start resumes nothing', () => {
  const i = late('inbox');
  const r = late('resume');
  return { pass: i.status === 0 && r.status === 0 && r.stdout.trim() === 'nothing held', detail: i.stdout + r.stdout + r.stderr };
});
fs.rmSync(ghDir, { recursive: true, force: true });

step('the original shed files are untouched (read only)', () => {
  const same = fs.readdirSync(shed).every((f) => fs.readFileSync(path.join(shed, f), 'utf8') === fs.readFileSync(path.join(sandbox, f), 'utf8'));
  return { pass: same, detail: 'README.md, notes.txt, materials.csv identical to the fixture shed' };
});
step('the final vault check passes', () => { const r = vault('check'); return { pass: r.status === 0, detail: r.stdout.trim().slice(-160) }; });

const pass = results.filter((r) => r.pass).length;
const out = { date: new Date().toISOString(), sandbox, total: results.length, pass, results };
fs.writeFileSync(path.join(sandbox, 'testdrive-results.json'), JSON.stringify(out, null, 2));
console.log(`\n${pass}/${results.length} steps passed`);
process.exitCode = pass === results.length ? 0 : 2;
