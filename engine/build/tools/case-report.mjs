#!/usr/bin/env node
// Generates CASE-REPORT.html from the real gate runs and testdrive-results.json.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const names = { 1: 'Checkpoint mechanics', 2: 'Installer', 3: 'Stage skills', 4: 'Loop and escalation', 5: 'Test drive and timeline' };

const gates = [1, 2, 3, 4, 5].map((p) => {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'gate.mjs'), String(p), 'T01', 'T20'], { encoding: 'utf8', cwd: ROOT });
  const m = /modules ok (\d+)\/(\d+); tests pass (\d+), fail (\d+)/.exec(r.stdout) || [];
  return { p, modules: +m[1], of: +m[2], pass: +m[3], fail: +m[4], out: r.stdout.trim() };
});
const td = JSON.parse(fs.readFileSync(path.join(ROOT, 'testdrive-results.json'), 'utf8'));
const verdict = (p) => (fs.readFileSync(path.join(ROOT, 'reviews', `p${p}.md`), 'utf8').match(/VERDICT: (\w+)/) || [])[1] || '?';
const totalTests = gates.reduce((a, g) => a + g.pass, 0);
const md = fs.statSync(path.join(ROOT, 'dex.md')).size;
const pin = (fs.readFileSync(path.join(ROOT, 'dex.md'), 'utf8').match(/\| Ref \(a full commit hash, never a branch\) \| `([0-9a-f]{40})`/) || [])[1];

const dispositions = [
  ['1', 'FAIL', '1 blocker', 'Real. id-allocator had no audit record, and its test named for the audit only checked the trace. A sweep then showed 14 modules with acceptance items that ask for a log, audit, sidecar or timestamp. Fixed by one Haiku fix round using a new rule: modules stay pure and RETURN audit and effects.'],
  ['2', 'FAIL', '1 blocker', 'Real. vault-recommend ignored the legacy mof folder and the human choice, and its test of the legacy case never passed a legacy folder. Rewritten with real tests (10).'],
  ['3', 'PASS', '2 minor', 'Both rejected on checking: the log format is what the spec asks for, and the second claim could not be confirmed.'],
  ['4', 'FAIL', '5 blockers', 'One real: escalate-model had no composition audit, outcome record or context list. Fixed by hand with 9 tests. Three were over-literal (a value that is returned counts as reported). One was wrong (fail-classify already returns an audit).'],
  ['5', 'FAIL', '4 blockers', 'One real: the timeline sort test sorted an array in the test and never called the module. Replaced by tests of a sort key, the missing-hash flag and the audit record. Three over-literal items are listed under known gaps.'],
];
const gaps = [
  'dex.md has not been run by an LLM agent from start to finish. The test drive follows the same commands mechanically; it does not show that a model reads and follows the instructions well. That is your test.',
  'Only the sandbox layout (a dex-vault folder) is supported by the Folio builder. A vault that is the parent folder itself is not supported yet, and the instructions say so.',
  'The Python Folio builder was renamed in step with the JavaScript one but could not be run: this machine has no Python.',
  'Of the 100 modules, checkpoint wires 5 (coverage, threshold, ID allocation, RUNLOG row, story chapter) and classify wires 2. The rest are callable with "run" and named in the instructions, but not composed into a flow by code.',
  'catch-up-ingest returns a count of skipped entries but no per-entry audit; signoff-record and phase-gate do not return a file effect for the sign-off. work-log returns the entry, not a persisted log.',
  'The Haiku reviewers missed a vacuous test twice and over-called items three times. Every finding was checked against the code before action. A cheap marker check for vacuous tests was added to the gate; it cannot catch every case.',
  'The five skills are prototypes copied from the loop test. dex-grill is the one that has been used for real.',
  `The pinned DexSpine ref (${pin ? pin.slice(0, 12) : 'unset'}) was on origin/main in the local clone when packed; it was not re-checked against the remote.`,
  'Haiku 5.5 was not reachable from this harness. Every build agent reported claude-haiku-4-5.',
  'Grill answers behind the spec were simulated by a labelled respondent. They are proposals for you to confirm.',
];

