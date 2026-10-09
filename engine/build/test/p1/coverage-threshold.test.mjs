import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p1/coverage-threshold.mjs';

test('T10.1 Coverage percentage determines ask or suggest mode', () => {
  const result = run({ coverage: 75 });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'ask');
});

test('T10.1a coverage above threshold uses suggest', () => {
  const result = run({ coverage: 95 });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'suggest');
});

test('T10.2 Threshold boundary at 90% inclusive', () => {
  const result = run({ coverage: 90 });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'suggest');
});

test('T10.2a just below 90 uses ask', () => {
  const result = run({ coverage: 89.9 });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'ask');
});

test('T10.3 Recalculated fresh each checkpoint cycle', () => {
  const result1 = run({ coverage: 85 });
  const result2 = run({ coverage: 92 });
  assert.equal(result1.mode, 'ask');
  assert.equal(result2.mode, 'suggest');
});

test('T10.4 Output routed by mode (human prompt vs log)', () => {
  const now = '2024-01-15T10:30:00Z';
  const askResult = run({ coverage: 50, now });
  assert.equal(askResult.ok, true);
  assert.match(askResult.description, /asking human/i);
  // ask mode does not log audit
  assert.equal(askResult.audit, undefined);

  const suggestResult = run({ coverage: 95, now });
  assert.equal(suggestResult.ok, true);
  assert.match(suggestResult.description, /suggesting/i);
  // suggest mode logs audit/recommendations
  assert.ok(suggestResult.audit);
  assert.equal(suggestResult.audit.event, 'coverage-suggestion-logged');
  assert.equal(suggestResult.audit.at, now);
  assert.equal(suggestResult.audit.coverage, 95);
  assert.equal(suggestResult.audit.mode, 'suggest');
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
  const result = run([75]);
  assert.equal(result.ok, false);
});

test('malformed input (missing coverage)', () => {
  const result = run({});
  assert.equal(result.ok, false);
  assert.match(result.error, /must be a number/i);
});

test('malformed input (coverage not number)', () => {
  const result = run({ coverage: '90' });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be a number/i);
});

test('malformed input (coverage out of range negative)', () => {
  const result = run({ coverage: -10 });
  assert.equal(result.ok, false);
  assert.match(result.error, /between 0 and 100/i);
});

test('malformed input (coverage out of range high)', () => {
  const result = run({ coverage: 150 });
  assert.equal(result.ok, false);
  assert.match(result.error, /between 0 and 100/i);
});

test('boundary: exactly 0', () => {
  const result = run({ coverage: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'ask');
});

test('boundary: exactly 100', () => {
  const result = run({ coverage: 100 });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'suggest');
});

test('no mutation: input object unchanged', () => {
  const input = { coverage: 85 };
  const original = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('same output twice: deterministic', () => {
  const input = { coverage: 75 };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('trace contains node id', () => {
  const result = run({ coverage: 50 });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L1.E05');
  assert.ok(Array.isArray(result.trace.steps));
});
