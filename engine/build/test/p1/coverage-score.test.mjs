import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p1/coverage-score.mjs';

test('T01.1 Coverage function accepts {answered, weak, total} object', () => {
  const result = run({ answered: 8, weak: 1, total: 10 });
  assert.equal(result.ok, true);
  assert.equal(typeof result.percentage, 'number');
});

test('T01.2 Returns percentage with weak answers weighted at 0.5', () => {
  const result = run({ answered: 8, weak: 2, total: 10 });
  // (8 + 0.5*2) / 10 * 100 = (8 + 1) / 10 * 100 = 9/10 * 100 = 90%
  assert.equal(result.ok, true);
  assert.equal(result.percentage, 90);
});

test('T01.3 Logs count breakdown for re-derivation', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({ answered: 5, weak: 4, total: 10, now });
  assert.equal(result.ok, true);
  assert.ok(result.audit);
  assert.equal(result.audit.event, 'coverage-calculated');
  assert.equal(result.audit.at, now);
  assert.equal(result.audit.answered, 5);
  assert.equal(result.audit.weak, 4);
  assert.equal(result.audit.total, 10);
});

test('empty input (null)', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /must be an object/i);
});

test('empty input (undefined)', () => {
  const result = run(undefined);
  assert.equal(result.ok, false);
  assert.match(result.error, /must be an object/i);
});

test('malformed input (array)', () => {
  const result = run([1, 2, 3]);
  assert.equal(result.ok, false);
  assert.match(result.error, /must be an object/i);
});

test('malformed input (missing field)', () => {
  const result = run({ answered: 5, weak: 2 });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be numbers/i);
});

test('malformed input (non-number field)', () => {
  const result = run({ answered: 'five', weak: 2, total: 10 });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be numbers/i);
});

test('no mutation: input object unchanged', () => {
  const input = { answered: 5, weak: 2, total: 10 };
  const original = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('same output twice: deterministic', () => {
  const input = { answered: 7, weak: 3, total: 10 };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('trace contains node id', () => {
  const result = run({ answered: 5, weak: 1, total: 10 });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L1.E05');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
