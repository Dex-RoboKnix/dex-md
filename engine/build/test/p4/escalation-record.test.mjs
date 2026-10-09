import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/escalation-record.mjs';

test('T15.1 Escalation record includes date, outcome, Opus model and Sonnet team model', () => {
  const input = {
    taskId: 'task-001',
    outcome: 'pass',
    opusModel: 'claude-opus',
    sonnetTeamModel: 'claude-sonnet',
    attemptCount: 2,
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.record.outcome, 'pass');
  assert.equal(result.record.opusModel, 'claude-opus');
  assert.equal(result.record.sonnetTeamModel, 'claude-sonnet');
  assert.equal(result.record.escalationDate, '2026-10-09T14:30:00.123Z');
});

test('T15.2 Task id and attempt count are recorded for audit', () => {
  const input = {
    taskId: 'task-002',
    outcome: 'fail',
    opusModel: 'claude-opus',
    sonnetTeamModel: 'claude-sonnet',
    attemptCount: 2,
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.record.taskId, 'task-002');
  assert.equal(result.record.attemptCount, 2);
  assert.equal(result.audit.taskId, 'task-002');
  assert.equal(result.audit.attemptCount, 2);
});

test('T15.3 Escalation-failed is recorded if Opus agent fails to start', () => {
  const input = {
    taskId: 'task-003',
    outcome: 'fail',
    opusModel: 'claude-opus',
    sonnetTeamModel: 'claude-sonnet',
    attemptCount: 1,
    errorDetails: 'Opus agent failed to initialize',
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.record.outcome, 'fail');
  assert.equal(result.record.errorDetails, 'Opus agent failed to initialize');
});

test('T15.4 Records are retained indefinitely in vault', () => {
  const input = {
    taskId: 'task-004',
    outcome: 'pass',
    opusModel: 'claude-opus',
    sonnetTeamModel: 'claude-sonnet',
    attemptCount: 2,
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.effects);
  assert.ok(result.effects[0].path.includes('logs/escalation'));
  assert.ok(result.effects[0].path.includes('task-004'));
});

test('T15.5 Records support audit trail and governance review', () => {
  const input = {
    taskId: 'task-005',
    outcome: 'pass',
    opusModel: 'claude-opus-latest',
    sonnetTeamModel: 'claude-sonnet-latest',
    attemptCount: 3,
    now: '2026-10-09T15:45:30.456Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.audit.event, 'escalation-recorded');
  assert.equal(result.audit.outcome, 'pass');
  assert.ok(result.effects);
});

test('T15 empty input rejection', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /not an object/);
});

test('T15 missing taskId rejection', () => {
  const result = run({
    outcome: 'pass',
    opusModel: 'model-1',
    sonnetTeamModel: 'model-2',
    attemptCount: 1,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /taskId/);
});

test('T15 missing outcome rejection', () => {
  const result = run({
    taskId: 'task-006',
    opusModel: 'model-1',
    sonnetTeamModel: 'model-2',
    attemptCount: 1,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /outcome/);
});

test('T15 invalid outcome rejection', () => {
  const result = run({
    taskId: 'task-007',
    outcome: 'unknown',
    opusModel: 'model-1',
    sonnetTeamModel: 'model-2',
    attemptCount: 1,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /outcome/);
});

test('T15 missing opusModel rejection', () => {
  const result = run({
    taskId: 'task-008',
    outcome: 'pass',
    sonnetTeamModel: 'model-2',
    attemptCount: 1,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /opusModel/);
});

test('T15 invalid attemptCount rejection', () => {
  const result = run({
    taskId: 'task-009',
    outcome: 'pass',
    opusModel: 'model-1',
    sonnetTeamModel: 'model-2',
    attemptCount: 0,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /attemptCount/);
});

test('T15 no mutation of input', () => {
  const input = {
    taskId: 'task-010',
    outcome: 'pass',
    opusModel: 'model-1',
    sonnetTeamModel: 'model-2',
    attemptCount: 1,
    now: '2026-10-09T14:30:00.123Z',
  };
  const inputCopy = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), inputCopy);
});

test('T15 same output twice', () => {
  const input = {
    taskId: 'task-011',
    outcome: 'fail',
    opusModel: 'model-1',
    sonnetTeamModel: 'model-2',
    attemptCount: 2,
    now: '2026-10-09T14:30:00.123Z',
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.equal(result1.record.outcome, result2.record.outcome);
  assert.equal(result1.record.attemptCount, result2.record.attemptCount);
});

test('T15 effects contain audit trail information', () => {
  const input = {
    taskId: 'task-012',
    outcome: 'pass',
    opusModel: 'model-1',
    sonnetTeamModel: 'model-2',
    attemptCount: 1,
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.ok(Array.isArray(result.effects));
  assert.equal(result.effects[0].kind, 'write-file');
  assert.match(result.effects[0].content, /taskId.*task-012/);
});
