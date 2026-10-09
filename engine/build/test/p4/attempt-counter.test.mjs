import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/attempt-counter.mjs';

test('T01.1 - Counter increments once per completed review round', (t) => {
  const result = run({
    taskId: 'task-001',
    reviewRound: 1,
    completed: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.attemptCount, 1);
  assert.equal(result.reviewRound, 1);
});

test('T01.1 - Counter tracks round 2', (t) => {
  const result = run({
    taskId: 'task-001',
    reviewRound: 2,
    completed: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.attemptCount, 2);
  assert.equal(result.reviewRound, 2);
});

test('T01.2 - Persists across task lifetime (returns same task id)', (t) => {
  const result = run({
    taskId: 'task-001',
    reviewRound: 1,
    completed: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.taskId, 'task-001');
});

test('T01.3 - Count is reported to orchestrator after each round', (t) => {
  const result = run({
    taskId: 'task-001',
    reviewRound: 1,
    completed: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.attemptCount, 1);
  // The result is returned, ready to report
  assert(result.trace);
});

test('T01.4 - Counter reports without escalation decision', (t) => {
  const result = run({
    taskId: 'task-001',
    reviewRound: 2,
    completed: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.attemptCount, 2);
  // No escalate field in result; attempt-cap theme decides
  assert(!('escalate' in result));
});

test('T01 - Empty input rejected', (t) => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('T01 - Null input rejected', (t) => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'input must be an object');
});

test('T01 - Malformed input: missing taskId', (t) => {
  const result = run({
    reviewRound: 1,
    completed: true
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('taskId'));
});

test('T01 - Malformed input: missing reviewRound', (t) => {
  const result = run({
    taskId: 'task-001',
    completed: true
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('reviewRound'));
});

test('T01 - Malformed input: completed not true', (t) => {
  const result = run({
    taskId: 'task-001',
    reviewRound: 1,
    completed: false
  });
  assert.equal(result.ok, false);
});

test('T01 - No mutation of input', (t) => {
  const input = {
    taskId: 'task-001',
    reviewRound: 1,
    completed: true
  };
  const inputCopy = JSON.stringify(input);

  run(input);

  assert.equal(JSON.stringify(input), inputCopy);
});

test('T01 - Same input produces same output twice', (t) => {
  const input = {
    taskId: 'task-001',
    reviewRound: 1,
    completed: true
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepEqual(result1, result2);
});

test('T01 - Trace includes node and steps', (t) => {
  const result = run({
    taskId: 'task-001',
    reviewRound: 1,
    completed: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L6.E07');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
