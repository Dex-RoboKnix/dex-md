import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p5/case-row.mjs';

test('T10.1 Case rows include all minimum required columns', () => {
  const input = {
    task_id: 'T001',
    attempts: 2,
    outcome: 'pass',
    time_elapsed_minutes: 15.5,
    run_manifest_hash: 'abc123def456',
    artifact_url: 'https://example.com/artifact/123',
    notes: 'Task completed successfully'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.case_row.task_id, 'T001');
  assert.strictEqual(result.case_row.attempts, 2);
  assert.strictEqual(result.case_row.outcome, 'pass');
  assert.strictEqual(result.case_row.time_elapsed_minutes, 15.5);
  assert.strictEqual(result.case_row.run_manifest_hash, 'abc123def456');
  assert.strictEqual(result.case_row.artifact_url, 'https://example.com/artifact/123');
  assert.strictEqual(result.case_row.notes, 'Task completed successfully');
});

test('T10.2 Outcomes recorded as pass, fail, abandoned, escalated-and-resolved', () => {
  const outcomes = ['pass', 'fail', 'abandoned', 'escalated-and-resolved'];

  for (const outcome of outcomes) {
    const input = {
      task_id: 'T002',
      attempts: 1,
      outcome,
      time_elapsed_minutes: 10,
      run_manifest_hash: 'hash',
      artifact_url: 'https://example.com/artifact/1'
    };

    const result = run(input);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.case_row.outcome, outcome);
  }
});

test('T10.2 Abandoned outcome with reason in notes', () => {
  const input = {
    task_id: 'T003',
    attempts: 3,
    outcome: 'abandoned',
    time_elapsed_minutes: 45.2,
    run_manifest_hash: 'hash_abc',
    artifact_url: 'https://example.com/artifact/2',
    notes: 'Task abandoned due to resource constraints'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.case_row.outcome, 'abandoned');
  assert.strictEqual(result.case_row.attempts, 3);
  assert.ok(result.case_row.notes.includes('abandoned'));
});

test('T10.3 Each case row traced back via run_manifest_hash', () => {
  const input = {
    task_id: 'T004',
    attempts: 1,
    outcome: 'pass',
    time_elapsed_minutes: 20,
    run_manifest_hash: 'manifest_hash_xyz_789_01234567890',
    artifact_url: 'https://example.com/artifact/3'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.case_row.run_manifest_hash, 'manifest_hash_xyz_789_01234567890');
  assert.ok(result.validation.manifest_hash_valid);
});

test('T10.4 Elapsed time recorded in minutes with decimal precision', () => {
  const input = {
    task_id: 'T005',
    attempts: 1,
    outcome: 'pass',
    time_elapsed_minutes: 12.345,
    run_manifest_hash: 'hash',
    artifact_url: 'https://example.com/artifact/4'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.case_row.time_elapsed_minutes, 12.3);
});

test('T10.5 Case rows enable trend analysis and debugging', () => {
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const input = {
      task_id: `T_${i}`,
      attempts: i + 1,
      outcome: i === 0 ? 'pass' : i === 1 ? 'fail' : 'escalated-and-resolved',
      time_elapsed_minutes: 10 + i * 5,
      run_manifest_hash: `hash_${i}`,
      artifact_url: `https://example.com/artifact/${i}`
    };

    const result = run(input);
    rows.push(result.case_row);
  }

  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].outcome, 'pass');
  assert.strictEqual(rows[1].outcome, 'fail');
  assert.strictEqual(rows[2].outcome, 'escalated-and-resolved');
});

test('invalid outcome', () => {
  const input = {
    task_id: 'T006',
    attempts: 1,
    outcome: 'invalid',
    time_elapsed_minutes: 10,
    run_manifest_hash: 'hash',
    artifact_url: 'https://example.com/artifact/5'
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be one of/);
});

test('empty input', () => {
  const result = run({});
  assert.strictEqual(result.ok, false);
});

test('malformed input - missing task_id', () => {
  const input = {
    attempts: 1,
    outcome: 'pass',
    time_elapsed_minutes: 10,
    run_manifest_hash: 'hash',
    artifact_url: 'https://example.com/artifact/6'
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /task_id/);
});

test('malformed input - negative attempts', () => {
  const input = {
    task_id: 'T007',
    attempts: -1,
    outcome: 'pass',
    time_elapsed_minutes: 10,
    run_manifest_hash: 'hash',
    artifact_url: 'https://example.com/artifact/7'
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - invalid time_elapsed_minutes', () => {
  const input = {
    task_id: 'T008',
    attempts: 1,
    outcome: 'pass',
    time_elapsed_minutes: -5,
    run_manifest_hash: 'hash',
    artifact_url: 'https://example.com/artifact/8'
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('optional notes field', () => {
  const input = {
    task_id: 'T009',
    attempts: 1,
    outcome: 'pass',
    time_elapsed_minutes: 10,
    run_manifest_hash: 'hash',
    artifact_url: 'https://example.com/artifact/9'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.case_row.notes, '');
});

test('no mutation of input', () => {
  const input = {
    task_id: 'T010',
    attempts: 1,
    outcome: 'pass',
    time_elapsed_minutes: 10,
    run_manifest_hash: 'hash',
    artifact_url: 'https://example.com/artifact/10',
    notes: 'Note'
  };

  const original = JSON.stringify(input);
  run(input);
  assert.strictEqual(JSON.stringify(input), original);
});

test('same input produces same output', () => {
  const input = {
    task_id: 'T011',
    attempts: 1,
    outcome: 'pass',
    time_elapsed_minutes: 10,
    run_manifest_hash: 'hash',
    artifact_url: 'https://example.com/artifact/11'
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('trace contains node and steps', () => {
  const input = {
    task_id: 'T012',
    attempts: 1,
    outcome: 'pass',
    time_elapsed_minutes: 10,
    run_manifest_hash: 'hash',
    artifact_url: 'https://example.com/artifact/12'
  };

  const result = run(input);
  assert.strictEqual(result.trace.node, 'L5.E05');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
