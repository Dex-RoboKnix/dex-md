import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p1/issue-reason-gate.mjs';

test('T20.1: BLOCKS_OUTCOME code accepted', () => {
  const result = run({ reason: 'BLOCKS_OUTCOME' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.approved, true);
  assert.strictEqual(result.reason, 'BLOCKS_OUTCOME');
});

test('T20.2: COVERAGE_DROPPED code accepted', () => {
  const result = run({ reason: 'COVERAGE_DROPPED' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.reason, 'COVERAGE_DROPPED');
});

test('T20.3: CONTRADICTION code accepted', () => {
  const result = run({ reason: 'CONTRADICTION' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.reason, 'CONTRADICTION');
});

test('T20.4: SAFETY_RISK code accepted', () => {
  const result = run({ reason: 'SAFETY_RISK' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.reason, 'SAFETY_RISK');
});

test('T20.5: Only four codes hardcoded', () => {
  const result = run({ reason: 'UNKNOWN' });
  assert.strictEqual(result.ok, false);
  assert.ok(result.validReasons);
  assert.strictEqual(result.validReasons.length, 4);
});

test('T20.6: Invalid code rejected with explanation', () => {
  const result = run({ reason: 'INVALID_REASON' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /Valid reason codes are/);
});

test('T20.7: Rejection message explains allowed reasons', () => {
  const result = run({ reason: 'OTHER' });
  assert.strictEqual(result.ok, false);
  assert.ok(result.error.includes('BLOCKS_OUTCOME'));
  assert.ok(result.error.includes('COVERAGE_DROPPED'));
  assert.ok(result.error.includes('CONTRADICTION'));
  assert.ok(result.error.includes('SAFETY_RISK'));
});

test('T20.8: Audit log tracks reason code', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({
    reason: 'BLOCKS_OUTCOME',
    requester: 'user@example.com',
    now
  });
  assert.strictEqual(result.ok, true);
  assert.ok(result.audit);
  assert.strictEqual(result.audit.event, 'issue-reason-validated');
  assert.strictEqual(result.audit.reasonCode, 'BLOCKS_OUTCOME');
});

test('T20.9: Audit log tracks requester', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({
    reason: 'COVERAGE_DROPPED',
    requester: 'alice',
    now
  });
  assert.strictEqual(result.audit.requester, 'alice');
});

test('T20.10: Audit log tracks supplied text', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({
    reason: 'SAFETY_RISK',
    text: 'Potential security issue found',
    now
  });
  assert.ok(result.audit.suppliedText);
  assert.strictEqual(result.audit.suppliedText, 'Potential security issue found');
});

test('T20.11: Audit log includes timestamp', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({ reason: 'CONTRADICTION', now });
  assert.ok(result.audit.at);
  assert.strictEqual(result.audit.at, now);
});

test('T20.12: Next steps documented in audit', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({ reason: 'BLOCKS_OUTCOME', now });
  assert.ok(result.audit.nextSteps);
});

test('T20.13: Empty reason rejected', () => {
  const result = run({ reason: '' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /cannot be empty/);
});

test('T20.14: Non-string reason rejected', () => {
  const result = run({ reason: 123 });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be a string/);
});

test('T20.15: No mutation of input', () => {
  const input = { reason: 'BLOCKS_OUTCOME', requester: 'user' };
  const originalReason = input.reason;
  run(input);
  assert.strictEqual(input.reason, originalReason);
});

test('T20.16: Same input produces same output', () => {
  const input = {
    reason: 'COVERAGE_DROPPED',
    text: 'Coverage dropped 5%',
    requester: 'bob'
  };
  const result1 = run(input);
  const result2 = run(input);
  // Timestamps will differ, so compare without audit.timestamp
  assert.deepStrictEqual(result1.reason, result2.reason);
  assert.deepStrictEqual(result1.ok, result2.ok);
});

test('T20.17: Trace includes node and steps', () => {
  const result = run({ reason: 'SAFETY_RISK' });
  assert.ok(result.trace);
  assert.strictEqual(result.trace.node, 'L3.E03');
  assert.ok(Array.isArray(result.trace.steps));
});

test('T20.18: Non-object input rejected', () => {
  const result = run('BLOCKS_OUTCOME');
  assert.strictEqual(result.ok, false);
});

test('T20.19: Case-sensitive codes required', () => {
  const result = run({ reason: 'blocks_outcome' });
  assert.strictEqual(result.ok, false);
});

test('T20.20: All four codes work independently', () => {
  for (const code of ['BLOCKS_OUTCOME', 'COVERAGE_DROPPED', 'CONTRADICTION', 'SAFETY_RISK']) {
    const result = run({ reason: code });
    assert.strictEqual(result.ok, true, `Code ${code} should be accepted`);
  }
});