const html = `<title>dex.md Build Case Report</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
:root{--bg:#f6f8fa;--surface:#fff;--fg:#1c2530;--muted:#5a6776;--line:#d9e0e7;--accent:#0f6b73;--ok:#1a7f4b;--bad:#b3261e;--warn:#8a5a00;--tag:#e3ebf0;--sans:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:'IBM Plex Mono',ui-monospace,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0f151b;--surface:#161e26;--fg:#e3e9ee;--muted:#98a5b3;--line:#2a3541;--accent:#5fc1c9;--ok:#5fcf93;--bad:#ff8f87;--warn:#e6b450;--tag:#243340;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0f151b;--surface:#161e26;--fg:#e3e9ee;--muted:#98a5b3;--line:#2a3541;--accent:#5fc1c9;--ok:#5fcf93;--bad:#ff8f87;--warn:#e6b450;--tag:#243340;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:15px;line-height:1.6}
main{max-width:920px;margin:0 auto;padding:24px 16px 64px;min-width:0}
h1{font-size:1.8rem;margin:0 0 6px;text-wrap:balance}h2{font-size:1.25rem;margin:36px 0 8px;padding-top:14px;border-top:1px solid var(--line)}
.sub{color:var(--muted);margin:0 0 20px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:16px 0}
.stat{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:10px 12px;min-width:0}
.stat b{display:block;font-size:1.5rem;font-variant-numeric:tabular-nums}.stat span{color:var(--muted);font-size:12px;letter-spacing:.04em;text-transform:uppercase}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:6px;background:var(--surface);margin:10px 0}
table{border-collapse:collapse;width:100%;font-size:13.5px}th,td{text-align:left;vertical-align:top;padding:7px 10px;border-bottom:1px solid var(--line)}th{background:var(--tag);white-space:nowrap}tr:last-child td{border-bottom:0}
td.n{font-variant-numeric:tabular-nums;white-space:nowrap}
.pass{color:var(--ok);font-weight:600}.fail{color:var(--bad);font-weight:600}
code{font-family:var(--mono);font-size:.86em;background:var(--tag);padding:1px 5px;border-radius:3px;overflow-wrap:anywhere}
.det{color:var(--muted);font-size:12.5px;font-family:var(--mono);overflow-wrap:anywhere}
ul{padding-left:22px}li{margin:4px 0;max-width:80ch}
</style>
<main>
<h1>dex.md build: case report</h1>
<p class="sub">Issue #77, Dex-RoboKnix/dexroboknix. Built by the dex loop (spec, implement, review), one Haiku team at a time, checked by a mechanical gate. Generated ${new Date().toISOString().slice(0, 10)} from real runs.</p>

<div class="stats">
<div class="stat"><b>${gates.reduce((a, g) => a + g.modules, 0)}</b><span>modules built and gated</span></div>
<div class="stat"><b>${totalTests}</b><span>tests passing</span></div>
<div class="stat"><b>${td.pass}/${td.total}</b><span>test-drive steps</span></div>
<div class="stat"><b>${Math.round(md / 1024)} KB</b><span>dex.md, one file</span></div>
<div class="stat"><b>~85</b><span>agent runs in all (83 Haiku, 2 Sonnet), of which 20 built and reviewed these modules</span></div>
</div>

<h2>What was built</h2>
<p><code>dex.md</code> is one universal installer file: instructions an agent follows, plus eleven packed files it unpacks into <code>dex-vault/.dex/</code>: the vault tool (<code>vault.mjs</code>, with new <code>checkpoint</code>, <code>classify</code>, <code>run</code> and <code>modules</code> commands), <code>dex-lib.mjs</code> (the 100 gated modules), the two Folio builders and template, a <code>CLAUDE.md</code> template and the five dex skills. It holds nothing about any one matter; the slant comes from the folder it lands in. It was built from the 0.8 MoF baseline, which was copied and left untouched.</p>

<h2>The gate, phase by phase</h2>
<p>Each Haiku run had to pass a gate before the next started: files exist, a lint (no network, shell, env, eval or file writes), robustness probes (<code>run</code> must return <code>{ok:false}</code> on junk and never throw), a marker check for vacuous tests, and the node:test suite. A Reviewer then read each phase against its spec.</p>
<div class="tw"><table><thead><tr><th>Phase</th><th>Modules</th><th>Tests</th><th>Review verdict</th></tr></thead><tbody>
${gates.map((g) => `<tr><td>${g.p}. ${esc(names[g.p])}</td><td class="n">${g.modules}/${g.of}</td><td class="n">${g.pass} pass, ${g.fail} fail</td><td class="${verdict(g.p) === 'PASS' ? 'pass' : 'fail'}">${esc(verdict(g.p))} (first review; fixed below)</td></tr>`).join('')}
</tbody></table></div>

<h2>What the reviews found, and what was done</h2>
<p>Reviewer verdicts are advisory. Each finding was checked against the code before anything changed. Real defects were fixed; over-literal or wrong findings were rejected and are not hidden.</p>
<div class="tw"><table><thead><tr><th>Phase</th><th>Verdict</th><th>Found</th><th>Disposition</th></tr></thead><tbody>
${dispositions.map((d) => `<tr><td class="n">${d[0]}</td><td class="${d[1] === 'PASS' ? 'pass' : 'fail'}">${d[1]}</td><td>${esc(d[2])}</td><td>${esc(d[3])}</td></tr>`).join('')}
</tbody></table></div>

<h2>Test drive: following dex.md's own instructions</h2>
<p>A sandbox copy of the test shed (README, notes, a materials list and a fake <code>.env</code>) plus a three-conversation chat-export fixture. The script takes the unpack script out of the shipped <code>dex.md</code> exactly as an agent would, then runs the vault tool. The first run passed 20 of 26 steps. It exposed two product bugs (the ID allocator started at 0, so the first RUNLOG row was numbered 0; two checkpoints on one day wrote two story chapters) and two bugs in the test itself. After the fixes a fresh sandbox passes ${td.pass} of ${td.total}.</p>
<div class="tw"><table><thead><tr><th>#</th><th>Step</th><th>Result</th><th>Evidence</th></tr></thead><tbody>
${td.results.map((r, i) => `<tr><td class="n">${i + 1}</td><td>${esc(r.name)}</td><td class="${r.pass ? 'pass' : 'fail'}">${r.pass ? 'PASS' : 'FAIL'}</td><td class="det">${esc(r.detail)}</td></tr>`).join('')}
</tbody></table></div>

<h2>Known gaps and limits</h2>
<ul>${gaps.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>

<h2>Where things are</h2>
<ul>
<li><code>dex-md/dex.md</code>: the installer (also copied to the Desktop folder <code>dex-md</code> with a start file).</li>
<li><code>dex-md/lib</code>, <code>test</code>, <code>spec-in</code>, <code>reviews</code>: the 100 modules, their tests, the spec each was built from and the review of each phase.</li>
<li><code>dex-md/tools</code>: <code>gate.mjs</code>, <code>bundle.mjs</code>, <code>make-*.mjs</code>, <code>testdrive.mjs</code>. Rebuild with: <code>node tools/bundle.mjs; node tools/make-vault.mjs; node tools/make-builders.mjs; node pack.mjs</code>.</li>
<li><code>dex-md/spec.md</code>: the 500-task spec this was built from. Its follow-up issues (the legal-material test and others) are drafts in <code>.scratch/prototype-dex-loop/FOLLOWUPS.md</code>; nothing has been filed.</li>
</ul>
</main>
`;
fs.writeFileSync(path.join(ROOT, 'CASE-REPORT.html'), html);
console.log('wrote CASE-REPORT.html', html.length, 'bytes; tests', totalTests, 'testdrive', td.pass + '/' + td.total);
