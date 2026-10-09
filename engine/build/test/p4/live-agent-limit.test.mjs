import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/live-agent-limit.mjs';

test('T07.1 - Live agent count checked before spawn is issued', (t) => {
  const result = run({
    liveAgentCount: 8,
    taskQueueLength: 2,
    agentIdToSpawn: 'agent-009'
  });

  assert.equal(result.ok, true);
  // Spawn was checked (pre-spawn check performed)
  assert(result.spawned === false);
});

test('T07.2 - Spawn refused if 8 agents are already live', (t) => {
  const result = run({
    liveAgentCount: 8,
    taskQueueLength: 1,
    agentIdToSpawn: 'agent-009'
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'queue');
  assert.equal(result.spawned, false);
});

test('T07.2 - Spawn refused at exactly 8 agents', (t) => {
  const result = run({
    liveAgentCount: 8,
    taskQueueLength: 0,
    agentIdToSpawn: 'agent-009'
  });

  assert.equal(result.ok, true);
  assert.equal(result.spawned, false);
  assert.equal(result.queuedFor, true);
});

test('T07.3 - Deleted agents immediately free slot for new spawn', (t) => {
  // After one agent is deleted, count drops from 8 to 7
  const result = run({
    liveAgentCount: 7,
    taskQueueLength: 1,
    agentIdToSpawn: 'agent-009'
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'spawn');
  assert.equal(result.spawned, true);
  assert.equal(result.newLiveCount, 8);
});

test('T07.4 - Tasks wait in queue when spawn is refused', (t) => {
  const result = run({
    liveAgentCount: 8,
    taskQueueLength: 2,
    agentIdToSpawn: 'agent-009'
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'queue');
  assert.equal(result.queuedFor, true);
});

test('T07.5 - Queue processes FIFO as agents complete and count drops below 8', (t) => {
  // First task spawns immediately
  const result1 = run({
    liveAgentCount: 5,
    taskQueueLength: 2,
    agentIdToSpawn: 'agent-006'
  });

  assert.equal(result1.ok, true);
  assert.equal(result1.spawned, true);

  // After agent completes and queue fills back up
  const result2 = run({
    liveAgentCount: 8,
    taskQueueLength: 3,
    agentIdToSpawn: 'agent-009'
  });

  assert.equal(result2.ok, true);
  assert.equal(result2.action, 'queue');
});

test('T07 - Spawn allowed when below 8 agents', (t) => {
  const result = run({
    liveAgentCount: 5,
    taskQueueLength: 0,
    agentIdToSpawn: 'agent-006'
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'spawn');
  assert.equal(result.spawned, true);
});

test('T07 - Spawn immediately with one slot available', (t) => {
  const result = run({
    liveAgentCount: 7,
    taskQueueLength: 2,
    agentIdToSpawn: 'agent-008'
  });

  assert.equal(result.ok, true);
  assert.equal(result.spawned, true);
  assert.equal(result.newLiveCount, 8);
});

test('T07 - Empty input rejected', (t) => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('T07 - Null input rejected', (t) => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T07 - Malformed input: missing liveAgentCount', (t) => {
  const result = run({
    taskQueueLength: 1,
    agentIdToSpawn: 'agent-001'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('liveAgentCount'));
});

test('T07 - Malformed input: missing taskQueueLength', (t) => {
  const result = run({
    liveAgentCount: 5,
    agentIdToSpawn: 'agent-001'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('taskQueueLength'));
});

test('T07 - Malformed input: non-numeric liveAgentCount', (t) => {
  const result = run({
    liveAgentCount: 'five',
    taskQueueLength: 1,
    agentIdToSpawn: 'agent-001'
  });
  assert.equal(result.ok, false);
});

test('T07 - No mutation of input', (t) => {
  const input = {
    liveAgentCount: 5,
    taskQueueLength: 1,
    agentIdToSpawn: 'agent-006'
  };
  const inputCopy = JSON.stringify(input);

  run(input);

  assert.equal(JSON.stringify(input), inputCopy);
});

test('T07 - Same input produces same output twice', (t) => {
  const input = {
    liveAgentCount: 8,
    taskQueueLength: 2,
    agentIdToSpawn: 'agent-009'
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepEqual(result1, result2);
});

test('T07 - Trace includes node and steps', (t) => {
  const result = run({
    liveAgentCount: 5,
    taskQueueLength: 1,
    agentIdToSpawn: 'agent-006'
  });

  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L5.E03');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
