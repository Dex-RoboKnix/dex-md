import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Checks the workflow text that the agent reads: the seven skills, the why-ladder, the node template and the rules.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const SKILLS = ['dex-grill', 'dex-spec', 'dex-implement', 'dex-review', 'dex-checkpoint', 'dex-loop', 'dex-sprint'];

test('all seven skills are present, named in their frontmatter', () => {
  for (const s of SKILLS) assert.match(read(`skills/${s}.md`), new RegExp(`^---\\nname: ${s}\\n`), s);
});

test('every skill opens with the one-line signal, with its own name and "say park"', () => {
  for (const s of SKILLS) {
    const t = read(`skills/${s}.md`);
    const line = t.split('\n').find((l) => l.startsWith('[<vault> vault] '));
    assert.ok(line, `${s}: no opening line`);
    assert.match(line, /Say park to save a thought for later\.$/, s);
    const name = s === 'dex-sprint' ? 'Sprint:' : `${s} `;
    assert.ok(line.startsWith(`[<vault> vault] ${name}`), `${s}: opening line names "${line}"`);
  }
});

test('no skill, rule or method page describes agent teams', () => {
  const files = ['dex.md', 'templates/dex-claude.md', ...SKILLS.map((s) => `skills/${s}.md`), ...fs.readdirSync(path.join(ROOT, 'method')).map((f) => `method/${f}`)];
  for (const f of files) assert.doesNotMatch(read(f), /Haiku|orchestrator|spec-writers|8 agents|Sonnet team/, f);
});

test('rules read 1 to 21 in order, in dex.md and in method/01-rules.md', () => {
  for (const f of ['dex.md', 'method/01-rules.md']) {
    const nums = read(f).split('\n').filter((l) => /^\d+\. \*\*/.test(l)).map((l) => Number(l.split('.')[0]));
    const rules = nums.slice(nums.indexOf(1), nums.indexOf(21) + 1);
    assert.deepEqual(rules, Array.from({ length: 21 }, (_, i) => i + 1), f);
  }
});

test('the why-ladder has six rungs, Pattern first', () => {
  const rows = read('docs/slant-flow.md').split('\n').filter((l) => /^\| \d \| /.test(l)).map((l) => l.split('|')[2].trim());
  assert.deepEqual(rows, ['Pattern', 'Procedure', 'Process', 'Policy', 'Principles', 'Values']);
  const order = (t, parts, f) => parts.reduce((at, p) => { const i = t.indexOf(p, at); assert.ok(i >= 0, `${f}: "${p}" missing or out of order`); return i; }, 0);
  order(read('dex.md'), ['6 Pattern', '5 Procedure', 'Process, Policy, Principles, Values'], 'dex.md');
  order(read('method/03-first-run.md'), ['6 Pattern', '5 Procedure', '4 Process, 3 Policy, 2 Principles, 1 Values'], 'method/03-first-run.md');
  for (const f of fs.readdirSync(path.join(ROOT, 'docs/use-cases')).filter((f) => /^\d\d-/.test(f))) order(read(`docs/use-cases/${f}`), ['6 Pattern', '5 Procedure'], f);
  assert.match(read('docs/dexspine.md'), /six rungs[^.]*\. You start at Pattern/);
});

test('every node folder gets Needs and Wants after the owner\'s words', () => {
  for (const f of ['engine/vault.mjs', 'engine/build/src/vault.mjs']) {
    assert.match(read(f), /## Owner's words \(verbatim\)\n\$\{owner\}\n\n## Needs\n-\n\n## Wants\n-\n/, f);
  }
});
