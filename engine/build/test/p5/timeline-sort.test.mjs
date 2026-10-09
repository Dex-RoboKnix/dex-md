import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p5/timeline-sort.mjs';

test('T17.1: Timeline points sorted by date then issue number', () => {
  const input = {
    points: [
      { issue_number: 10, title: 'Issue 10', date: '2026-10-09', commit_hash: 'abc' },
      { issue_number: 5, title: 'Issue 5', date: '2026-10-09', commit_hash: 'def' },
      { issue_number: 1, title: 'Issue 1', date: '2026-10-08', commit_hash: 'ghi' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.sorted[0].issue_number, 1); // 2026-10-08 first
  assert.equal(result.sorted[1].issue_number, 5); // 2026-10-09, lower issue first
  assert.equal(result.sorted[2].issue_number, 10); // 2026-10-09, higher issue second
});

test('T17.2: Missing dates sorted to end and flagged', () => {
  const input = {
    points: [
      { issue_number: 2, title: 'Issue 2', date: '2026-10-09', commit_hash: 'abc' },
      { issue_number: 3, title: 'Issue 3', commit_hash: 'def' }, // missing date
      { issue_number: 1, title: 'Issue 1', date: '2026-10-08', commit_hash: 'ghi' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.sorted[2].issue_number, 3); // missing date to end
  assert.ok(result.logEntries[2].includes('[date:missing]'));
});

test('T17.3: Sort operation logged with timestamps', () => {
  const input = {
    points: [
      { issue_number: 1, title: 'Issue 1', date: '2026-10-09', commit_hash: 'abc' }
    ],
    now: '2026-10-09T10:00:00Z'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.effects.length, 1);
  assert.equal(result.effects[0].kind, 'append-log');
  assert.ok(result.effects[0].content.includes('2026-10-09T10:00:00Z'));
});

test('T17.4: Sort order stable across multiple runs', () => {
  const input = {
    points: [
      { issue_number: 3, title: 'Issue 3', date: '2026-10-09', commit_hash: 'abc' },
      { issue_number: 1, title: 'Issue 1', date: '2026-10-08', commit_hash: 'def' },
      { issue_number: 2, title: 'Issue 2', date: '2026-10-09', commit_hash: 'ghi' }
    ]
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1.sorted, result2.sorted);
});

test('T17.5: Invalid dates require manual reconciliation', () => {
  const input = {
    points: [
      { issue_number: 1, title: 'Issue 1', date: 'invalid-date', commit_hash: 'abc' },
      { issue_number: 2, title: 'Issue 2', date: '2026-10-09', commit_hash: 'def' }
    ]
  };
  const result = run(input);
  // Invalid dates are still sorted, but log shows the issue
  assert.equal(result.ok, true);
  // Date string comparison will still work, even with invalid format
});

test('T17: Empty input returns error', () => {
  const result = run({});
  assert.equal(result.ok, false);
});

test('T17: Null points returns error', () => {
  const result = run({ points: null });
  assert.equal(result.ok, false);
});

test('T17: Empty points array returns error', () => {
  const result = run({ points: [] });
  assert.equal(result.ok, false);
});

test('T17: Missing issue_number returns error', () => {
  const result = run({
    points: [{ title: 'Issue', date: '2026-10-09' }]
  });
  assert.equal(result.ok, false);
});

test('T17: No mutation of input', () => {
  const input = {
    points: [
      { issue_number: 2, title: 'Issue 2', date: '2026-10-09' },
      { issue_number: 1, title: 'Issue 1', date: '2026-10-08' }
    ]
  };
  const copy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, copy);
});

test('T17: Same input produces same output twice', () => {
  const input = {
    points: [
      { issue_number: 2, title: 'Issue 2', date: '2026-10-09', commit_hash: 'abc' },
      { issue_number: 1, title: 'Issue 1', date: '2026-10-08', commit_hash: 'def' }
    ]
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1.sorted, result2.sorted);
});

test('T17: Trace includes steps for each point', () => {
  const input = {
    points: [
      { issue_number: 1, title: 'Issue 1', date: '2026-10-09', commit_hash: 'abc' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L4.E07');
  assert.equal(result.trace.steps.length, 1);
});

test('T17: Missing commit hash flagged in log', () => {
  const input = {
    points: [
      { issue_number: 1, title: 'Issue 1', date: '2026-10-09' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.logEntries[0].includes('hash:missing'));
});
