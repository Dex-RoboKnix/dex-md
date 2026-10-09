import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/install-consent.mjs';

test('T16.1 Each action needs its own recorded yes', () => {
  const result = run({
    actionId: 'fetch-001',
    actionName: 'fetch',
    consentGiven: true,
    now: '2026-10-09T12:00:00Z'
  });
  assert.equal(result.ok, true);
  assert.equal(result.consentGiven, true);
  assert(result.audit);
  assert.equal(result.audit.actionId, 'fetch-001');
  assert.equal(result.audit.event, 'consent-granted');
});

test('T16.2 A yes for one action never authorises another', () => {
  const result1 = run({
    actionId: 'fetch-001',
    actionName: 'fetch',
    consentGiven: true
  });

  const result2 = run({
    actionId: 'write-file-001',
    actionName: 'write-file',
    consentGiven: false
  });

  // Each action has its own audit entry; first consent does not apply to second
  assert.notDeepEqual(result1.audit, result2.audit);
  assert.equal(result1.audit.actionId, 'fetch-001');
  assert.equal(result2.audit.actionId, 'write-file-001');
});

test('T16.3 Re-run requires explicit new consent', () => {
  // First run: consent was granted
  const firstRun = run({
    actionId: 'fetch-001',
    actionName: 'fetch',
    consentGiven: true
  });

  // Re-run: must ask again (no carryover)
  const rerun = run({
    actionId: 'fetch-001',
    actionName: 'fetch',
    consentGiven: false  // On re-run, user denies
  });

  // Different consent decisions recorded separately
  assert.equal(firstRun.audit.consentGiven, true);
  assert.equal(rerun.audit.consentGiven, false);
});

test('T16.4 RUNLOG records every consent decision with action', () => {
  const result = run({
    actionId: 'issue-create-001',
    actionName: 'issue-create',
    consentGiven: true,
    now: '2026-10-09T14:30:00Z'
  });

  assert.equal(result.ok, true);
  assert(result.effects);
  assert(Array.isArray(result.effects));

  // Check that an effect to append to RUNLOG is present
  const runlogEffect = result.effects.find(e => e.path === 'RUNLOG');
  assert(runlogEffect);
  assert.equal(runlogEffect.kind, 'append-log');

  // Assert audit content in the effect
  const auditContent = JSON.parse(runlogEffect.content);
  assert.equal(auditContent.event, 'consent-granted');
  assert.equal(auditContent.actionId, 'issue-create-001');
  assert.equal(auditContent.at, '2026-10-09T14:30:00Z');
});

test('Audit entry records timestamp from input.now', () => {
  const timestamp = '2026-10-09T10:15:30Z';
  const result = run({
    actionId: 'test-001',
    actionName: 'test-action',
    consentGiven: true,
    now: timestamp
  });

  assert.equal(result.audit.at, timestamp);
});

test('Audit entry has null timestamp when now omitted', () => {
  const result = run({
    actionId: 'test-001',
    actionName: 'test-action',
    consentGiven: true
  });

  assert.equal(result.audit.at, null);
});

test('Consent denied also recorded in audit', () => {
  const result = run({
    actionId: 'denied-001',
    actionName: 'fetch',
    consentGiven: false
  });

  assert.equal(result.ok, true);
  assert.equal(result.audit.event, 'consent-denied');
  assert.equal(result.consentGiven, false);
});

test('Empty actionId rejected', () => {
  const result = run({
    actionId: '',
    actionName: 'fetch',
    consentGiven: true
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing actionId rejected', () => {
  const result = run({
    actionName: 'fetch',
    consentGiven: true
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Empty actionName rejected', () => {
  const result = run({
    actionId: 'test-001',
    actionName: '',
    consentGiven: true
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing actionName rejected', () => {
  const result = run({
    actionId: 'test-001',
    consentGiven: true
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Non-boolean consentGiven rejected', () => {
  const result = run({
    actionId: 'test-001',
    actionName: 'fetch',
    consentGiven: 'true'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing consentGiven rejected', () => {
  const result = run({
    actionId: 'test-001',
    actionName: 'fetch'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Non-string now rejected', () => {
  const result = run({
    actionId: 'test-001',
    actionName: 'fetch',
    consentGiven: true,
    now: 12345
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert(result.error);
});

test('No mutation of input', () => {
  const input = {
    actionId: 'test-001',
    actionName: 'fetch',
    consentGiven: true,
    now: '2026-10-09T12:00:00Z'
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    actionId: 'test-001',
    actionName: 'fetch',
    consentGiven: true
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    actionId: 'test-001',
    actionName: 'fetch',
    consentGiven: true
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L3.E03');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
