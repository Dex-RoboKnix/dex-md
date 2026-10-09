import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/attempt-cap.mjs';

test('T02.1 - Review failure at round 2 triggers escalation', (t) => {
  const result = run({
    attemptCount: 2,
    reviewPassed: false,
    delta: 'material spec change'
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'escalate');
  assert.equal(result.escalationTriggered, true);
});

test('T02.2 - Escalation action returned before retry is considered', (t) => {
  const result = run({
    attemptCount: 2,
    reviewPassed: false,
    delta: 'material spec change'
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'escalate');
  // Action is returned immediately, no retry offered
  assert(!result.nextAttempt);
});

test('T02.3 - Blind retry (empty delta) rejected without escalation', (t) => {
  const result = run({
    attemptCount: 1,
    reviewPassed: false,
    delta: ''
  });

  assert.equal(result.ok, false);
  assert(result.error.includes('blind retry'));
});

test('T02.3 - Blind retry (missing delta) rejected', (t) => {
  const result = run({
    attemptCount: 1,
    reviewPassed: false
  });

  assert.equal(result.ok, false);
  assert(result.error.includes('blind retry'));
});

test('T02.4 - Escalation-failed outcome recorded when escalation does not pass', (t) => {
  const result = run({
    attemptCount: 2,
    reviewPassed: false,
    delta: 'spec delta',
    escalationOutcome: 'failed'
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'escalate');
  assert.equal(result.escalationOutcome, 'failed');
});

test('T02.5 - Task terminates at escalation outcome', (t) => {
  const result = run({
    attemptCount: 2,
    reviewPassed: false,
    delta: 'spec delta',
    escalationOutcome: 'failed'
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'escalate');
  // Task will terminate (no further action field after escalate)
});

test('T02 - Review passed allows task to continue', (t) => {
  const result = run({
    attemptCount: 1,
    reviewPassed: true,
    delta: null
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'continue');
  assert.equal(result.taskStatus, 'passed');
});

test('T02 - Review failure at attempt 1 allows retry', (t) => {
  const result = run({
    attemptCount: 1,
    reviewPassed: false,
    delta: 'material delta'
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'retry');
  assert.equal(result.nextAttempt, 2);
});

test('T02 - Empty input rejected', (t) => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('T02 - Null input rejected', (t) => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T02 - Malformed input: missing attemptCount', (t) => {
  const result = run({
    reviewPassed: false,
    delta: 'delta'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('attemptCount'));
});

test('T02 - Malformed input: missing reviewPassed', (t) => {
  const result = run({
    attemptCount: 1,
    delta: 'delta'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('reviewPassed'));
});

test('T02 - Malformed input: non-numeric attemptCount', (t) => {
  const result = run({
    attemptCount: 'two',
    reviewPassed: false,
    delta: 'delta'
  });
  assert.equal(result.ok, false);
});

test('T02 - No mutation of input', (t) => {
  const input = {
    attemptCount: 1,
    reviewPassed: false,
    delta: 'material delta'
  };
  const inputCopy = JSON.stringify(input);

  run(input);

  assert.equal(JSON.stringify(input), inputCopy);
});

test('T02 - Same input produces same output twice', (t) => {
  const input = {
    attemptCount: 2,
    reviewPassed: false,
    delta: 'delta'
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepEqual(result1, result2);
});

test('T02 - Trace includes node and steps', (t) => {
  const result = run({
    attemptCount: 2,
    reviewPassed: false,
    delta: 'delta'
  });

  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L2.E07');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
