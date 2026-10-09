import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p1/validate-wrap.mjs';

test('T18.1: Outcome structure with ok, errors, warnings fields', () => {
  const result = run({ errors: [], warnings: [] });
  assert.ok('ok' in result);
  assert.ok('errors' in result);
  assert.ok('warnings' in result);
  assert.ok('outcome' in result);
});

test('T18.2: Zero errors produces success outcome', () => {
  const result = run({ errors: [] });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.outcome, 'success');
});

test('T18.3: Errors cause failure state', () => {
  const result = run({
    errors: ['error1', 'error2'],
    warnings: []
  });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.outcome, 'failed');
  assert.strictEqual(result.errorCount, 2);
});

test('T18.4: Warnings do not block progress', () => {
  const result = run({
    errors: [],
    warnings: ['warning1']
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.outcome, 'passed_with_warnings');
});

test('T18.5: Success requires zero errors', () => {
  const result = run({
    errors: [],
    warnings: ['w1', 'w2', 'w3']
  });
  assert.strictEqual(result.ok, true);
});

test('T18.6: Single error fails validation', () => {
  const result = run({
    errors: ['one error'],
    warnings: []
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.outcome, /failed/);
});

test('T18.7: Pragmatic strictness: warnings logged but permit progress', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({
    errors: [],
    warnings: ['possible issue'],
    now
  });
  assert.strictEqual(result.ok, true);
  assert.ok(result.warnings.includes('possible issue'));
  // assert audit for warnings logged
  assert.ok(result.audit);
  assert.strictEqual(result.audit.event, 'validation-warnings-logged');
  assert.strictEqual(result.audit.at, now);
  assert.strictEqual(result.audit.warningCount, 1);
  assert.deepStrictEqual(result.audit.warnings, ['possible issue']);
});

test('T18.8: Error and warning counts accurate', () => {
  const result = run({
    errors: ['e1', 'e2'],
    warnings: ['w1', 'w2', 'w3']
  });
  assert.strictEqual(result.errorCount, 2);
  assert.strictEqual(result.warningCount, 3);
});

test('T18.9: Empty arrays default successfully', () => {
  const result = run({});
  assert.strictEqual(result.ok, true);
  assert.deepStrictEqual(result.errors, []);
  assert.deepStrictEqual(result.warnings, []);
});

test('T18.10: Non-array errors rejected', () => {
  const result = run({
    errors: 'not-an-array'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('T18.11: Non-array warnings rejected', () => {
  const result = run({
    warnings: 'not-an-array'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('T18.12: Non-object input rejected', () => {
  const result = run('not-an-object');
  assert.strictEqual(result.ok, false);
});

test('T18.13: No mutation of input', () => {
  const input = {
    errors: ['e1'],
    warnings: ['w1']
  };
  const originalErrorCount = input.errors.length;
  run(input);
  assert.strictEqual(input.errors.length, originalErrorCount);
});

test('T18.14: Same input produces same output', () => {
  const input = {
    errors: ['error'],
    warnings: ['warning']
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('T18.15: Trace includes node and steps', () => {
  const result = run({ errors: ['e1'], warnings: ['w1'] });
  assert.ok(result.trace);
  assert.strictEqual(result.trace.node, 'L5.E02');
  assert.ok(Array.isArray(result.trace.steps));
});

test('T18.16: Multiple errors and warnings case', () => {
  const result = run({
    errors: ['parse error', 'validation error', 'type error'],
    warnings: ['deprecated', 'slow']
  });
  assert.strictEqual(result.errorCount, 3);
  assert.strictEqual(result.warningCount, 2);
  assert.strictEqual(result.ok, false);
});
