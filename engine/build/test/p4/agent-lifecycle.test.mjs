import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/agent-lifecycle.mjs';

test('T05.1 - Agent crossed 50000 tokens is deleted at next task boundary', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 50001,
    tasksCompleted: 3,
    isTaskComplete: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'delete');
  assert(result.reason.includes('50000'));
});

test('T05.2 - Token use tracked per agent across all tasks', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 45000,
    tasksCompleted: 3,
    isTaskComplete: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.cumulativeTokens, 45000);
  assert.equal(result.tasksCompleted, 3);
});

test('T05.3 - Task exceeding target alone is escalated rather than split', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 10000,
    tasksCompleted: 1,
    isTaskComplete: false,
    currentTaskTokens: 51000
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'escalate');
  assert(result.reason.includes('single task'));
});

test('T05.4 - Token meter reports cumulative sum before new assignment', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 30000,
    tasksCompleted: 2,
    isTaskComplete: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.cumulativeTokens, 30000);
  // Agent can accept new tasks
  assert.equal(result.action, 'keep');
});

test('T05.5 - Target prevents unbounded resource use per agent', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 49999,
    tasksCompleted: 2,
    isTaskComplete: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'keep');
  assert.equal(result.tokensRemaining, 1);
});

test('T05 - Agent kept while under cap', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 25000,
    tasksCompleted: 1,
    isTaskComplete: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'keep');
});

test('T05 - Agent not deleted mid-task even if over cap', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 50001,
    tasksCompleted: 2,
    isTaskComplete: false
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'keep');
  // Not deleted until task boundary is reached
});

test('T05 - Empty input rejected', (t) => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('T05 - Null input rejected', (t) => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T05 - Malformed input: missing agentId', (t) => {
  const result = run({
    cumulativeTokens: 25000,
    tasksCompleted: 1,
    isTaskComplete: true
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('agentId'));
});

test('T05 - Malformed input: missing cumulativeTokens', (t) => {
  const result = run({
    agentId: 'agent-001',
    tasksCompleted: 1,
    isTaskComplete: true
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('cumulativeTokens'));
});

test('T05 - Malformed input: missing tasksCompleted', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 25000,
    isTaskComplete: true
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('tasksCompleted'));
});

test('T05 - Malformed input: missing isTaskComplete', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 25000,
    tasksCompleted: 1
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('isTaskComplete'));
});

test('T05 - Malformed input: non-numeric cumulativeTokens', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 'twenty-five thousand',
    tasksCompleted: 1,
    isTaskComplete: true
  });
  assert.equal(result.ok, false);
});

test('T05 - No mutation of input', (t) => {
  const input = {
    agentId: 'agent-001',
    cumulativeTokens: 25000,
    tasksCompleted: 1,
    isTaskComplete: true
  };
  const inputCopy = JSON.stringify(input);

  run(input);

  assert.equal(JSON.stringify(input), inputCopy);
});

test('T05 - Same input produces same output twice', (t) => {
  const input = {
    agentId: 'agent-001',
    cumulativeTokens: 25000,
    tasksCompleted: 1,
    isTaskComplete: true
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepEqual(result1, result2);
});

test('T05 - Trace includes node and steps', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokens: 25000,
    tasksCompleted: 1,
    isTaskComplete: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L5.E03');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
