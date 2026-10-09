import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/spec-status.mjs';

test('T06.1: FINAL spec reverts to DRAFT only when amend call makes actual changes', () => {
  const result = run({ state: 'FINAL', action: 'amend', amendment: { text: 'new' } });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'DRAFT');
  assert.equal(result.stateChanged, true);
});

test('T06.1: FINAL spec remains FINAL if amend has no changes', () => {
  const result = run({ state: 'FINAL', action: 'amend', amendment: {} });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'FINAL');
  assert.equal(result.stateChanged, false);
});

test('T06.2: FINAL spec blocks all write operations except amend', () => {
  const result = run({ state: 'FINAL', action: 'write' });
  assert.equal(result.ok, false);
  assert(result.error.includes('blocks write'));
});

test('T06.3: Read operations are allowed on FINAL specs', () => {
  const result = run({ state: 'FINAL', action: 'read' });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'FINAL');
});

test('T06.4: State log records actor, timestamp, and reason for every state transition', () => {
  const result = run({
    state: 'DRAFT',
    action: 'finalise',
    reviewPass: true,
    actor: 'user@example.com',
    reason: 'Phase 1 complete',
    now: '2026-10-09T12:00:00Z'
  });
  assert.equal(result.ok, true);
  assert.equal(result.audit.actor, 'user@example.com');
  assert.equal(result.audit.at, '2026-10-09T12:00:00Z');
  assert.equal(result.audit.reason, 'Phase 1 complete');
});

test('T06.5: DRAFT becomes FINAL only after dex-review PASS', () => {
  const result = run({ state: 'DRAFT', action: 'finalise', reviewPass: false });
  assert.equal(result.ok, false);
  assert(result.error.includes('review PASS'));
});

test('T06.5: DRAFT can become FINAL with review PASS', () => {
  const result = run({ state: 'DRAFT', action: 'finalise', reviewPass: true });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'FINAL');
});

test('T06: invalid state returns error', () => {
  const result = run({ state: 'INVALID', action: 'read' });
  assert.equal(result.ok, false);
});

test('T06: invalid action returns error', () => {
  const result = run({ state: 'DRAFT', action: 'invalid' });
  assert.equal(result.ok, false);
});

test('T06: no mutation of input', () => {
  const input = { state: 'DRAFT', action: 'read' };
  const orig = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), orig);
});

test('T06: same input produces same output twice', () => {
  const input = { state: 'FINAL', action: 'read' };
  const r1 = run(input);
  const r2 = run(input);
  assert.deepEqual(r1, r2);
});

test('T06: trace includes node id', () => {
  const result = run({ state: 'DRAFT', action: 'read' });
  assert.equal(result.trace.node, 'L5.E03');
  assert(Array.isArray(result.trace.steps));
});

test('T06: audit record created', () => {
  const result = run({ state: 'FINAL', action: 'read' });
  assert.equal(result.ok, true);
  assert(result.audit);
  assert(result.audit.event);
});
