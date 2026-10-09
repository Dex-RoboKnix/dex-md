import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/budget-split.mjs';

test('T16.1 Per-role token costs are read from configuration', () => {
  const input = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 2000,
      spec: 3000,
      implement: 5000,
      review: 4000,
    },
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.taskAllocation);
});

test('T16.2 Average per-task cost is computed and multiplied by task count', () => {
  const input = {
    taskCount: 5,
    roleTokenCosts: {
      grill: 1000,
      spec: 2000,
      implement: 3000,
      review: 2000,
    },
  };
  const result = run(input);
  assert.equal(result.ok, true);
  const expectedPerTask = 1000 + 2000 + 3000 + 2000; // 8000
  assert.equal(result.taskAllocation.perTaskCost, expectedPerTask);
  const expectedTotal = expectedPerTask * 5; // 40000
  assert.equal(result.taskAllocation.totalBaselineCost, expectedTotal);
});

test('T16.3 Budget-split output shows task count per agent', () => {
  const input = {
    taskCount: 21,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
  };
  const result = run(input);
  assert.equal(result.ok, true);
  // 21 tasks / 7 agents = 3 tasks per agent
  assert.equal(result.taskAllocation.tasksPerAgent, 3);
});

test('T16.4 Variance is accepted as some tasks exceed average, others under-budget', () => {
  const input = {
    taskCount: 15,
    roleTokenCosts: {
      grill: 2000,
      spec: 2000,
      implement: 2000,
      review: 2000,
    },
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.taskAllocation.variance.accepted, true);
  assert.match(result.taskAllocation.variance.reason, /exceed|under-budget/);
});

test('T16.5 Seven agents are allocated to tasks and one slot is reserved for the escalation agent', () => {
  const input = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.taskAllocation.availableAgents, 7);
  assert.equal(result.taskAllocation.reservedSlots, 1);
  assert.equal(result.taskAllocation.totalSlots, 8);
});

test('T16 empty input rejection', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /not an object/);
});

test('T16 missing taskCount rejection', () => {
  const result = run({
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /taskCount/);
});

test('T16 invalid taskCount rejection', () => {
  const result = run({
    taskCount: 0,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /taskCount/);
});

test('T16 missing roleTokenCosts rejection', () => {
  const result = run({ taskCount: 10 });
  assert.equal(result.ok, false);
  assert.match(result.error, /roleTokenCosts/);
});

test('T16 incomplete roleTokenCosts rejection', () => {
  const result = run({
    taskCount: 10,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      // missing implement and review
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /roleTokenCosts/);
});

test('T16 no mutation of input', () => {
  const input = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
  };
  const inputCopy = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), inputCopy);
});

test('T16 same output twice', () => {
  const input = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.equal(result1.taskAllocation.tasksPerAgent, result2.taskAllocation.tasksPerAgent);
  assert.equal(result1.taskAllocation.totalBaselineCost, result2.taskAllocation.totalBaselineCost);
});

test('T16 trace includes steps', () => {
  const input = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
  };
  const result = run(input);
  assert.ok(Array.isArray(result.steps));
  assert(result.steps.length > 0);
});
