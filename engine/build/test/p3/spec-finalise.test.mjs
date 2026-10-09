import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/spec-finalise.mjs';

test('T08.1: Deltas are applied in order with last write taking precedence', () => {
  const result = run({
    deltas: [
      { change: { field: 'value1' } },
      { change: { field: 'value2' } }
    ],
    tasks: []
  });
  assert.equal(result.ok, true);
  assert.equal(result.mergedContent.field, 'value2');
});

test('T08.2: Finalise fails and reports if any delta references a non-existent task', () => {
  const result = run({
    deltas: [
      { taskId: 'task1', change: { text: 'change' } }
    ],
    tasks: [
      { id: 'task2' }
    ]
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('non-existent task'));
  assert(result.error.includes('task1'));
});

test('T08.3: Content hash is stable and reproducible across identical inputs', () => {
  const input = {
    deltas: [
      { change: { a: 1, b: 2 } }
    ],
    tasks: []
  };
  const r1 = run(input);
  const r2 = run(input);
  assert.equal(r1.contentHash, r2.contentHash);
});

test('T08.4: Invalid task references are caught before merge completes', () => {
  const result = run({
    deltas: [
      { taskId: 'valid', change: { x: 1 } },
      { taskId: 'invalid', change: { y: 2 } }
    ],
    tasks: [
      { id: 'valid' }
    ]
  });
  assert.equal(result.ok, false);
  assert.equal(result.mergedContent, undefined);
});

test('T08: valid deltas with valid task references pass', () => {
  const result = run({
    deltas: [
      { taskId: 'task1', change: { status: 'done' } }
    ],
    tasks: [
      { id: 'task1' }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.mergedContent.status, 'done');
});

test('T08: empty deltas produce empty content', () => {
  const result = run({ deltas: [], tasks: [] });
  assert.equal(result.ok, true);
  assert.deepEqual(result.mergedContent, {});
});

test('T08: no mutation of input', () => {
  const input = {
    deltas: [{ change: { a: 1 } }],
    tasks: []
  };
  const orig = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), orig);
});

test('T08: same input produces same output twice', () => {
  const input = {
    deltas: [{ change: { a: 1 } }],
    tasks: []
  };
  const r1 = run(input);
  const r2 = run(input);
  assert.deepEqual(r1, r2);
});

test('T08: trace includes node id', () => {
  const result = run({ deltas: [], tasks: [] });
  assert.equal(result.trace.node, 'L5.E03');
  assert(Array.isArray(result.trace.steps));
});

test('T08: hash is deterministic hex string', () => {
  const result = run({ deltas: [{ change: { x: 1 } }], tasks: [] });
  assert.equal(result.ok, true);
  assert(typeof result.contentHash, 'string');
  assert(/^[a-f0-9]{64}$/.test(result.contentHash));
});
