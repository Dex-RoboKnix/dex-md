import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/review-verdict.mjs';

test('T12.1 Verdict is FAIL if any finding has blocker flag', () => {
  const input = {
    findings: [
      { description: 'Code style issue', blocker: false },
      { description: 'Memory leak', blocker: true }
    ]
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.verdict, 'FAIL');
});

test('T12.2 Verdict is PASS if findings list is empty', () => {
  const input = { findings: [] };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.verdict, 'PASS');
});

test('T12.3 Multiple blockers reported in summary', () => {
  const input = {
    findings: [
      { description: 'Issue A', blocker: true },
      { description: 'Issue B', blocker: true },
      { description: 'Warning C', blocker: false }
    ]
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.verdict, 'FAIL');
  assert.equal(result.blockers.length, 2);
  assert.match(result.summary, /Issue A/);
  assert.match(result.summary, /Issue B/);
});

test('T12.4 Verdict report includes context about blocking finding', () => {
  const input = {
    findings: [
      { description: 'Critical security vulnerability found', blocker: true }
    ]
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert(result.summary);
  assert.match(result.summary, /security/);
});

test('T12 empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T12 malformed input returns error', () => {
  const result = run({ findings: 'not an array' });
  assert.equal(result.ok, false);
});

test('T12 no mutation of input', () => {
  const input = {
    findings: [
      { description: 'Issue', blocker: false }
    ]
  };
  const original = JSON.stringify(input);

  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('T12 same output twice', () => {
  const input = {
    findings: [
      { description: 'Issue', blocker: false }
    ]
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T12 trace includes node and steps', () => {
  const input = {
    findings: [
      { description: 'Issue', blocker: false }
    ]
  };

  const result = run(input);
  assert.equal(result.trace.node, 'L2.E07');
  assert(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
