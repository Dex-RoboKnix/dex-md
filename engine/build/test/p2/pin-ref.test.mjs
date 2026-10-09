import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/pin-ref.mjs';

test('T01.1 Valid semantic version accepted', () => {
  const result = run({ ref: 'v1.2.3' });
  assert.equal(result.ok, true);
  assert.equal(result.valid, true);
  assert.equal(result.ref, 'v1.2.3');
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E01');
});

test('T01.2 Valid 40-hex SHA accepted', () => {
  const result = run({ ref: 'abc123def456abc123def456abc123def456abc1' });
  assert.equal(result.ok, true);
  assert.equal(result.valid, true);
  assert.equal(result.ref, 'abc123def456abc123def456abc123def456abc1');
  assert(result.trace);
});

test('T01.2b Invalid branch name rejected', () => {
  const result = run({ ref: 'main' });
  assert.equal(result.ok, false);
  assert(result.error.includes('Invalid ref'));
});

test('T01.2c Invalid pre-release rejected', () => {
  const result = run({ ref: 'v1.2.3-beta.1' });
  assert.equal(result.ok, false);
  assert(result.error.includes('Invalid ref'));
});

test('T01.3 Rejection reason displayed inline', () => {
  const result = run({ ref: 'feature/new-thing' });
  assert.equal(result.ok, false);
  assert(result.error);
  assert(result.error.includes('feature/new-thing'));
  assert(result.error.includes('guidance') || result.error.includes('format') || result.error.includes('vX.Y.Z'));
});

test('Empty ref rejected', () => {
  const result = run({ ref: '' });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing ref rejected', () => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert(result.error);
});

test('No mutation of input', () => {
  const input = { ref: 'v1.0.0' };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = { ref: 'v2.0.0' };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({ ref: 'v1.0.0' });
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E01');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
