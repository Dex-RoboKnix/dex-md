import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/token-meter.mjs';

test('T06.1 - Token sum computed after each agent action completes', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 5000,
    cumulativeTokensBefore: 30000,
    actionOutcome: 'success'
  });

  assert.equal(result.ok, true);
  assert.equal(result.newCumulative, 35000);
});

test('T06.2 - All tokens used in partial failures count toward cap', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 8000,
    cumulativeTokensBefore: 40000,
    actionOutcome: 'partial-failure'
  });

  assert.equal(result.ok, true);
  assert.equal(result.newCumulative, 48000);
  // Tokens still count even though outcome was partial failure
});

test('T06.3 - Flag raised only when cumulative sum exceeds 50000', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 2000,
    cumulativeTokensBefore: 48001,
    actionOutcome: 'success'
  });

  assert.equal(result.ok, true);
  assert.equal(result.newCumulative, 50001);
  assert.equal(result.overThreshold, true);
  assert.equal(result.flag, 'exceeded');
});

test('T06.3 - Flag not raised at exactly 50000', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 2000,
    cumulativeTokensBefore: 48000,
    actionOutcome: 'success'
  });

  assert.equal(result.ok, true);
  assert.equal(result.newCumulative, 50000);
  assert.equal(result.overThreshold, false);
  assert.equal(result.flag, null);
});

test('T06.4 - Proactive warnings at lower thresholds not issued', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 3000,
    cumulativeTokensBefore: 42000,
    actionOutcome: 'success'
  });

  assert.equal(result.ok, true);
  assert.equal(result.newCumulative, 45000);
  assert.equal(result.overThreshold, false);
  assert.equal(result.flag, null);
  // No early warning at 45000
});

test('T06.5 - Token meter blocks new task assignment when agent over cap', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 2000,
    cumulativeTokensBefore: 49500,
    actionOutcome: 'success'
  });

  assert.equal(result.ok, true);
  assert.equal(result.overThreshold, true);
  assert.equal(result.flag, 'exceeded');
  // Result indicates agent is over cap; orchestrator blocks new assignment
});

test('T06 - Cumulative sum computed correctly', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 10000,
    cumulativeTokensBefore: 20000,
    actionOutcome: 'success'
  });

  assert.equal(result.ok, true);
  assert.equal(result.newCumulative, 30000);
});

test('T06 - Empty input rejected', (t) => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('T06 - Null input rejected', (t) => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T06 - Malformed input: missing agentId', (t) => {
  const result = run({
    tokensUsedThisAction: 5000,
    cumulativeTokensBefore: 30000,
    actionOutcome: 'success'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('agentId'));
});

test('T06 - Malformed input: missing tokensUsedThisAction', (t) => {
  const result = run({
    agentId: 'agent-001',
    cumulativeTokensBefore: 30000,
    actionOutcome: 'success'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('tokensUsedThisAction'));
});

test('T06 - Malformed input: missing cumulativeTokensBefore', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 5000,
    actionOutcome: 'success'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('cumulativeTokensBefore'));
});

test('T06 - Malformed input: missing actionOutcome', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 5000,
    cumulativeTokensBefore: 30000
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('actionOutcome'));
});

test('T06 - Malformed input: non-numeric tokensUsedThisAction', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 'five thousand',
    cumulativeTokensBefore: 30000,
    actionOutcome: 'success'
  });
  assert.equal(result.ok, false);
});

test('T06 - No mutation of input', (t) => {
  const input = {
    agentId: 'agent-001',
    tokensUsedThisAction: 5000,
    cumulativeTokensBefore: 30000,
    actionOutcome: 'success'
  };
  const inputCopy = JSON.stringify(input);

  run(input);

  assert.equal(JSON.stringify(input), inputCopy);
});

test('T06 - Same input produces same output twice', (t) => {
  const input = {
    agentId: 'agent-001',
    tokensUsedThisAction: 5000,
    cumulativeTokensBefore: 30000,
    actionOutcome: 'success'
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepEqual(result1, result2);
});

test('T06 - Trace includes node and steps', (t) => {
  const result = run({
    agentId: 'agent-001',
    tokensUsedThisAction: 5000,
    cumulativeTokensBefore: 30000,
    actionOutcome: 'success'
  });

  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L5.E02');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
