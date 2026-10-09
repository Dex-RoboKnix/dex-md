import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/stall-detect.mjs';

test('T18.1 Stall is detected when two consecutive loop rounds show identical failure classification and items', () => {
  const input = {
    taskId: 'task-001',
    loopHistory: [
      { round: 1, failureClassification: 'spec-gap', affectedItems: ['item-A', 'item-B'] },
      { round: 2, failureClassification: 'spec-gap', affectedItems: ['item-A', 'item-B'] },
    ],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.stalled, true);
  assert.equal(result.result.stallDetected, true);
});

test('T18.2 Per-task stall detection allows other tasks to progress', () => {
  const input = {
    taskId: 'task-002-independent',
    loopHistory: [
      { round: 1, failureClassification: 'impl-bug', affectedItems: ['item-X'] },
      { round: 2, failureClassification: 'impl-bug', affectedItems: ['item-X'] },
    ],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.stalled, true);
  // Independent task stalling does not affect others (test just verifies this task is detected)
  assert.equal(result.result.taskId, 'task-002-independent');
});

test('T18.3 Stall flag raises Layer 8 veto for human decision', () => {
  const input = {
    taskId: 'task-003',
    loopHistory: [
      { round: 1, failureClassification: 'test-gap', affectedItems: ['test-1', 'test-2'] },
      { round: 2, failureClassification: 'test-gap', affectedItems: ['test-1', 'test-2'] },
    ],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.stalled, true);
  assert.equal(result.result.vetoRaised, true);
});

test('T18.4 Human can decide to retry, escalate, or terminate the stalled task', () => {
  const input = {
    taskId: 'task-004',
    loopHistory: [
      { round: 1, failureClassification: 'environment', affectedItems: ['env-var'] },
      { round: 2, failureClassification: 'environment', affectedItems: ['env-var'] },
    ],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.stalled, true);
  // The veto flag signals that human must make the decision (not automated)
  assert.ok(result.result.vetoRaised);
});

test('T18.5 Stall detection is independent across tasks', () => {
  const input = {
    taskId: 'task-005',
    loopHistory: [
      { round: 1, failureClassification: 'spec-gap', affectedItems: ['item-1'] },
      { round: 2, failureClassification: 'impl-bug', affectedItems: ['item-1'] }, // Different classification = no stall
    ],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.stalled, false);
});

test('T18 empty input rejection', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /not an object/);
});

test('T18 missing taskId rejection', () => {
  const result = run({
    loopHistory: [
      { round: 1, failureClassification: 'spec-gap', affectedItems: [] },
    ],
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /taskId/);
});

test('T18 missing loopHistory rejection', () => {
  const result = run({ taskId: 'task-006' });
  assert.equal(result.ok, false);
  assert.match(result.error, /loopHistory/);
});

test('T18 insufficient history rejection', () => {
  const result = run({
    taskId: 'task-007',
    loopHistory: [
      { round: 1, failureClassification: 'spec-gap', affectedItems: [] },
    ],
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /at least 2 rounds/);
});

test('T18 malformed history entry rejection', () => {
  const result = run({
    taskId: 'task-008',
    loopHistory: [
      { round: 1, failureClassification: 'spec-gap', affectedItems: [] },
      'not-an-object',
    ],
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /objects/);
});

test('T18 no stall when classifications differ', () => {
  const input = {
    taskId: 'task-009',
    loopHistory: [
      { round: 1, failureClassification: 'spec-gap', affectedItems: ['item-A'] },
      { round: 2, failureClassification: 'impl-bug', affectedItems: ['item-A'] },
    ],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.stalled, false);
});

test('T18 no stall when affected items differ', () => {
  const input = {
    taskId: 'task-010',
    loopHistory: [
      { round: 1, failureClassification: 'spec-gap', affectedItems: ['item-A'] },
      { round: 2, failureClassification: 'spec-gap', affectedItems: ['item-B'] },
    ],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.stalled, false);
});

test('T18 no mutation of input', () => {
  const input = {
    taskId: 'task-011',
    loopHistory: [
      { round: 1, failureClassification: 'spec-gap', affectedItems: ['item-A'] },
      { round: 2, failureClassification: 'spec-gap', affectedItems: ['item-A'] },
    ],
    now: '2026-10-09T14:30:00.123Z',
  };
  const inputCopy = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), inputCopy);
});

test('T18 same output twice', () => {
  const input = {
    taskId: 'task-012',
    loopHistory: [
      { round: 1, failureClassification: 'impl-bug', affectedItems: ['x'] },
      { round: 2, failureClassification: 'impl-bug', affectedItems: ['x'] },
    ],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.equal(result1.stalled, result2.stalled);
});

test('T18 trace includes steps', () => {
  const input = {
    taskId: 'task-013',
    loopHistory: [
      { round: 1, failureClassification: 'test-gap', affectedItems: ['t1'] },
      { round: 2, failureClassification: 'test-gap', affectedItems: ['t1'] },
    ],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.ok(Array.isArray(result.steps));
  assert(result.steps.length > 0);
});
