import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p1/node-row-replace.mjs';

test('T08.1 Lookup by exact Point column value', () => {
  const table = [
    { point: 'L1.E05', answer: 'old answer' },
    { point: 'L1.E06', answer: 'another' }
  ];
  const result = run({
    table,
    pointToReplace: 'L1.E05',
    replacementRow: { point: 'L1.E05', answer: 'new answer' }
  });
  assert.equal(result.ok, true);
  assert.equal(result.table[0].answer, 'new answer');
});

test('T08.1a case-sensitive lookup', () => {
  const table = [
    { point: 'l1.e05', answer: 'wrong case' },
    { point: 'L1.E05', answer: 'correct' }
  ];
  const result = run({
    table,
    pointToReplace: 'L1.E05',
    replacementRow: { point: 'L1.E05', answer: 'replaced' }
  });
  assert.equal(result.ok, true);
  assert.equal(result.replacedRow.answer, 'correct');
  assert.equal(result.table[1].answer, 'replaced');
});

test('T08.2 Ambiguous matches fail with error message', () => {
  const table = [
    { point: 'L1.E05', answer: 'first' },
    { point: 'L1.E05', answer: 'duplicate' }
  ];
  const result = run({
    table,
    pointToReplace: 'L1.E05',
    replacementRow: { point: 'L1.E05', answer: 'new' }
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /ambiguous/i);
  assert.equal(result.matchCount, 2);
});

test('T08.3 Backup record tracks replaced row for audit', () => {
  const now = '2024-01-15T10:30:00Z';
  const table = [
    { point: 'L1.E05', answer: 'original text', status: 'draft' }
  ];
  const result = run({
    table,
    pointToReplace: 'L1.E05',
    replacementRow: { point: 'L1.E05', answer: 'updated text', status: 'final' },
    now
  });
  assert.equal(result.ok, true);
  assert.equal(result.backup.original.answer, 'original text');
  assert.equal(result.backup.replacement.answer, 'updated text');
  assert.equal(result.backup.timestamp, now);
  assert.equal(result.backup.user, 'system');
  // assert audit for the replacement
  assert.ok(result.audit);
  assert.equal(result.audit.event, 'row-replaced');
  assert.equal(result.audit.at, now);
  assert.equal(result.audit.point, 'L1.E05');
});

test('T08.4 Returns table and backup row', () => {
  const table = [
    { point: 'L1.E05', data: 'test' }
  ];
  const result = run({
    table,
    pointToReplace: 'L1.E05',
    replacementRow: { point: 'L1.E05', data: 'changed' }
  });
  assert.equal(result.ok, true);
  assert.ok(Array.isArray(result.table));
  assert.ok(result.backup);
  assert.equal(result.replacedRow.data, 'test');
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

test('malformed input (missing field)', () => {
  const result = run({
    table: [],
    pointToReplace: 'L1.E05'
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be object/i);
});

test('malformed input (table not array)', () => {
  const result = run({
    table: 'not an array',
    pointToReplace: 'L1.E05',
    replacementRow: {}
  });
  assert.equal(result.ok, false);
});

test('malformed input (empty pointToReplace)', () => {
  const result = run({
    table: [{ point: 'L1.E05' }],
    pointToReplace: '',
    replacementRow: {}
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must not be empty/i);
});

test('no match found', () => {
  const result = run({
    table: [{ point: 'L1.E05' }],
    pointToReplace: 'L1.E99',
    replacementRow: {}
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /no row found/i);
});

test('no mutation: input object unchanged', () => {
  const input = {
    table: [{ point: 'L1.E05', answer: 'test' }],
    pointToReplace: 'L1.E05',
    replacementRow: { point: 'L1.E05', answer: 'new' }
  };
  const original = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('same output twice: deterministic', () => {
  const input = {
    table: [{ point: 'L1.E05', answer: 'original' }],
    pointToReplace: 'L1.E05',
    replacementRow: { point: 'L1.E05', answer: 'consistent' }
  };
  const result1 = run(input);
  const result2 = run(input);
  // backup timestamps differ, so check structure instead
  assert.deepEqual(result1.table, result2.table);
  assert.deepEqual(result1.replacedRow, result2.replacedRow);
});

test('trace contains node id', () => {
  const result = run({
    table: [{ point: 'L1.E05' }],
    pointToReplace: 'L1.E05',
    replacementRow: { point: 'L1.E05', new: true }
  });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L4.E08');
  assert.ok(Array.isArray(result.trace.steps));
});
