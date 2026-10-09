import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/reasoning-capture.mjs';

test('T08.1 - Reasoning log captures explicit reasoning text only', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 'I will start by analyzing the spec carefully.',
    now: '2026-10-09T10:30:00.000Z'
  });

  assert.equal(result.ok, true);
  assert.equal(result.reasoningRecord.reasoning, 'I will start by analyzing the spec carefully.');
  // No tool calls or results in the reasoning field
});

test('T08.2 - Each log record has ISO 8601 UTC timestamp with millisecond precision', (t) => {
  const now = '2026-10-09T10:30:45.123Z';
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 'Second reasoning statement',
    now
  });

  assert.equal(result.ok, true);
  assert.equal(result.reasoningRecord.timestamp, now);
  // Verify ISO 8601 format
  assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(now));
});

test('T08.3 - Agent id recorded with each reasoning statement', (t) => {
  const result = run({
    agentId: 'agent-xyz',
    taskId: 'task-001',
    reasoningText: 'My reasoning here',
    now: '2026-10-09T10:30:00.000Z'
  });

  assert.equal(result.ok, true);
  assert.equal(result.reasoningRecord.agentId, 'agent-xyz');
});

test('T08.4 - Agent restart creates new log record with restart annotation', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 'Resuming after restart',
    now: '2026-10-09T10:31:00.000Z',
    agentRestart: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.reasoningRecord.restart, true);
  // Effects include restart annotation
  const logContent = result.effects[0].content;
  assert(logContent.includes('[RESTART]'));
});

test('T08.5 - All reasoning records for task linked by task id', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 'First statement',
    now: '2026-10-09T10:30:00.000Z'
  });

  assert.equal(result.ok, true);
  assert.equal(result.reasoningRecord.taskId, 'task-001');
  // Task id links all reasoning records
});

test('T08.6 - Reasoning log asserts effects (append to log file)', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 'Test reasoning',
    now: '2026-10-09T10:30:00.000Z'
  });

  assert.equal(result.ok, true);
  assert(Array.isArray(result.effects));
  assert.equal(result.effects.length, 1);
  assert.equal(result.effects[0].kind, 'append-log');
  assert(result.effects[0].path.includes('reasoning'));
  assert(result.effects[0].content);
});

test('T08 - Reasoning with null timestamp allowed', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 'Reasoning without timestamp',
    now: null
  });

  assert.equal(result.ok, true);
  assert.equal(result.reasoningRecord.timestamp, null);
});

test('T08 - Reasoning with missing now falls back to null', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 'Reasoning without now'
  });

  assert.equal(result.ok, true);
  assert.equal(result.reasoningRecord.timestamp, null);
});

test('T08 - Empty input rejected', (t) => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('T08 - Null input rejected', (t) => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T08 - Malformed input: missing agentId', (t) => {
  const result = run({
    taskId: 'task-001',
    reasoningText: 'text'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('agentId'));
});

test('T08 - Malformed input: missing taskId', (t) => {
  const result = run({
    agentId: 'agent-001',
    reasoningText: 'text'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('taskId'));
});

test('T08 - Malformed input: missing reasoningText', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('reasoningText'));
});

test('T08 - Malformed input: empty reasoningText', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: ''
  });
  assert.equal(result.ok, false);
});

test('T08 - Malformed input: null reasoningText', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: null
  });
  assert.equal(result.ok, false);
});

test('T08 - Malformed input: non-string reasoningText', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 12345
  });
  assert.equal(result.ok, false);
});

test('T08 - No mutation of input', (t) => {
  const input = {
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 'text',
    now: '2026-10-09T10:30:00.000Z'
  };
  const inputCopy = JSON.stringify(input);

  run(input);

  assert.equal(JSON.stringify(input), inputCopy);
});

test('T08 - Same input produces same output twice', (t) => {
  const input = {
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 'text',
    now: '2026-10-09T10:30:00.000Z'
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepEqual(result1, result2);
});

test('T08 - Trace includes node and steps', (t) => {
  const result = run({
    agentId: 'agent-001',
    taskId: 'task-001',
    reasoningText: 'text',
    now: '2026-10-09T10:30:00.000Z'
  });

  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L1.E04');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
