import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/fail-classify.mjs';

test('T12.1 Review agent classifies failure at end of review phase', () => {
  const input = {
    taskId: 'task-001',
    failureEvidence: { type: 'spec-gap', symptoms: 'missing requirement' },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'spec-gap');
});

test('T12.2 Root cause is identified when multiple failure types are present', () => {
  const input = {
    taskId: 'task-002',
    failureEvidence: { type: 'impl-bug', symptoms: 'TypeError in function', context: 'caused by spec misunderstanding' },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'impl-bug');
  assert.ok(result.result.evidence.context);
});

test('T12.3 Classification feeds into retry-delta routing and escalation decisions', () => {
  const input = {
    taskId: 'task-003',
    failureEvidence: { type: 'test-gap', symptoms: 'missing test case' },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.result.classification, 'test-gap');
});

test('T12.4 Environment failures are limited to infrastructure', () => {
  const input = {
    taskId: 'task-004',
    failureEvidence: { type: 'environment', symptoms: 'API down' },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'environment');
});

test('T12.5 Failure classification is recorded in loop-trace for audit', () => {
  const input = {
    taskId: 'task-005',
    failureEvidence: { type: 'impl-bug' },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.audit.event, 'failure-classified');
  assert.equal(result.audit.classification, 'impl-bug');
});

test('T12 empty input rejection', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /not an object/);
});

test('T12 missing taskId rejection', () => {
  const result = run({ failureEvidence: { type: 'spec-gap' } });
  assert.equal(result.ok, false);
  assert.match(result.error, /taskId/);
});

test('T12 missing failureEvidence rejection', () => {
  const result = run({ taskId: 'task-001' });
  assert.equal(result.ok, false);
  assert.match(result.error, /failureEvidence/);
});

test('T12 missing failureEvidence.type rejection', () => {
  const result = run({ taskId: 'task-001', failureEvidence: {} });
  assert.equal(result.ok, false);
  assert.match(result.error, /type/);
});

test('T12 invalid failure type rejection', () => {
  const result = run({ taskId: 'task-001', failureEvidence: { type: 'unknown-type' } });
  assert.equal(result.ok, false);
  assert.match(result.error, /unable to classify/);
});

test('T12 no mutation of input', () => {
  const input = {
    taskId: 'task-006',
    failureEvidence: { type: 'spec-gap', symptoms: 'test' },
    now: '2026-10-09T14:30:00.123Z',
  };
  const inputCopy = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), inputCopy);
});

test('T12 same output twice', () => {
  const input = {
    taskId: 'task-007',
    failureEvidence: { type: 'impl-bug' },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.equal(result1.classification, result2.classification);
});

test('T12 trace includes steps', () => {
  const input = {
    taskId: 'task-008',
    failureEvidence: { type: 'spec-gap' },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.ok(Array.isArray(result.steps));
  assert(result.steps.length > 0);
});
