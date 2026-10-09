import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p1/runlog-row.mjs';

test('T05.1 Row columns in natural chronological sequence', () => {
  const result = run({
    runNumber: 42,
    date: '2026-10-09',
    mode: 'ask',
    version: '1.0.0',
    summary: 'Deployed new feature'
  });
  assert.equal(result.ok, true);
  assert.equal(result.row.runNumber, 42);
  assert.equal(result.row.date, '2026-10-09');
  assert.equal(result.row.mode, 'ask');
  assert.equal(result.row.version, '1.0.0');
});

test('T05.2 Summary truncated to 80 chars for compactness', () => {
  const longSummary = 'a'.repeat(100);
  const result = run({
    runNumber: 1,
    date: '2026-10-09',
    mode: 'suggest',
    version: '1.0.0',
    summary: longSummary
  });
  assert.equal(result.ok, true);
  assert.equal(result.row.summary.length, 80);
  assert.match(result.row.summary, /\.\.\.$/);
});

test('T05.3 Full summary stored in external sidecar file', () => {
  const longSummary = 'b'.repeat(100);
  const result = run({
    runNumber: 2,
    date: '2026-10-09',
    mode: 'ask',
    version: '2.0.0',
    summary: longSummary
  });
  assert.equal(result.ok, true);
  assert.ok(Array.isArray(result.effects));
  assert.equal(result.effects.length, 1);
  assert.equal(result.effects[0].kind, 'write-file');
  assert.ok(result.effects[0].path.includes('summary-2'));
  assert.ok(result.effects[0].content.includes(longSummary));
  assert.ok(result.effects[0].content.length > longSummary.length); // includes header
});

test('T05.4 Rows immutable after insertion', () => {
  const result = run({
    runNumber: 3,
    date: '2026-10-09',
    mode: 'ask',
    version: '3.0.0',
    summary: 'Test immutability'
  });
  assert.equal(result.ok, true);
  assert.equal(result.immutable, true);
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
  const result = run([1, 2, 3]);
  assert.equal(result.ok, false);
});

test('malformed input (missing field)', () => {
  const result = run({
    runNumber: 1,
    date: '2026-10-09',
    mode: 'ask',
    version: '1.0.0'
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be strings/i);
});

test('malformed input (invalid runNumber)', () => {
  const result = run({
    runNumber: -1,
    date: '2026-10-09',
    mode: 'ask',
    version: '1.0.0',
    summary: 'test'
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /non-negative integer/i);
});

test('malformed input (empty summary)', () => {
  const result = run({
    runNumber: 1,
    date: '2026-10-09',
    mode: 'ask',
    version: '1.0.0',
    summary: ''
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must not be empty/i);
});

test('no mutation: input object unchanged', () => {
  const input = {
    runNumber: 1,
    date: '2026-10-09',
    mode: 'ask',
    version: '1.0.0',
    summary: 'Test'
  };
  const original = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('same output twice: deterministic', () => {
  const input = {
    runNumber: 5,
    date: '2026-10-09',
    mode: 'suggest',
    version: '1.5.0',
    summary: 'Consistent test'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('trace contains node id', () => {
  const result = run({
    runNumber: 1,
    date: '2026-10-09',
    mode: 'ask',
    version: '1.0.0',
    summary: 'Test'
  });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L4.E08');
  assert.ok(Array.isArray(result.trace.steps));
});
