import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p1/tag-validate.mjs';

test('T13.1: DOCUMENT tag recognized', () => {
  const result = run({ tag: 'DOCUMENT' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.tag, 'DOCUMENT');
});

test('T13.2: CITED tag recognized', () => {
  const result = run({ tag: 'CITED' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.tag, 'CITED');
});

test('T13.3: MODEL tag recognized', () => {
  const result = run({ tag: 'MODEL' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.tag, 'MODEL');
});

test('T13.4: UNSURE tag recognized', () => {
  const result = run({ tag: 'UNSURE' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.tag, 'UNSURE');
});

test('T13.5: Case-sensitive matching enforced', () => {
  const result = run({ tag: 'document' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be one of/);
});

test('T13.6: Unknown tags fail validation', () => {
  const result = run({ tag: 'UNKNOWN' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be one of/);
  assert.strictEqual(result.found, 'UNKNOWN');
});

test('T13.7: Empty tag rejected', () => {
  const result = run({ tag: '' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /cannot be empty/);
});

test('T13.8: Non-string tag rejected', () => {
  const result = run({ tag: 123 });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be a string/);
});

test('T13.9: Multiple tags validated', () => {
  const result = run({ tags: ['DOCUMENT', 'CITED', 'MODEL'] });
  assert.strictEqual(result.ok, true);
  assert.deepStrictEqual(result.tags, ['DOCUMENT', 'CITED', 'MODEL']);
  assert.strictEqual(result.count, 3);
});

test('T13.10: Invalid tag in array rejected', () => {
  const result = run({ tags: ['DOCUMENT', 'INVALID'] });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /invalid tags/);
  assert.ok(result.invalid.includes('INVALID'));
});

test('T13.11: Empty array rejected', () => {
  const result = run({ tags: [] });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /cannot be empty/);
});

test('T13.12: Non-array tags rejected', () => {
  const result = run({ tags: 'DOCUMENT' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('T13.13: No mutation of input', () => {
  const input = { tag: 'DOCUMENT' };
  const original = input.tag;
  run(input);
  assert.strictEqual(input.tag, original);
});

test('T13.14: Same input produces same output', () => {
  const input = { tag: 'CITED' };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('T13.15: Trace includes node and steps', () => {
  const result = run({ tag: 'MODEL' });
  assert.ok(result.trace);
  assert.strictEqual(result.trace.node, 'L1.E05');
  assert.ok(Array.isArray(result.trace.steps));
});

test('T13.16: Non-object input rejected', () => {
  const result = run('DOCUMENT');
  assert.strictEqual(result.ok, false);
});
