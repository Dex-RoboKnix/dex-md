import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/spec-delta.mjs';

test('T07.1: Amendment IDs are auto-generated sequentially without caller input', () => {
  const r1 = run({ change: { text: 'change1' }, deltaCount: 0 });
  assert.equal(r1.ok, true);
  assert.equal(r1.delta.id, 1);

  const r2 = run({ change: { text: 'change2' }, deltaCount: 1 });
  assert.equal(r2.ok, true);
  assert.equal(r2.delta.id, 2);
});

test('T07.2: Empty or null changes are rejected with validation error', () => {
  const result = run({ change: null });
  assert.equal(result.ok, false);
  assert(result.error.includes('null'));
});

test('T07.2: Empty object changes are rejected', () => {
  const result = run({ change: {} });
  assert.equal(result.ok, false);
  assert(result.error.includes('empty'));
});

test('T07.2: Empty string changes are rejected', () => {
  const result = run({ change: '' });
  assert.equal(result.ok, false);
});

test('T07.3: Delta log includes reference to the spec version', () => {
  const result = run({ change: { text: 'test' }, specVersion: '2.0' });
  assert.equal(result.ok, true);
  assert.equal(result.delta.specVersion, '2.0');
  assert(result.effects[0].content.includes('version=2.0'));
});

test('T07.4: Each amendment records change, reason, and spec version reference', () => {
  const result = run({
    change: { field: 'value' },
    reason: 'Added field',
    specVersion: '1.5'
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.delta.change, { field: 'value' });
  assert.equal(result.delta.reason, 'Added field');
  assert.equal(result.delta.specVersion, '1.5');
});

test('T07: undefined change returns error', () => {
  const result = run({ change: undefined });
  assert.equal(result.ok, false);
});

test('T07: empty array change is rejected', () => {
  const result = run({ change: [] });
  assert.equal(result.ok, false);
});

test('T07: no mutation of input', () => {
  const input = { change: { text: 'test' }, reason: 'reason' };
  const orig = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), orig);
});

test('T07: same input produces same output twice', () => {
  const input = { change: { text: 'test' }, deltaCount: 5 };
  const r1 = run(input);
  const r2 = run(input);
  assert.deepEqual(r1, r2);
});

test('T07: trace includes node id', () => {
  const result = run({ change: { text: 'test' } });
  assert.equal(result.trace.node, 'L5.E03');
  assert(Array.isArray(result.trace.steps));
});

test('T07: effects includes append-log', () => {
  const result = run({ change: { text: 'test' } });
  assert.equal(result.ok, true);
  assert(Array.isArray(result.effects));
  assert.equal(result.effects[0].kind, 'append-log');
});
