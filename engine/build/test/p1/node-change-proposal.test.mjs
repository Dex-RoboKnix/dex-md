import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p1/node-change-proposal.mjs';

test('T09.1 Proposal fully parsed and validated on creation', () => {
  const result = run({
    proposal: { change: 'update answer', node: 'L1.E05', reason: 'clarification' }
  });
  assert.equal(result.ok, true);
  assert.equal(result.proposal.change, 'update answer');
  assert.equal(result.proposal.node, 'L1.E05');
});

test('T09.2 No vault modifications until yes===true', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({
    proposal: { action: 'delete', target: 'L1.E06' },
    yes: false,
    now
  });
  assert.equal(result.ok, true);
  assert.equal(result.applied, false);
  assert.equal(result.audit.approved, null);
});

test('T09.2a yes===true gates vault changes', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({
    proposal: { action: 'create', node: 'L1.E99' },
    yes: true,
    now
  });
  assert.equal(result.ok, true);
  assert.equal(result.applied, true);
  assert.equal(result.audit.approved, now);
});

test('T09.3 Audit file tracks approval timestamps', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({
    proposal: { test: 'proposal' },
    yes: true,
    now
  });
  assert.equal(result.ok, true);
  assert.equal(result.audit.event, 'proposal-created');
  assert.equal(result.audit.at, now);
  assert.equal(result.audit.approved, now);
});

test('T09.4 Inert proposals remain visible in checkpoint', () => {
  const result = run({
    proposal: { change: 'pending review', visible: true }
  });
  assert.equal(result.ok, true);
  assert.equal(result.proposal.visible, true);
  assert.equal(result.applied, false);
});

test('empty input (null)', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('empty input (undefined)', () => {
  const result = run(undefined);
  assert.equal(result.ok, false);
});

test('malformed input (array)', () => {
  const result = run([]);
  assert.equal(result.ok, false);
});

test('malformed input (missing proposal)', () => {
  const result = run({
    yes: false
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be/i);
});

test('malformed input (proposal not object)', () => {
  const result = run({
    proposal: 'not an object'
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be a non-array object/i);
});

test('malformed input (yes not boolean)', () => {
  const result = run({
    proposal: { test: true },
    yes: 'yes'
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be a boolean/i);
});

test('no mutation: input object unchanged', () => {
  const input = {
    proposal: { action: 'test', node: 'L1.E05' },
    yes: false
  };
  const original = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('same output twice: deterministic (except timestamp)', () => {
  const input = {
    proposal: { consistent: 'proposal' },
    yes: false
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1.proposal, result2.proposal);
  assert.equal(result1.applied, result2.applied);
});

test('trace contains node id', () => {
  const result = run({
    proposal: { test: 'proposal' }
  });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L1.E03');
  assert.ok(Array.isArray(result.trace.steps));
});
