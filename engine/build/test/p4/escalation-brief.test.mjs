import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/escalation-brief.mjs';

test('T14.1 Orchestrator assembles brief after escalation is triggered', () => {
  const input = {
    taskId: 'task-001',
    priorSpec: 'original spec text',
    priorOutputs: ['output-1', 'output-2'],
    reviewFeedback: 'Review failed: spec gap identified',
    failureClassifications: ['spec-gap'],
    priorAgentAttempts: [{ agentId: 'agent-001', model: 'Sonnet' }],
    vaultLogPath: 'logs/task-001/full-context.md',
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.brief);
});

test('T14.2 Brief includes prior spec, all outputs, review feedback and failure classifications', () => {
  const input = {
    taskId: 'task-002',
    priorSpec: 'spec v1',
    priorOutputs: ['output-a', 'output-b', 'output-c'],
    reviewFeedback: 'Multiple issues detected',
    failureClassifications: ['impl-bug', 'test-gap'],
    priorAgentAttempts: [{ agentId: 'agent-002', model: 'Haiku' }],
    vaultLogPath: 'logs/task-002/context.md',
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.brief.priorOutputCount, 3);
  assert.deepEqual(result.brief.priorOutputs, ['output-a', 'output-b', 'output-c']);
  assert.equal(result.brief.reviewFeedback, 'Multiple issues detected');
  assert.deepEqual(result.brief.failureClassifications, ['impl-bug', 'test-gap']);
});

test('T14.3 Full traceability shows which agents and models attempted task and how they failed', () => {
  const input = {
    taskId: 'task-003',
    priorSpec: 'spec',
    priorOutputs: ['output-1'],
    reviewFeedback: 'Feedback',
    failureClassifications: ['spec-gap', 'impl-bug'],
    priorAgentAttempts: [
      { agentId: 'agent-003a', model: 'Sonnet' },
      { agentId: 'agent-003b', model: 'Haiku' },
    ],
    vaultLogPath: 'logs/task-003/trace.md',
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.brief.traceability.agentIds, ['agent-003a', 'agent-003b']);
  assert.ok(result.brief.traceability.models.includes('Sonnet'));
  assert.ok(result.brief.traceability.models.includes('Haiku'));
});

test('T14.4 Agent ids are included for audit trail', () => {
  const input = {
    taskId: 'task-004',
    priorSpec: 'spec',
    priorOutputs: ['output-1'],
    reviewFeedback: 'Feedback',
    failureClassifications: ['environment'],
    priorAgentAttempts: [{ agentId: 'agent-004-uid', model: 'Opus' }],
    vaultLogPath: 'logs/task-004/path.md',
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.brief.agentHistory[0].agentId, 'agent-004-uid');
});

test('T14.5 Brief links to full task logs in vault so Opus can read complete context', () => {
  const input = {
    taskId: 'task-005',
    priorSpec: 'spec',
    priorOutputs: ['output-1'],
    reviewFeedback: 'Feedback',
    failureClassifications: ['test-gap'],
    priorAgentAttempts: [{ agentId: 'agent-005', model: 'Sonnet' }],
    vaultLogPath: 'logs/task-005/complete-context.md',
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.brief.vaultLogPath, 'logs/task-005/complete-context.md');
});

test('T14 empty input rejection', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /not an object/);
});

test('T14 missing taskId rejection', () => {
  const result = run({
    priorSpec: 'spec',
    priorOutputs: [],
    reviewFeedback: 'feedback',
    failureClassifications: [],
    priorAgentAttempts: [],
    vaultLogPath: 'path',
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /taskId/);
});

test('T14 missing priorSpec rejection', () => {
  const result = run({
    taskId: 'task-006',
    priorOutputs: [],
    reviewFeedback: 'feedback',
    failureClassifications: [],
    priorAgentAttempts: [],
    vaultLogPath: 'path',
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /priorSpec/);
});

test('T14 malformed priorOutputs rejection', () => {
  const result = run({
    taskId: 'task-007',
    priorSpec: 'spec',
    priorOutputs: 'not-an-array',
    reviewFeedback: 'feedback',
    failureClassifications: [],
    priorAgentAttempts: [],
    vaultLogPath: 'path',
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /array/);
});

test('T14 no mutation of input', () => {
  const input = {
    taskId: 'task-008',
    priorSpec: 'spec',
    priorOutputs: ['output-1'],
    reviewFeedback: 'feedback',
    failureClassifications: ['spec-gap'],
    priorAgentAttempts: [{ agentId: 'agent-008', model: 'Sonnet' }],
    vaultLogPath: 'logs/task-008/path.md',
    now: '2026-10-09T14:30:00.123Z',
  };
  const inputCopy = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), inputCopy);
});

test('T14 same output twice', () => {
  const input = {
    taskId: 'task-009',
    priorSpec: 'spec',
    priorOutputs: ['output-1'],
    reviewFeedback: 'feedback',
    failureClassifications: ['impl-bug'],
    priorAgentAttempts: [{ agentId: 'agent-009', model: 'Haiku' }],
    vaultLogPath: 'logs/task-009/path.md',
    now: '2026-10-09T14:30:00.123Z',
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1.brief.traceability, result2.brief.traceability);
});

test('T14 trace includes steps', () => {
  const input = {
    taskId: 'task-010',
    priorSpec: 'spec',
    priorOutputs: [],
    reviewFeedback: 'feedback',
    failureClassifications: [],
    priorAgentAttempts: [],
    vaultLogPath: 'logs/path.md',
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.ok(Array.isArray(result.steps));
  assert(result.steps.length > 0);
});
