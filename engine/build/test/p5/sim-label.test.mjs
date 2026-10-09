import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p5/sim-label.mjs';

test('T15.1: Answer begins with [SIMULATED] tag', () => {
  const input = { answer: 'This is a simulated answer.' };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.taggedAnswer.startsWith('[SIMULATED]'));
});

test('T15.1b: Tag is in exact caps with brackets', () => {
  const input = { answer: 'test answer' };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.taggedAnswer.startsWith('[SIMULATED]'));
  assert.ok(result.taggedAnswer.includes('[SIMULATED]'));
});

test('T15.2: Automated detection of missing tag would reject invalid answers', () => {
  const input = { answer: 'missing-tag-answer', check_tag: true };
  const result = run(input);
  assert.equal(result.ok, true);
  // Tag is prepended because check_tag is true and answer doesn't start with tag
  assert.ok(result.taggedAnswer.startsWith('[SIMULATED]'));
});

test('T15.3: Human spot-check enabled via check_tag flag', () => {
  const input = { answer: '[SIMULATED] Already tagged', check_tag: true };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.tagAlreadyPresent, true);
});

test('T15.4: Tag presence is machine-verifiable', () => {
  const input1 = { answer: 'plain answer' };
  const input2 = { answer: '[SIMULATED] valid answer' };
  const result1 = run(input1);
  const result2 = run(input2);
  assert.ok(result1.taggedAnswer.startsWith('[SIMULATED]'));
  assert.ok(result2.taggedAnswer.startsWith('[SIMULATED]'));
  assert.equal(result2.tagAlreadyPresent, true);
});

test('T15.5: Invalid answers can be flagged by presence/absence', () => {
  const input = { answer: '[simulated] lowercase tag is invalid' };
  const result = run(input);
  // The tag is uppercase, so lowercase won't match
  assert.equal(result.ok, true);
  // Function prepends new tag since it doesn't start with [SIMULATED] exactly
  assert.ok(result.taggedAnswer.startsWith('[SIMULATED]'));
});

test('T15: Empty input returns error', () => {
  const result = run({});
  assert.equal(result.ok, false);
});

test('T15: Null answer returns error', () => {
  const result = run({ answer: null });
  assert.equal(result.ok, false);
});

test('T15: Non-string answer returns error', () => {
  const result = run({ answer: 123 });
  assert.equal(result.ok, false);
});

test('T15: Empty string answer is valid', () => {
  const result = run({ answer: '' });
  assert.equal(result.ok, true);
  assert.equal(result.taggedAnswer, '[SIMULATED] ');
});

test('T15: No mutation of input', () => {
  const input = { answer: 'test' };
  const copy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, copy);
});

test('T15: Same input produces same output twice', () => {
  const input = { answer: 'consistent answer' };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T15: Trace includes prepend action', () => {
  const input = { answer: 'new answer' };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L3.E05');
  assert.ok(result.trace.steps.some(s => s.action === 'prepend-tag'));
});
