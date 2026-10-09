import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/grill-batch.mjs';

test('T01.1: A grill with 0 questions is rejected with validation error', () => {
  const result = run({ questions: [] });
  assert.equal(result.ok, false);
  assert(result.error.includes('at least 1 question'));
});

test('T01.2: A question with only 1 option fails validation immediately', () => {
  const result = run({ questions: [{ options: ['a'] }] });
  assert.equal(result.ok, false);
  assert(result.error.includes('Question 0'));
  assert(result.error.includes('1 option'));
});

test('T01.3: Error messages include the question index and option count', () => {
  const result = run({ questions: [{ options: [] }, { options: ['a', 'b'] }] });
  assert.equal(result.ok, false);
  assert(result.error.includes('Question'));
  assert(/\d+ option/.test(result.error));
});

test('T01.4: Grills with 1-3 questions and 2-4 options pass validation', () => {
  const result = run({
    questions: [
      { options: ['a', 'b'] },
      { options: ['x', 'y', 'z'] },
      { options: ['1', '2', '3', '4'] }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L5.E03');
  assert.equal(result.trace.steps.length, 3);
});

test('T01: empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T01: undefined returns error', () => {
  const result = run(undefined);
  assert.equal(result.ok, false);
});

test('T01: array input returns error', () => {
  const result = run([]);
  assert.equal(result.ok, false);
});

test('T01: no mutation of input', () => {
  const input = { questions: [{ options: ['a', 'b'] }] };
  const orig = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), orig);
});

test('T01: same input produces same output twice', () => {
  const input = { questions: [{ options: ['a', 'b'] }] };
  const r1 = run(input);
  const r2 = run(input);
  assert.deepEqual(r1, r2);
});

test('T01: trace includes node id', () => {
  const result = run({ questions: [{ options: ['a', 'b'] }] });
  assert.equal(result.trace.node, 'L5.E03');
  assert(Array.isArray(result.trace.steps));
});
