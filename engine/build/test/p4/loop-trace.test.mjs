import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/loop-trace.mjs';

test('T11.1 Loop-trace records all phase transitions in order with timestamp', () => {
  const input = {
    taskId: 'task-001',
    now: '2026-10-09T14:30:00.123Z',
    events: [
      { type: 'phase-start', phase: 'grill' },
      { type: 'phase-end', phase: 'grill' },
      { type: 'phase-start', phase: 'spec' },
      { type: 'phase-end', phase: 'spec' },
    ],
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.length, 4);
  assert.equal(result.trace[0].type, 'phase-start');
  assert.equal(result.trace[0].phase, 'grill');
  assert.equal(result.trace[0].at, '2026-10-09T14:30:00.123Z');
});

test('T11.2 Each failure event includes failure classification', () => {
  const input = {
    taskId: 'task-002',
    now: '2026-10-09T14:30:00.123Z',
    events: [
      { type: 'failure', failureClassification: 'spec-gap' },
    ],
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace[0].failureClassification, 'spec-gap');
});

test('T11.3 Escalation, stall and retry events are logged with context', () => {
  const input = {
    taskId: 'task-003',
    now: '2026-10-09T14:30:00.123Z',
    events: [
      { type: 'escalation' },
      { type: 'stall' },
      { type: 'retry' },
    ],
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.length, 3);
  assert.equal(result.trace[0].type, 'escalation');
  assert.equal(result.trace[1].type, 'stall');
  assert.equal(result.trace[2].type, 'retry');
});

test('T11.4 Events include task id but not detailed task data', () => {
  const input = {
    taskId: 'task-004',
    now: '2026-10-09T14:30:00.123Z',
    events: [
      { type: 'completed-task' },
    ],
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace[0].taskId, 'task-004');
  assert(!result.trace[0].detailedData);
});

test('T11.5 Loop-trace is treated as immutable audit trail', () => {
  const input = {
    taskId: 'task-005',
    now: '2026-10-09T14:30:00.123Z',
    events: [
      { type: 'phase-start', phase: 'implement' },
    ],
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1.trace, result2.trace);
});

test('T11 empty input rejection', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /not an object/);
});

test('T11 missing taskId rejection', () => {
  const result = run({ events: [] });
  assert.equal(result.ok, false);
  assert.match(result.error, /taskId/);
});

test('T11 malformed events rejection', () => {
  const result = run({ taskId: 'task-001', events: 'not-an-array' });
  assert.equal(result.ok, false);
  assert.match(result.error, /array/);
});

test('T11 invalid event type rejection', () => {
  const result = run({
    taskId: 'task-001',
    events: [{ type: 'invalid-type' }],
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /invalid event type/);
});

test('T11 no mutation of input', () => {
  const input = {
    taskId: 'task-006',
    now: '2026-10-09T14:30:00.123Z',
    events: [{ type: 'phase-start', phase: 'grill' }],
  };
  const inputCopy = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), inputCopy);
});

test('T11 same output twice', () => {
  const input = {
    taskId: 'task-007',
    now: '2026-10-09T14:30:00.123Z',
    events: [{ type: 'phase-start', phase: 'grill' }],
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1.trace, result2.trace);
});

test('T11 trace includes steps', () => {
  const input = {
    taskId: 'task-008',
    now: '2026-10-09T14:30:00.123Z',
    events: [{ type: 'phase-start', phase: 'grill' }],
  };
  const result = run(input);
  assert.ok(result.trace);
  assert.ok(Array.isArray(result.steps));
  assert(result.steps.length > 0);
});
