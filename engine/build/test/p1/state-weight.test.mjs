import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p1/state-weight.mjs';

test('T11.1: C maps to 1', () => {
  const result = run({ state: 'C' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.weight, 1);
  assert.strictEqual(result.code, 'C');
});

test('T11.2: W maps to 0.5', () => {
  const result = run({ state: 'W' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.weight, 0.5);
});

test('T11.3: N maps to 0', () => {
  const result = run({ state: 'N' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.weight, 0);
});

test('T11.4: U maps to 0', () => {
  const result = run({ state: 'U' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.weight, 0);
});

test('T11.5: NA has no weight and is excluded', () => {
  const result = run({ state: 'NA' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.weight, undefined);
  assert.strictEqual(result.included, false);
});

test('T11.6: Unknown codes trigger error', () => {
  const result = run({ state: 'UNKNOWN' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /unknown state code/);
});

test('T11.7: Empty input rejected', () => {
  const result = run({});
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /state or states/);
});

test('T11.8: Null input rejected', () => {
  const result = run(null);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an object/);
});

test('T11.9: Non-object input rejected', () => {
  const result = run('string');
  assert.strictEqual(result.ok, false);
});

test('T11.10: Multiple states with array', () => {
  const result = run({ states: ['C', 'W', 'N'] });
  assert.strictEqual(result.ok, true);
  assert.deepStrictEqual(result.weights, [1, 0.5, 0]);
  assert.strictEqual(result.sum, 1.5);
});

test('T11.11: Multiple states with NA excluded', () => {
  const result = run({ states: ['C', 'NA', 'W'] });
  assert.strictEqual(result.ok, true);
  assert.deepStrictEqual(result.weights, [1, 0.5]);
  assert.deepStrictEqual(result.excluded, ['NA']);
  assert.strictEqual(result.sum, 1.5);
});

test('T11.12: No mutation of input', () => {
  const input = { state: 'C' };
  const originalState = input.state;
  run(input);
  assert.strictEqual(input.state, originalState);
});

test('T11.13: Same input produces same output', () => {
  const input = { state: 'W' };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('T11.14: Trace includes node and steps', () => {
  const result = run({ state: 'C' });
  assert.ok(result.trace);
  assert.strictEqual(result.trace.node, 'L1.E05');
  assert.ok(Array.isArray(result.trace.steps));
  assert.strictEqual(result.trace.steps.length > 0, true);
});

test('T11.15: Sum precision to 0.01', () => {
  const result = run({ states: ['W', 'W', 'W'] });
  assert.strictEqual(result.sum, 1.5);
  // Verify it's a number (precise to at least 0.01)
  assert.strictEqual(typeof result.sum, 'number');
});

test('T11.16: Empty array rejected', () => {
  const result = run({ states: [] });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /cannot be empty/);
});
