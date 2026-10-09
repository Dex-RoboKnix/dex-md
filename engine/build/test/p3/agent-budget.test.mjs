import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/agent-budget.mjs';

test('T10.1: Tasks are packed to stay within 50k tokens per agent', () => {
  const result = run({
    tasks: [
      { id: 't1', tokens: 30000 },
      { id: 't2', tokens: 15000 },
      { id: 't3', tokens: 10000 }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.agents[0].usedTokens, 45000);
});

test('T10.2: A single task exceeding 50k is packed alone and flagged', () => {
  const result = run({
    tasks: [
      { id: 't1', tokens: 75000 }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.agents[0].oversized, true);
  assert.equal(result.oversizedTasks.length, 1);
  assert.equal(result.oversizedTasks[0].exceeds, 25000);
});

test('T10.3: Packing report shows token estimates for each task and each agent', () => {
  const result = run({
    tasks: [
      { id: 't1', tokens: 20000 },
      { id: 't2', tokens: 20000 }
    ]
  });
  assert.equal(result.ok, true);
  assert(result.agents[0].tasks);
  assert(result.agents[0].usedTokens);
  result.agents.forEach(a => {
    assert(Array.isArray(a.tasks));
    assert(typeof a.usedTokens === 'number');
  });
});

test('T10.4: Token calculation includes direct references but not transitive', () => {
  const result = run({
    tasks: [
      { id: 't1', tokens: 10000 },
      { id: 't2', tokens: 20000 }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.agents[0].usedTokens, 30000);
});

test('T10: empty task list', () => {
  const result = run({ tasks: [] });
  assert.equal(result.ok, true);
  assert.equal(result.agentCount, 0);
});

test('T10: tasks exceeding budget are flagged for escalation', () => {
  const result = run({
    tasks: [
      { id: 'large', tokens: 60000 }
    ],
    budgetPerAgent: 50000
  });
  assert.equal(result.ok, true);
  assert.equal(result.oversizedTasks.length, 1);
  assert(result.oversizedTasks[0].exceeds > 0);
});

test('T10: multiple agents created when needed', () => {
  const result = run({
    tasks: [
      { id: 't1', tokens: 40000 },
      { id: 't2', tokens: 40000 },
      { id: 't3', tokens: 10000 }
    ]
  });
  assert.equal(result.ok, true);
  assert(result.agentCount >= 2);
});

test('T10: no mutation of input', () => {
  const input = {
    tasks: [
      { id: 't1', tokens: 10000 }
    ]
  };
  const orig = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), orig);
});

test('T10: same input produces same output twice', () => {
  const input = {
    tasks: [
      { id: 't1', tokens: 20000 },
      { id: 't2', tokens: 25000 }
    ]
  };
  const r1 = run(input);
  const r2 = run(input);
  assert.deepEqual(r1, r2);
});

test('T10: trace includes node id', () => {
  const result = run({ tasks: [{ id: 't', tokens: 100 }] });
  assert.equal(result.trace.node, 'L5.E03');
  assert(Array.isArray(result.trace.steps));
});
