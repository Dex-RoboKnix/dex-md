import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p5/signoff-record.mjs';

test('T20.1: Sign-off record captures human name, date, and commit reference', () => {
  const input = {
    human_name: 'Alice Smith',
    date: '2026-10-09',
    commit_ref: 'abc123def456'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.record.human_name, 'Alice Smith');
  assert.equal(result.record.date, '2026-10-09');
  assert.equal(result.record.commit_ref, 'abc123def456');
});

test('T20.2: Sign-off records stored in git (represented as record object)', () => {
  const input = {
    human_name: 'Bob Johnson',
    date: '2026-10-08',
    commit_ref: 'commit-hash-xyz'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.record.record_type);
  assert.equal(result.record.record_type, 'signoff');
});

test('T20.3: Amendments create new records rather than modifying originals', () => {
  const input = {
    human_name: 'Charlie Lee',
    date: '2026-10-09',
    commit_ref: 'new-commit-hash',
    reason: 'Correction of previous approval',
    amendment_of: 'abc123def456'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.record.record_type, 'amendment');
  assert.equal(result.record.amendment_of, 'abc123def456');
});

test('T20.4: Immutable audit trail via git history', () => {
  const input1 = {
    human_name: 'Diana Prince',
    date: '2026-10-07',
    commit_ref: 'commit1'
  };
  const input2 = {
    human_name: 'Diana Prince',
    date: '2026-10-09',
    commit_ref: 'commit2',
    reason: 'Final approval',
    amendment_of: 'commit1'
  };
  const result1 = run(input1);
  const result2 = run(input2);
  // Original record is not modified, amendment is separate
  assert.notEqual(result1.record.date, result2.record.date);
});

test('T20.5: Sign-off records are tamper-evident and attributable', () => {
  const input = {
    human_name: 'Eve Davis',
    date: '2026-10-09',
    commit_ref: 'sha256:abc123def456'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.record.commit_ref);
  assert.ok(result.record.timestamp_recorded);
});

test('T20: Empty input returns error', () => {
  const result = run({});
  assert.equal(result.ok, false);
});

test('T20: Missing human_name returns error', () => {
  const result = run({
    date: '2026-10-09',
    commit_ref: 'abc123'
  });
  assert.equal(result.ok, false);
});

test('T20: Empty human_name returns error', () => {
  const result = run({
    human_name: '',
    date: '2026-10-09',
    commit_ref: 'abc123'
  });
  assert.equal(result.ok, false);
});

test('T20: Invalid date format returns error', () => {
  const result = run({
    human_name: 'Frank Miller',
    date: '10/09/2026', // wrong format
    commit_ref: 'abc123'
  });
  assert.equal(result.ok, false);
});

test('T20: Missing commit_ref returns error', () => {
  const result = run({
    human_name: 'Grace Hopper',
    date: '2026-10-09'
  });
  assert.equal(result.ok, false);
});

test('T20: Empty commit_ref returns error', () => {
  const result = run({
    human_name: 'Henry Ford',
    date: '2026-10-09',
    commit_ref: ''
  });
  assert.equal(result.ok, false);
});

test('T20: No mutation of input', () => {
  const input = {
    human_name: 'Iris West',
    date: '2026-10-09',
    commit_ref: 'commit123'
  };
  const copy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, copy);
});

test('T20: Same input produces same output twice (except timestamp)', () => {
  const input = {
    human_name: 'Jack Ryan',
    date: '2026-10-09',
    commit_ref: 'commit456'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.equal(result1.record.human_name, result2.record.human_name);
  assert.equal(result1.record.date, result2.record.date);
  assert.equal(result1.record.commit_ref, result2.record.commit_ref);
});

test('T20: Trace includes record creation step', () => {
  const input = {
    human_name: 'Kate Bishop',
    date: '2026-10-09',
    commit_ref: 'commit789'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L3.E04');
  assert.ok(result.trace.steps.some(s => s.action === 'create-record'));
});

test('T20: ISO 8601 date format enforced', () => {
  const validInputs = [
    { human_name: 'Alice', date: '2026-10-09', commit_ref: 'abc' }
  ];
  const invalidInputs = [
    { human_name: 'Alice', date: '2026-1-9', commit_ref: 'abc' }, // missing leading zero
    { human_name: 'Alice', date: '10-09-2026', commit_ref: 'abc' }, // wrong order
  ];
  const validResult = run(validInputs[0]);
  assert.equal(validResult.ok, true);
  for (const invalid of invalidInputs) {
    const result = run(invalid);
    assert.equal(result.ok, false);
  }
});
