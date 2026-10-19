import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

const PARTS = [
  '## 1. What moves and where',
  '## 2. What is replaced',
  '## 3. Backup evidence (checked first)',
  '## 4. The test',
  '## 5. Rollback',
  '## 6. Overview before any push (Layer 8)',
];

test('the promote issue has the six parts, in order', () => {
  const t = read('templates/promote-issue.md');
  const found = t.split('\n').filter((l) => l.startsWith('## '));
  assert.deepEqual(found, PARTS);
});

test('the slant fills only parts 3 and 4', () => {
  const t = read('templates/promote-issue.md');
  const body = t.slice(t.indexOf(PARTS[0]));
  const slots = [...body.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
  assert.deepEqual(slots.filter((s) => s !== 'project'), ['backup', 'test']);
  const part = (i) => body.slice(body.indexOf(PARTS[i]), i + 1 < PARTS.length ? body.indexOf(PARTS[i + 1]) : undefined);
  assert.match(part(2), /\{\{backup\}\}/);
  assert.match(part(3), /\{\{test\}\}/);
  for (const i of [0, 1, 4, 5]) assert.doesNotMatch(part(i), /\{\{(backup|test)\}\}/);
});

test('the test part names the vault check and the owner tick', () => {
  const t = read('templates/promote-issue.md');
  assert.match(t, /vault\.mjs check` passes/);
  assert.match(t, /owner has gone through this plan and says it passed/);
});

test('Stage 8 defines test and live, and points at the template', () => {
  for (const f of ['method/03-first-run.md', 'engine/build/src/instructions.md']) {
    const t = read(f);
    assert.match(t, /\*\*test\*\* vault/, f);
    assert.match(t, /\*\*live\*\*/, f);
    assert.match(t, /promote-issue\.md/, f);
  }
});

test('the installer ships the promote template', () => {
  assert.match(read('engine/install.mjs'), /templates\/promote-issue\.md/);
});
