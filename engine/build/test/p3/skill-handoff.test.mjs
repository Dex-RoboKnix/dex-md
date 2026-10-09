import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/skill-handoff.mjs';

test('T14.1 Contracts matched by exact field names and types', () => {
  const input = {
    contract: { name: 'string', count: 'number' },
    output: { name: 'Alice', count: 42 }
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.validated, true);
  assert.deepEqual(result.matched, ['name', 'count']);
});

test('T14.2 Output with extra fields passes validation', () => {
  const input = {
    contract: { name: 'string' },
    output: { name: 'Alice', extra: 'field', another: 123 }
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.validated, true);
  assert.deepEqual(result.matched, ['name']);
  assert.deepEqual(result.extraFields, ['extra', 'another']);
});

test('T14.3 Validation reports which fields matched and which were missing', () => {
  const input = {
    contract: { name: 'string', count: 'number', status: 'string' },
    output: { name: 'Alice', status: 'active' }
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.validated, false);
  assert.deepEqual(result.matched, ['name', 'status']);
  assert.deepEqual(result.missing, ['count']);
});

test('T14.4 Type mismatches cause validation to fail', () => {
  const input = {
    contract: { count: 'number' },
    output: { count: 'not a number' }
  };

  const result = run(input);
  assert.equal(result.ok, false);
  assert.match(result.error, /Type mismatch/);
  assert(result.typeMismatches);
  assert.equal(result.typeMismatches.length, 1);
});

test('T14 empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T14 malformed input returns error', () => {
  const result = run({ contract: null, output: {} });
  assert.equal(result.ok, false);
});

test('T14 no mutation of input', () => {
  const input = {
    contract: { name: 'string' },
    output: { name: 'test' }
  };
  const original = JSON.stringify(input);

  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('T14 same output twice', () => {
  const input = {
    contract: { name: 'string' },
    output: { name: 'test' }
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T14 trace includes node and steps', () => {
  const input = {
    contract: { name: 'string' },
    output: { name: 'test' }
  };

  const result = run(input);
  assert.equal(result.trace.node, 'L5.E03');
  assert(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
