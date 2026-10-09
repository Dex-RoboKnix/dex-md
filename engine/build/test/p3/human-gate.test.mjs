import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/human-gate.mjs';

test('T15.1 Gate opens only when all required answers are human-provided', () => {
  const input = {
    requiredAnswers: [
      { name: 'q1', human_filled: true, uncertain: false },
      { name: 'q2', human_filled: true, uncertain: false }
    ],
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.open, true);
  assert.equal(result.lockedBy, null);
});

test('T15.2 LLM suggestions are separate from human-filled answers', () => {
  const input = {
    requiredAnswers: [
      { name: 'q1', human_filled: false, uncertain: false, suggestion: 'LLM value' }
    ],
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.open, false);
  assert.equal(result.lockedBy, 'q1');
});

test('T15.3 Blank or uncertain answers keep gate closed', () => {
  const input = {
    requiredAnswers: [
      { name: 'q1', human_filled: true, uncertain: false },
      { name: 'q2', human_filled: true, uncertain: true }
    ],
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.open, false);
  assert.equal(result.lockedBy, 'q2');
});

test('T15.4 Gate log shows status of each required answer and what locked it via effects', () => {
  const input = {
    requiredAnswers: [
      { name: 'goal', human_filled: false, uncertain: false }
    ],
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.open, false);
  assert(result.effects);
  assert(Array.isArray(result.effects));
  assert.equal(result.effects[0].kind, 'append-log');
  assert.match(result.effects[0].content, /CLOSED/);
  assert.match(result.effects[0].content, /goal/);
});

test('T15 empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T15 malformed input returns error', () => {
  const result = run({ requiredAnswers: 'not an array' });
  assert.equal(result.ok, false);
});

test('T15 no mutation of input', () => {
  const input = {
    requiredAnswers: [
      { name: 'q1', human_filled: true, uncertain: false }
    ],
    now: '2026-10-09T12:00:00Z'
  };
  const original = JSON.stringify(input);

  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('T15 same output twice', () => {
  const input = {
    requiredAnswers: [
      { name: 'q1', human_filled: true, uncertain: false }
    ],
    now: '2026-10-09T12:00:00Z'
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T15 trace includes node and steps', () => {
  const input = {
    requiredAnswers: [
      { name: 'q1', human_filled: true, uncertain: false }
    ],
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.trace.node, 'L3.E03');
  assert(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
