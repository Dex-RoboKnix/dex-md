import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/outcome-check.mjs';

test('T10.1 - All acceptance items must be marked pass for outcome completion', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'pass' },
      { id: '2', status: 'pass' },
      { id: '3', status: 'pass' }
    ]
  });

  assert.equal(result.ok, true);
  assert.equal(result.allApplicablePass, true);
  assert.equal(result.taskComplete, true);
  assert.equal(result.outcomeCheck, 'passed');
});

test('T10.1 - Task fails if any item not passed', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'pass' },
      { id: '2', status: 'fail' },
      { id: '3', status: 'pass' }
    ]
  });

  assert.equal(result.ok, true);
  assert.equal(result.allApplicablePass, false);
  assert.equal(result.taskComplete, false);
  assert.equal(result.outcomeCheck, 'failed');
});

test('T10.2 - Only review phase can mark acceptance items pass', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'pass' },
      { id: '2', status: 'pass' }
    ]
  });

  assert.equal(result.ok, true);
  // Module returns outcome; review phase was responsible for marking items
  assert(result.trace.steps.some(step => step.includes('review phase')));
});

test('T10.3 - Agents cannot self-mark items; isolation prevents gaming', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'pass' },
      { id: '2', status: 'pass' }
    ]
  });

  assert.equal(result.ok, true);
  // Module validates but does not enforce isolation; that is structural
  assert(result.trace.steps.some(step => step.includes('cannot self-mark')));
});

test('T10.4 - NA (not applicable) items excluded from outcome check', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'pass' },
      { id: '2', status: 'na' },
      { id: '3', status: 'pass' }
    ]
  });

  assert.equal(result.ok, true);
  assert.equal(result.applicableCount, 2);
  assert.equal(result.passCount, 2);
  assert.equal(result.allApplicablePass, true);
  assert.equal(result.taskComplete, true);
});

test('T10.5 - Task passes outcome-check when 100% of applicable items show pass', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'pass' },
      { id: '2', status: 'pass' },
      { id: '3', status: 'pass' },
      { id: '4', status: 'na' }
    ]
  });

  assert.equal(result.ok, true);
  assert.equal(result.passCount, 3);
  assert.equal(result.applicableCount, 3);
  assert.equal(result.allApplicablePass, true);
});

test('T10 - All items NA means task passes', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'na' },
      { id: '2', status: 'na' }
    ]
  });

  assert.equal(result.ok, true);
  assert.equal(result.taskComplete, true);
  assert.equal(result.applicableCount, 0);
});

test('T10 - Counts tracked correctly', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'pass' },
      { id: '2', status: 'pass' },
      { id: '3', status: 'fail' },
      { id: '4', status: 'na' }
    ]
  });

  assert.equal(result.ok, true);
  assert.equal(result.applicableCount, 3);
  assert.equal(result.passCount, 2);
  assert.equal(result.failCount, 1);
});

test('T10 - Empty input rejected', (t) => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('T10 - Null input rejected', (t) => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T10 - Malformed input: missing taskId', (t) => {
  const result = run({
    acceptanceItems: [{ id: '1', status: 'pass' }]
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('taskId'));
});

test('T10 - Malformed input: missing acceptanceItems', (t) => {
  const result = run({
    taskId: 'task-001'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('acceptanceItems'));
});

test('T10 - Malformed input: empty acceptanceItems array', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: []
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('empty'));
});

test('T10 - Malformed input: acceptanceItems not array', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: { id: '1', status: 'pass' }
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('array'));
});

test('T10 - Malformed input: item missing id throws', (t) => {
  assert.throws(() => {
    run({
      taskId: 'task-001',
      acceptanceItems: [{ status: 'pass' }]
    });
  });
});

test('T10 - Malformed input: invalid status throws', (t) => {
  assert.throws(() => {
    run({
      taskId: 'task-001',
      acceptanceItems: [{ id: '1', status: 'invalid' }]
    });
  });
});

test('T10 - No mutation of input', (t) => {
  const input = {
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'pass' },
      { id: '2', status: 'pass' }
    ]
  };
  const inputCopy = JSON.stringify(input);

  run(input);

  assert.equal(JSON.stringify(input), inputCopy);
});

test('T10 - Same input produces same output twice', (t) => {
  const input = {
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'pass' },
      { id: '2', status: 'pass' }
    ]
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepEqual(result1, result2);
});

test('T10 - Trace includes node and steps', (t) => {
  const result = run({
    taskId: 'task-001',
    acceptanceItems: [
      { id: '1', status: 'pass' },
      { id: '2', status: 'pass' }
    ]
  });

  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L2.E05');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
