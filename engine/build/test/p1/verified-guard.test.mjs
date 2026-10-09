import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p1/verified-guard.mjs';

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const pastDate = yesterday.toISOString().split('T')[0];

test('T14.1: Verified=false needs no approval fields', () => {
  const result = run({ verified: false });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.requiresApproval, false);
});

test('T14.2: Verified=true requires name and date', () => {
  const result = run({
    verified: true,
    name: 'John Doe',
    date: pastDate
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.approved, true);
});

test('T14.3: Verified=true requires email and date', () => {
  const result = run({
    verified: true,
    email: 'user@example.com',
    date: pastDate
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.approved, true);
});

test('T14.4: Missing name or email rejected', () => {
  const result = run({
    verified: true,
    date: pastDate
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /name or email/);
});

test('T14.5: Missing date rejected', () => {
  const result = run({
    verified: true,
    name: 'John Doe'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /date field/);
});

test('T14.6: Future date rejected', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const futureDate = tomorrow.toISOString().split('T')[0];

  const result = run({
    verified: true,
    name: 'John Doe',
    date: futureDate
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /cannot be in the future/);
});

test('T14.7: Invalid date format rejected', () => {
  const result = run({
    verified: true,
    name: 'John Doe',
    date: 'not-a-date'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /ISO 8601/);
});

test('T14.8: Invalid email format rejected', () => {
  const result = run({
    verified: true,
    email: 'notanemail',
    date: pastDate
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /email.*valid/);
});

test('T14.9: Valid date today accepted', () => {
  const today = new Date().toISOString().split('T')[0];
  const result = run({
    verified: true,
    name: 'Jane Smith',
    date: today
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.approved, true);
});

test('T14.10: Both name and email provided', () => {
  const result = run({
    verified: true,
    name: 'Alice Brown',
    email: 'alice@example.com',
    date: pastDate
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.approved, true);
});

test('T14.11: Empty name field treated as missing', () => {
  const result = run({
    verified: true,
    name: '',
    date: pastDate
  });
  assert.strictEqual(result.ok, false);
});

test('T14.12: Null date rejected', () => {
  const result = run({
    verified: true,
    name: 'John Doe',
    date: null
  });
  assert.strictEqual(result.ok, false);
});

test('T14.13: No mutation of input', () => {
  const input = {
    verified: true,
    name: 'John Doe',
    date: pastDate
  };
  const originalVerified = input.verified;
  run(input);
  assert.strictEqual(input.verified, originalVerified);
});

test('T14.14: Same input produces same output', () => {
  const input = {
    verified: true,
    name: 'John Doe',
    date: pastDate
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('T14.15: Trace includes node and steps', () => {
  const result = run({ verified: false });
  assert.ok(result.trace);
  assert.strictEqual(result.trace.node, 'L3.E05');
  assert.ok(Array.isArray(result.trace.steps));
});

test('T14.16: Non-object input rejected', () => {
  const result = run('verified');
  assert.strictEqual(result.ok, false);
});
