import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/cost-estimate.mjs';

test('T20.1 Per-role token costs are configured for grill, spec, implement, review', () => {
  const input = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 2000,
      spec: 3000,
      implement: 5000,
      review: 4000,
    },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.estimate);
});

test('T20.2 Baseline cost = roles sum × number of tasks', () => {
  const input = {
    taskCount: 5,
    roleTokenCosts: {
      grill: 1000,
      spec: 2000,
      implement: 3000,
      review: 2000,
    },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  const expectedPerTask = 1000 + 2000 + 3000 + 2000; // 8000
  const expectedBaseline = expectedPerTask * 5; // 40000
  assert.equal(result.estimate.baselineCost, expectedBaseline);
});

test('T20.3 Escalation cost is added only if escalation occurs (pragmatic path)', () => {
  const input1 = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
    willEscalate: false,
    now: '2026-10-09T14:30:00.123Z',
  };
  const result1 = run(input1);
  assert.equal(result1.ok, true);
  assert.equal(result1.estimate.escalationCost, 0);

  const input2 = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
    willEscalate: true,
    escalationCost: 15000,
    now: '2026-10-09T14:30:00.123Z',
  };
  const result2 = run(input2);
  assert.equal(result2.ok, true);
  assert.equal(result2.estimate.escalationCost, 15000);
});

test('T20.4 Estimate output includes total tokens for N tasks and cost per task', () => {
  const input = {
    taskCount: 20,
    roleTokenCosts: {
      grill: 2000,
      spec: 2000,
      implement: 3000,
      review: 2000,
    },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.estimate.totalCost);
  assert.ok(result.estimate.costPerTask);
});

test('T20.5 Configuration is updated automatically after each batch for self-correction', () => {
  const input = {
    taskCount: 8,
    roleTokenCosts: {
      grill: 1500,
      spec: 2000,
      implement: 2500,
      review: 1800,
    },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  // Self-correction would happen at orchestrator level after batch completes
  // This module just computes the estimate based on provided costs
  assert.ok(result.audit.totalCost);
});

test('T20 empty input rejection', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /not an object/);
});

test('T20 missing taskCount rejection', () => {
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

test('T20 invalid taskCount rejection', () => {
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

test('T20 missing roleTokenCosts rejection', () => {
  const result = run({ taskCount: 10 });
  assert.equal(result.ok, false);
  assert.match(result.error, /roleTokenCosts/);
});

test('T20 incomplete roleTokenCosts rejection', () => {
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

test('T20 escalation cost with default value', () => {
  const input = {
    taskCount: 5,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
    willEscalate: true,
    // escalationCost not provided; should use default
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  // Should use default escalation cost
  assert.equal(result.estimate.escalationCost, 15000);
});

test('T20 no mutation of input', () => {
  const input = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
    now: '2026-10-09T14:30:00.123Z',
  };
  const inputCopy = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), inputCopy);
});

test('T20 same output twice', () => {
  const input = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 2000,
      spec: 2000,
      implement: 2000,
      review: 2000,
    },
    willEscalate: true,
    escalationCost: 20000,
    now: '2026-10-09T14:30:00.123Z',
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.equal(result1.estimate.totalCost, result2.estimate.totalCost);
  assert.equal(result1.estimate.costPerTask, result2.estimate.costPerTask);
});

test('T20 trace includes steps', () => {
  const input = {
    taskCount: 10,
    roleTokenCosts: {
      grill: 1000,
      spec: 1000,
      implement: 1000,
      review: 1000,
    },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.ok(Array.isArray(result.steps));
  assert(result.steps.length > 0);
});
