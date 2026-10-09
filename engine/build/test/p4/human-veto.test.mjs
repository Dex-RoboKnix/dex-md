import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/human-veto.mjs';

test('T19.1 Layer 8 veto flag is read from config or state file', () => {
  const input = {
    vetoFlag: true,
    pendingActions: ['action-1', 'action-2'],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.vetoHonored, true);
});

test('T19.2 When veto is set, all pending actions system-wide are cancelled', () => {
  const input = {
    vetoFlag: true,
    pendingActions: ['action-1', 'action-2', 'action-3', 'action-4'],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.result.cancelledActionCount, 4);
  assert.deepEqual(result.result.cancelledActions, ['action-1', 'action-2', 'action-3', 'action-4']);
});

test('T19.3 Actions in-flight complete but results are discarded', () => {
  const input = {
    vetoFlag: true,
    pendingActions: ['in-flight-1', 'pending-1', 'in-flight-2', 'pending-2'],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  // Some actions are in-flight and complete but their results are discarded
  assert(result.result.discardedInFlightCount > 0);
});

test('T19.4 Human authority (veto) overrides all automation', () => {
  const input = {
    vetoFlag: true,
    pendingActions: ['escalation-action', 'retry-action', 'stall-recovery'],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  // All automated actions (escalation, retry, stall-recovery) are cancelled
  assert.equal(result.result.cancelledActionCount, 3);
});

test('T19.5 Veto can override escalation, stall detection or loop decisions', () => {
  const input = {
    vetoFlag: true,
    pendingActions: ['escalation', 'loop-retry', 'stall-response'],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.vetoHonored, true);
  assert(result.result.cancelledActions.includes('escalation'));
  assert(result.result.cancelledActions.includes('loop-retry'));
  assert(result.result.cancelledActions.includes('stall-response'));
});

test('T19 empty input rejection', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /not an object/);
});

test('T19 missing vetoFlag rejection', () => {
  const result = run({ pendingActions: [] });
  assert.equal(result.ok, false);
  assert.match(result.error, /vetoFlag/);
});

test('T19 invalid vetoFlag rejection', () => {
  const result = run({ vetoFlag: 'true', pendingActions: [] });
  assert.equal(result.ok, false);
  assert.match(result.error, /vetoFlag/);
});

test('T19 missing pendingActions rejection', () => {
  const result = run({ vetoFlag: false });
  assert.equal(result.ok, false);
  assert.match(result.error, /pendingActions/);
});

test('T19 malformed pendingActions rejection', () => {
  const result = run({ vetoFlag: false, pendingActions: 'not-an-array' });
  assert.equal(result.ok, false);
  assert.match(result.error, /array/);
});

test('T19 non-string action rejection', () => {
  const result = run({
    vetoFlag: false,
    pendingActions: ['action-1', 123, 'action-2'],
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /strings/);
});

test('T19 no veto set allows normal operation', () => {
  const input = {
    vetoFlag: false,
    pendingActions: ['action-1', 'action-2'],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.vetoHonored, false);
  assert.equal(result.result.cancelledActionCount, 0);
});

test('T19 empty pendingActions with veto', () => {
  const input = {
    vetoFlag: true,
    pendingActions: [],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.vetoHonored, true);
  assert.equal(result.result.cancelledActionCount, 0);
});

test('T19 no mutation of input', () => {
  const input = {
    vetoFlag: true,
    pendingActions: ['action-1', 'action-2'],
    now: '2026-10-09T14:30:00.123Z',
  };
  const inputCopy = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), inputCopy);
});

test('T19 same output twice', () => {
  const input = {
    vetoFlag: false,
    pendingActions: ['action-1', 'action-2'],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.equal(result1.vetoHonored, result2.vetoHonored);
  assert.equal(result1.result.cancelledActionCount, result2.result.cancelledActionCount);
});

test('T19 trace includes steps', () => {
  const input = {
    vetoFlag: true,
    pendingActions: ['test-action'],
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.ok(Array.isArray(result.steps));
  assert(result.steps.length > 0);
});
