import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/grill-vague.mjs';

test('T04.1: Vague answers are detected automatically without manual marking', () => {
  const result = run({ answer: 'I think maybe yes' });
  assert.equal(result.ok, true);
  assert.equal(result.isVague, true);
  assert(result.audit.at !== undefined);
});

test('T04.1: Clear answers are not marked as vague', () => {
  const result = run({ answer: 'Definitely yes' });
  assert.equal(result.ok, true);
  assert.equal(result.isVague, false);
  assert.equal(result.quality, 'clear');
});

test('T04.2: Only one follow-up question is allowed per vague answer', () => {
  const result = run({ answer: 'I think so' });
  assert.equal(result.ok, true);
  assert.equal(result.isVague, true);
  assert.equal(result.followUpAllowed, true);
});

test('T04.3: If follow-up answer is also vague, mark weak immediately', () => {
  const result = run({ answer: 'maybe', followUp: 'I guess so' });
  assert.equal(result.ok, true);
  assert.equal(result.quality, 'weak');
  assert.equal(result.audit.reason, 'vague-followup-also-vague');
});

test('T04.3: Follow-up that resolves vagueness clears the answer', () => {
  const result = run({ answer: 'maybe', followUp: 'Yes, confirmed' });
  assert.equal(result.ok, true);
  assert.equal(result.quality, 'clarified');
  assert.equal(result.followUpResolved, true);
});

test('T04.4: Audit trail records the follow-up attempt and result', () => {
  const result = run({ answer: 'I think yes', followUp: 'Definitely', now: '2026-10-09T12:00:00Z' });
  assert.equal(result.ok, true);
  assert.equal(result.audit.event, 'answer-clarified');
  assert.equal(result.audit.at, '2026-10-09T12:00:00Z');
  assert.equal(result.audit.followUpProvided, true);
  assert.equal(result.audit.followUpIsVague, false);
});

test('T04: vague answer with no follow-up marked weak', () => {
  const result = run({ answer: 'sort of' });
  assert.equal(result.ok, true);
  assert.equal(result.quality, 'weak');
  assert.equal(result.audit.reason, 'vague-no-followup');
});

test('T04: empty answer returns error', () => {
  const result = run({ answer: '' });
  assert.equal(result.ok, false);
});

test('T04: no mutation of input', () => {
  const input = { answer: 'maybe yes', followUp: 'confirmed' };
  const orig = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), orig);
});

test('T04: same input produces same output twice', () => {
  const input = { answer: 'I think so', followUp: 'Yes' };
  const r1 = run(input);
  const r2 = run(input);
  assert.deepEqual(r1, r2);
});

test('T04: trace includes node id', () => {
  const result = run({ answer: 'test' });
  assert.equal(result.trace.node, 'L2.E03');
  assert(Array.isArray(result.trace.steps));
});
