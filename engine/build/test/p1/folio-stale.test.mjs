import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p1/folio-stale.mjs';

const timestamp1 = '2026-10-09T10:00:00Z';
const timestamp2 = '2026-10-09T11:00:00Z';
const timestamp3 = '2026-10-09T12:00:00Z';

test('T17.1: Folio older than newest vault file is stale', () => {
  const result = run({
    folioTimestamp: timestamp1,
    vaultFileTimestamps: [timestamp2, timestamp3]
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.stale, true);
});

test('T17.2: Folio same as newest vault file is not stale', () => {
  const result = run({
    folioTimestamp: timestamp2,
    vaultFileTimestamps: [timestamp1, timestamp2]
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.stale, false);
});

test('T17.3: Folio newer than all vault files is not stale', () => {
  const result = run({
    folioTimestamp: timestamp3,
    vaultFileTimestamps: [timestamp1, timestamp2]
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.stale, false);
});

test('T17.4: Strictly less-than comparison enforced', () => {
  const result = run({
    folioTimestamp: '2026-10-09T10:00:00.000Z',
    vaultFileTimestamps: ['2026-10-09T10:00:00.001Z']
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.stale, true);
});

test('T17.5: Single vault file timestamp works', () => {
  const result = run({
    folioTimestamp: timestamp1,
    vaultFileTimestamps: [timestamp2]
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.stale, true);
});

test('T17.6: Finds newest among multiple vault files', () => {
  const result = run({
    folioTimestamp: timestamp2,
    vaultFileTimestamps: [timestamp1, timestamp3, timestamp2]
  });
  assert.strictEqual(result.ok, true);
  // Folio is older than timestamp3 (newest)
  assert.strictEqual(result.stale, true);
});

test('T17.7: Empty vault timestamps rejected', () => {
  const result = run({
    folioTimestamp: timestamp1,
    vaultFileTimestamps: []
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /cannot be empty/);
});

test('T17.8: Invalid folio timestamp rejected', () => {
  const result = run({
    folioTimestamp: 'not-a-timestamp',
    vaultFileTimestamps: [timestamp1]
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /ISO 8601/);
});

test('T17.9: Invalid vault timestamp rejected', () => {
  const result = run({
    folioTimestamp: timestamp1,
    vaultFileTimestamps: ['invalid']
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /invalid vault timestamp/);
});

test('T17.10: Non-string folio timestamp rejected', () => {
  const result = run({
    folioTimestamp: 123456,
    vaultFileTimestamps: [timestamp1]
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be ISO 8601 string/);
});

test('T17.11: Non-array vault timestamps rejected', () => {
  const result = run({
    folioTimestamp: timestamp1,
    vaultFileTimestamps: 'not-an-array'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('T17.12: Non-string array element rejected', () => {
  const result = run({
    folioTimestamp: timestamp1,
    vaultFileTimestamps: [timestamp1, 123]
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be strings/);
});

test('T17.13: UTC normalization transparent to caller', () => {
  const result = run({
    folioTimestamp: timestamp1,
    vaultFileTimestamps: [timestamp1]
  });
  assert.strictEqual(result.ok, true);
  assert.ok(typeof result.folioTime === 'number');
  assert.ok(typeof result.newestVaultTime === 'number');
});

test('T17.14: No mutation of input', () => {
  const input = {
    folioTimestamp: timestamp1,
    vaultFileTimestamps: [timestamp2]
  };
  const originalTimestamp = input.folioTimestamp;
  run(input);
  assert.strictEqual(input.folioTimestamp, originalTimestamp);
});

test('T17.15: Same input produces same output', () => {
  const input = {
    folioTimestamp: timestamp1,
    vaultFileTimestamps: [timestamp2, timestamp3]
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('T17.16: Trace includes node and steps', () => {
  const result = run({
    folioTimestamp: timestamp1,
    vaultFileTimestamps: [timestamp2]
  });
  assert.ok(result.trace);
  assert.strictEqual(result.trace.node, 'L4.E07');
  assert.ok(Array.isArray(result.trace.steps));
});
