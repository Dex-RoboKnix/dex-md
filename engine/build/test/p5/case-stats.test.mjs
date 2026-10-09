import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p5/case-stats.mjs';

test('T11.1: Pass rate calculation excluding abandoned and escalated', () => {
  const input = {
    cases: [
      { task_id: 1, attempts: 1, outcome: 'pass' },
      { task_id: 2, attempts: 1, outcome: 'pass' },
      { task_id: 3, attempts: 2, outcome: 'fail' },
      { task_id: 4, attempts: 1, outcome: 'abandoned' },
      { task_id: 5, attempts: 1, outcome: 'escalated-and-resolved' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.passRate, 0.7); // 2 pass / (2 pass + 1 fail) = 0.666... ≈ 0.7
});

test('T11.2: Escalated-and-resolved tracked separately', () => {
  const input = {
    cases: [
      { task_id: 1, attempts: 1, outcome: 'pass' },
      { task_id: 2, attempts: 1, outcome: 'fail' },
      { task_id: 3, attempts: 1, outcome: 'escalated-and-resolved' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.escalatedCount, 1);
});

test('T11.3: Statistics reported to one decimal place', () => {
  const input = {
    cases: [
      { task_id: 1, attempts: 3, outcome: 'pass' },
      { task_id: 2, attempts: 2, outcome: 'fail' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(typeof result.passRate, 'number');
  assert.equal(typeof result.meanAttempts, 'number');
  assert.equal(result.meanAttempts, 2.5);
});

test('T11.4: Deterministic computation from identical input', () => {
  const input = {
    cases: [
      { task_id: 1, attempts: 1, outcome: 'pass' },
      { task_id: 2, attempts: 1, outcome: 'fail' }
    ]
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T11.5: Trace captures steps for interpretation', () => {
  const input = {
    cases: [
      { task_id: 'A', attempts: 1, outcome: 'pass' },
      { task_id: 'B', attempts: 1, outcome: 'fail' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L5.E05');
  assert.equal(result.trace.steps.length, 2);
  assert.equal(result.trace.steps[0].outcome, 'pass');
});

test('T11: Empty input returns error', () => {
  const result = run({});
  assert.equal(result.ok, false);
  assert.match(result.error, /array/);
});

test('T11: Null input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T11: Empty cases array returns error', () => {
  const result = run({ cases: [] });
  assert.equal(result.ok, false);
});

test('T11: Malformed case (missing outcome) returns error', () => {
  const result = run({ cases: [{ task_id: 1, attempts: 1 }] });
  assert.equal(result.ok, false);
});

test('T11: Run does not mutate input', () => {
  const input = {
    cases: [
      { task_id: 1, attempts: 1, outcome: 'pass' },
      { task_id: 2, attempts: 1, outcome: 'fail' }
    ]
  };
  const copy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, copy);
});

test('T11: Same input produces same output twice', () => {
  const input = {
    cases: [
      { task_id: 1, attempts: 2, outcome: 'pass' },
      { task_id: 2, attempts: 1, outcome: 'fail' }
    ]
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});
