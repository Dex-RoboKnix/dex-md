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

// 0.11.0: what the first user test taught. Each test names the rule or lesson it holds the text to.
const METHOD = () => fs.readdirSync(path.join(ROOT, 'method')).map((f) => `method/${f}`);
const SHIPPED = () => ['dex.md', 'templates/dex-claude.md', ...SKILLS.map((s) => `skills/${s}.md`), ...METHOD()];

test('no SK skill library: SK- appears only where the method describes the older system to sort or convert', () => {
  for (const f of SHIPPED()) {
    const lines = read(f).split('\n').filter((l) => /SK-/.test(l));
    for (const l of lines) assert.match(l, /SK skill library|name `SK-` skills|without skill IDs/, `${f}: ${l.slice(0, 80)}`);
  }
  assert.ok(!fs.existsSync(path.join(ROOT, 'method/05-skill-library.md')), 'the skill library file is gone');
  const angles = read('method/05-question-angles.md');
  for (const r of ['`dex-grill`', '`task`', '`research`', '`dex-spec`']) assert.ok(angles.includes(r), `route ${r}`);
});

test('no "five skills" left in dex.md, the method, the skills or the docs', () => {
  const docs = fs.readdirSync(path.join(ROOT, 'docs'), { recursive: true }).filter((f) => f.endsWith('.md')).map((f) => `docs/${f.replace(/\\/g, '/')}`);
  for (const f of [...SHIPPED(), ...docs]) assert.doesNotMatch(read(f), /five (suggested )?skills|first five skills/i, f);
});

test('Step 1 sorts older versions and other systems by asking (dex.md and method 03)', () => {
  assert.match(read('dex.md'), /3\. \*\*Sort what is here, then grill the gaps\.\*\*[^\n]*what to keep, what goes where and what to archive/);
  const s3 = read('method/03-first-run.md');
  assert.match(s3, /### Stage 3\. Sort what is here, then grill the gaps/);
  assert.match(s3, /\*\*Keep as material:\*\*[\s\S]*\*\*Bring it in:\*\*[\s\S]*\*\*Archive:\*\*[\s\S]*\*\*Leave out:\*\*/);
  assert.match(s3, /never done by Dex: it becomes one clean-up issue/, 'rule 16: the owner\'s files are never moved by Dex');
});

test('the upgrade backfills what each newer version added (02b section 0, dex.md section 2)', () => {
  const w = read('method/02b-existing-vault.md');
  assert.ok(w.indexOf('### 0. Upgrade') >= 0 && w.indexOf('### 0. Upgrade') < w.indexOf('### The walk'), 'section 0 comes before the walk');
  for (const v of ['| 0.9 |', '| 0.10 |', '| 0.10.1 |', '| 0.11.0 |']) assert.ok(w.includes(v), `delta row ${v}`);
  assert.match(w, /scaffold`? \(it adds missing sections and never changes a line already written\)/);
  assert.match(read('dex.md'), /the walk starts with the \*\*upgrade\*\* \(02b section 0\)/);
});

test('Needs and Wants are saved on the rung\'s hu node, in every place that says where', () => {
  for (const f of ['dex.md', 'method/03-first-run.md', 'docs/slant-flow.md', 'method/07-vault-format.md']) assert.match(read(f), /`hu` node[^.]*L4\.hu/, f);
});

test('rules 12, 18 and 20 hold in the method text', () => {
  const angles = read('method/05-question-angles.md');
  assert.doesNotMatch(angles, /word for word into the node/, 'rule 12: the node gets the spelling-checked copy');
  assert.match(angles, /Apply them only on the human's yes \(rule 18\)/);
  const s3 = read('method/03-first-run.md');
  assert.doesNotMatch(s3, /dex-reviewer|p3\/subagent-plan|\| Subagent \|/, 'rule 20: Stage 4b proposes no subagent');
});

test('method 03 Stage 4 step 4 is the claims step, and the file formats live in 07', () => {
  const s3 = read('method/03-first-run.md');
  assert.match(s3, /\n4\. \*\*Claims\.\*\* Write `04_claims\/ledger\.md`: one statement per row/);
  assert.doesNotMatch(s3, /`HANDOFF\.md` \(written once at the end of Stage 4/, 'the HANDOFF template is not inside a stage step');
  const f7 = read('method/07-vault-format.md');
  assert.match(f7, /`HANDOFF\.md` \(written once at the end of Stage 4/);
  assert.match(f7, /`next` is `<route>: <one specific question or action>` or `-`/);
});

test('one action Status set and one Next form, in 07, read by the audit', () => {
  const f7 = read('method/07-vault-format.md');
  assert.match(f7, /`proposed`, `open`, `doing`, `done`, `parked`, `dropped`/);
  const tool = read('engine/build/src/vault-additions.js');
  assert.match(tool, /const STATUSES = \['proposed', 'open', 'doing', 'done', 'parked', 'dropped'\];/);
  assert.match(tool, /const ROUTES = \['dex-grill', 'task', 'research', 'dex-spec'\];/);
});

test('rule 3 names the owner\'s own inbox as an exception, the same way in dex.md and method 01', () => {
  for (const f of ['dex.md', 'method/01-rules.md']) assert.match(read(f), /\*\*The owner's own inbox\.\*\* On the owner's request, each time, a draft may be emailed to the owner's own address and nowhere else[^\n]*Record each send in `RUNLOG\.md` with the message id/, f);
});

test('document mode is in dex.md, 03b, dex-implement and dex-review, with the same machine check', () => {
  for (const f of ['dex.md', 'method/03b-skills-loop.md', 'skills/dex-implement.md', 'skills/dex-review.md']) {
    const t = read(f);
    assert.match(t, /document mode/i, f);
    assert.match(t, /audit --output <file>/, f);
  }
});
