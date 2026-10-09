import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p1/action-row.mjs';

const validRow = {
  id: 'T19.1',
  node: 'L4.E04',
  kind: 'feature',
  action: 'Implement validation logic',
  skill: 'dex-grill',
  status: 'pending'
};

test('T19.1: Row fields validated and returned', () => {
  const result = run(validRow);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.id, 'T19.1');
  assert.strictEqual(result.node, 'L4.E04');
  assert.strictEqual(result.kind, 'feature');
});

test('T19.2: Node format L#.E## validated', () => {
  const row = { ...validRow, node: 'L1.E05' };
  const result = run(row);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.node, 'L1.E05');
});

test('T19.3: Invalid node format rejected', () => {
  const row = { ...validRow, node: 'INVALID' };
  const result = run(row);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /L#\.E##/);
});

test('T19.4: Action truncated to 80 chars', () => {
  const longAction = 'a'.repeat(120);
  const row = { ...validRow, action: longAction };
  const result = run(row);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.action.length, 80);
  assert.strictEqual(result.actionTruncated, true);
  assert.strictEqual(result.originalActionLength, 120);
});

test('T19.5: Action <= 80 chars not truncated', () => {
  const shortAction = 'Short action text';
  const row = { ...validRow, action: shortAction };
  const result = run(row);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.action, shortAction);
  assert.strictEqual(result.actionTruncated, false);
});

test('T19.6: Skill name stored (registry validation TBD)', () => {
  const row = { ...validRow, skill: 'any-skill-name' };
  const result = run(row);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.skill, 'any-skill-name');
});

test('T19.7: Status pending valid', () => {
  const row = { ...validRow, status: 'pending' };
  const result = run(row);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.status, 'pending');
});

test('T19.8: Status in-progress valid', () => {
  const row = { ...validRow, status: 'in-progress' };
  const result = run(row);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.status, 'in-progress');
});

test('T19.9: Status done marked with completion date', () => {
  const now = '2024-01-15T10:30:00Z';
  const row = { ...validRow, status: 'done', now };
  const result = run(row);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.status, 'done');
  assert.ok(result.completionDate);
  assert.strictEqual(result.completionDate, '2024-01-15');
  // assert audit for done action
  assert.ok(result.audit);
  assert.strictEqual(result.audit.event, 'action-marked-done');
  assert.strictEqual(result.audit.at, now);
  assert.strictEqual(result.audit.completionDate, '2024-01-15');
});

test('T19.10: Status blocked valid', () => {
  const row = { ...validRow, status: 'blocked' };
  const result = run(row);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.status, 'blocked');
});

test('T19.11: Invalid status rejected', () => {
  const row = { ...validRow, status: 'unknown' };
  const result = run(row);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be one of/);
});

test('T19.12: Empty id rejected', () => {
  const row = { ...validRow, id: '' };
  const result = run(row);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /id/);
});

test('T19.13: Empty action rejected', () => {
  const row = { ...validRow, action: '' };
  const result = run(row);
  assert.strictEqual(result.ok, false);
});

test('T19.14: Empty kind rejected', () => {
  const row = { ...validRow, kind: '' };
  const result = run(row);
  assert.strictEqual(result.ok, false);
});

test('T19.15: Empty skill rejected', () => {
  const row = { ...validRow, skill: '' };
  const result = run(row);
  assert.strictEqual(result.ok, false);
});

test('T19.16: No mutation of input', () => {
  const input = { ...validRow };
  const originalId = input.id;
  run(input);
  assert.strictEqual(input.id, originalId);
});

test('T19.17: Same input produces same output for non-done status', () => {
  const input = { ...validRow, status: 'pending' };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('T19.18: Trace includes node and steps', () => {
  const result = run(validRow);
  assert.ok(result.trace);
  assert.strictEqual(result.trace.node, 'L4.E04');
  assert.ok(Array.isArray(result.trace.steps));
});

test('T19.19: Non-object input rejected', () => {
  const result = run('not-an-object');
  assert.strictEqual(result.ok, false);
});

test('T19.20: Exactly 80 chars not truncated', () => {
  const action80 = 'a'.repeat(80);
  const row = { ...validRow, action: action80 };
  const result = run(row);
  assert.strictEqual(result.action.length, 80);
  assert.strictEqual(result.actionTruncated, false);
});
