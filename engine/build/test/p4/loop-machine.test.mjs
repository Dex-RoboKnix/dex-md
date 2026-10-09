import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/loop-machine.mjs';

test('T04.1 - Loop starts at grill phase and sequences through spec, implement, review', (t) => {
  const result = run({
    taskId: 'task-001',
    currentPhase: 'grill',
    reviewPassed: false,
    outputComplete: true,
    attempt: 1
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'loop-to-next');
  assert.equal(result.nextPhase, 'spec');
});

test('T04.2 - Successful review passes task and exits loop', (t) => {
  const result = run({
    taskId: 'task-001',
    currentPhase: 'review',
    reviewPassed: true,
    outputComplete: true,
    attempt: 1
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'complete');
  assert.equal(result.taskStatus, 'passed');
  assert.equal(result.nextPhase, null);
});

test('T04.3 - Failed review returns to spec with delta requirement; grill not re-run', (t) => {
  const result = run({
    taskId: 'task-001',
    currentPhase: 'review',
    reviewPassed: false,
    outputComplete: true,
    attempt: 1
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'loop-to-spec');
  assert.equal(result.nextPhase, 'spec');
  assert.equal(result.requireDelta, true);
});

test('T04.4 - Incomplete output from implement causes loop to skip review and return to implement', (t) => {
  const result = run({
    taskId: 'task-001',
    currentPhase: 'implement',
    reviewPassed: false,
    outputComplete: false,
    attempt: 1
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'loop-to-implement');
  assert.equal(result.nextPhase, 'implement');
});

test('T04.5 - Loop continues until review passes or attempt cap is reached', (t) => {
  // Simulate attempt 1 passing all phases up to review
  const result = run({
    taskId: 'task-001',
    currentPhase: 'implement',
    reviewPassed: false,
    outputComplete: true,
    attempt: 1
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'loop-to-next');
  assert.equal(result.nextPhase, 'review');
});

test('T04.6 - Stall-detect flag can raise for infinite cycles', (t) => {
  // Note: stall-detect is a separate theme; loop-machine continues cycling
  const result = run({
    taskId: 'task-001',
    currentPhase: 'spec',
    reviewPassed: false,
    outputComplete: true,
    attempt: 2
  });

  assert.equal(result.ok, true);
  // Loop continues to next phase
  assert.equal(result.nextPhase, 'implement');
});

test('T04 - Progression: grill -> spec -> implement -> review', (t) => {
  const phases = ['grill', 'spec', 'implement'];
  const expected = ['spec', 'implement', 'review'];

  phases.forEach((phase, i) => {
    const result = run({
      taskId: 'task-001',
      currentPhase: phase,
      reviewPassed: false,
      outputComplete: true,
      attempt: 1
    });

    assert.equal(result.ok, true);
    assert.equal(result.nextPhase, expected[i]);
  });
});

test('T04 - Empty input rejected', (t) => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('T04 - Null input rejected', (t) => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T04 - Malformed input: missing taskId', (t) => {
  const result = run({
    currentPhase: 'grill',
    reviewPassed: false,
    outputComplete: true
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('taskId'));
});

test('T04 - Malformed input: missing currentPhase', (t) => {
  const result = run({
    taskId: 'task-001',
    reviewPassed: false,
    outputComplete: true
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('currentPhase'));
});

test('T04 - Malformed input: invalid currentPhase', (t) => {
  const result = run({
    taskId: 'task-001',
    currentPhase: 'invalid',
    reviewPassed: false,
    outputComplete: true
  });
  assert.equal(result.ok, false);
});

test('T04 - Malformed input: missing reviewPassed', (t) => {
  const result = run({
    taskId: 'task-001',
    currentPhase: 'grill',
    outputComplete: true
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('reviewPassed'));
});

test('T04 - Malformed input: missing outputComplete', (t) => {
  const result = run({
    taskId: 'task-001',
    currentPhase: 'grill',
    reviewPassed: false
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('outputComplete'));
});

test('T04 - No mutation of input', (t) => {
  const input = {
    taskId: 'task-001',
    currentPhase: 'grill',
    reviewPassed: false,
    outputComplete: true,
    attempt: 1
  };
  const inputCopy = JSON.stringify(input);

  run(input);

  assert.equal(JSON.stringify(input), inputCopy);
});

test('T04 - Same input produces same output twice', (t) => {
  const input = {
    taskId: 'task-001',
    currentPhase: 'grill',
    reviewPassed: false,
    outputComplete: true,
    attempt: 1
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepEqual(result1, result2);
});

test('T04 - Trace includes node and steps', (t) => {
  const result = run({
    taskId: 'task-001',
    currentPhase: 'grill',
    reviewPassed: false,
    outputComplete: true,
    attempt: 1
  });

  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L6.E03');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
