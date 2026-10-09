#!/usr/bin/env node
// Gate for builder runs: node tools/gate.mjs <phase> [fromKey toKey]   e.g. gate.mjs 1 T01 T10
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [phase, from = 'T01', to = 'T20'] = process.argv.slice(2);
if (!phase) { console.log('usage: gate.mjs <phase> [fromKey toKey]'); process.exit(1); }
const spec = fs.readFileSync(path.join(ROOT, 'spec-in', `p${phase}.md`), 'utf8');
const themes = [...spec.matchAll(/^## (T\d\d) (\S+) \[([^\]]+)\]/gm)].map((m) => ({ key: m[1], slug: m[2], node: m[3] }))
  .filter((t) => t.key >= from && t.key <= to);

const LINT = [
  [/\bimport\s+[^'"]*from\s+['"](?!node:|\.\/|\.\.\/)/, 'foreign-import'],
  [/\brequire\s*\(/, 'require'],
  [/child_process|\bspawn(Sync)?\s*\(|execSync|\bexecFile/, 'shell'],
  [/\bfetch\s*\(|node:net|node:http|XMLHttpRequest/, 'network'],
  [/process\.env/, 'env'],
  [/\beval\s*\(|new Function\s*\(/, 'eval'],
  [/writeFile|appendFile|unlinkSync|rmSync|mkdirSync/, 'fs-write'],
];
const probes = [undefined, null, 123, '', [], {}, 'x'.repeat(10)];
const fails = []; let pass = 0; const testFiles = [];

for (const t of themes) {
  const lib = path.join(ROOT, 'lib', `p${phase}`, `${t.slug}.mjs`);
  const test = path.join(ROOT, 'test', `p${phase}`, `${t.slug}.test.mjs`);
  const errs = [];
  if (!fs.existsSync(lib)) errs.push('lib missing');
  if (!fs.existsSync(test)) errs.push('test missing'); else { testFiles.push(test); const ts = fs.readFileSync(test, 'utf8'); if (/(would happen separately|at a higher level|not tested here|placeholder test|TODO|validates current state|handled elsewhere)/i.test(ts)) errs.push('vacuous-test marker in test file'); }
  if (fs.existsSync(lib)) {
    const src = fs.readFileSync(lib, 'utf8');
    for (const [re, name] of LINT) if (re.test(src)) errs.push('lint:' + name);
    if (!/export\s+(async\s+)?function\s+run\b|export\s+const\s+run\b|export\s*\{[^}]*\brun\b/.test(src)) errs.push('no run export');
    if (!/^\/\/ node: /m.test(src)) errs.push('no "// node:" header line');
    if (!/^\/\/ input: /m.test(src)) errs.push('no "// input:" header line');
    try {
      const m = await import(pathToFileURL(lib).href + '?t=' + Date.now());
      if (typeof m.run !== 'function') errs.push('run is not a function');
      else for (const p of probes) {
        let r; try { r = m.run(p); } catch (e) { errs.push(`run(${JSON.stringify(p)}) threw`); continue; }
        if (!r || typeof r !== 'object' || typeof r.ok !== 'boolean') errs.push(`run(${JSON.stringify(p)}) did not return {ok}`);
      }
    } catch (e) { errs.push('import failed: ' + String(e.message).slice(0, 80)); }
  }
  if (errs.length) fails.push(`${t.key} ${t.slug}: ${errs.join('; ')}`); else pass++;
}

let testSummary = 'no tests';
if (testFiles.length) {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...testFiles], { encoding: 'utf8', timeout: 180000, cwd: ROOT });
  const p = /# pass (\d+)/.exec(r.stdout || ''), f = /# fail (\d+)/.exec(r.stdout || '');
  testSummary = `tests pass ${p ? p[1] : 0}, fail ${f ? f[1] : '?'}`;
  if (r.status !== 0) {
    const bad = [...(r.stdout || '').matchAll(/^not ok \d+ - (.*)$/gm)].map((x) => x[1]).slice(0, 12);
    fails.push(`node:test failures: ${bad.join(' | ') || (r.stderr || '').slice(0, 300)}`);
  }
}
console.log(`phase ${phase} ${from}-${to}: modules ok ${pass}/${themes.length}; ${testSummary}`);
fails.forEach((f) => console.log('  FAIL ' + f));
if (fails.length) process.exitCode = 2;
