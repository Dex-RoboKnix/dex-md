import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p1/id-allocator.mjs';

test('T02.1 Allocator reads existing ID sequence and finds maximum', () => {
  const result = run({ existingIds: [1, 5, 3, 10, 8] });
  assert.equal(result.ok, true);
  assert.equal(result.nextId, 11);
});

test('T02.2 Returns next integer in sequence', () => {
  const result = run({ existingIds: [100, 200, 300] });
  assert.equal(result.ok, true);
  assert.equal(result.nextId, 301);
});

test('T02.3 Throws overflow error before state change at 999', () => {
  const result = run({ existingIds: [999] });
  assert.equal(result.ok, false);
  assert.match(result.error, /overflow/i);
  assert.match(result.error, /999/);
});

test('T02.4 Audit log records allocation with timestamp', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({ existingIds: [50, 75], now });
  assert.equal(result.ok, true);
  assert.ok(result.audit);
  assert.equal(result.audit.event, 'id-allocated');
  assert.equal(result.audit.at, now);
  assert.equal(result.audit.nextId, 76);
  assert.equal(result.audit.maxPrevious, 75);
});

test('empty input (null)', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('empty input (undefined)', () => {
  const result = run(undefined);
  assert.equal(result.ok, false);
});

test('malformed input (array)', () => {
  const result = run([1, 2, 3]);
  assert.equal(result.ok, false);
  assert.match(result.error, /must be an object/i);
});

test('malformed input (missing existingIds)', () => {
  const result = run({ ids: [1, 2, 3] });
  assert.equal(result.ok, false);
  assert.match(result.error, /existingIds must be an array/i);
});

test('malformed input (existingIds not array)', () => {
  const result = run({ existingIds: 'not an array' });
  assert.equal(result.ok, false);
  assert.match(result.error, /existingIds must be an array/i);
});

test('malformed input (non-integer in array)', () => {
  const result = run({ existingIds: [1, 2.5, 3] });
  assert.equal(result.ok, false);
  assert.match(result.error, /non-negative integers/i);
});

test('no mutation: input object unchanged', () => {
  const input = { existingIds: [1, 2, 3] };
  const original = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('same output twice: deterministic', () => {
  const input = { existingIds: [5, 10, 15] };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('trace contains node id', () => {
  const result = run({ existingIds: [1, 2, 3] });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L4.E08');
  assert.ok(Array.isArray(result.trace.steps));
});

test('an empty list allocates 001 (IDs start at 1, never 0)', () => {
  const r = run({ existingIds: [] });
  assert.equal(r.ok, true);
  assert.equal(r.nextId, 1);
  assert.equal(r.audit.maxPrevious, 0);
});
