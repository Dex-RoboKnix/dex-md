import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p5/catch-up-ingest.mjs';

test('T06.1 Grill log entries since specified date are converted to journal entries', () => {
  const input = {
    log_lines: [
      { line_number: 1, text: 'Entry 1', timestamp_attempt: '2026-10-08T10:00:00Z' },
      { line_number: 2, text: 'Entry 2', timestamp_attempt: '2026-10-09T11:00:00Z' }
    ],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.journal_entries.length, 2);
});

test('T06.2 Timestamps converted to ISO 8601 format with full precision', () => {
  const input = {
    log_lines: [
      { line_number: 1, text: 'Log entry', timestamp_attempt: '2026-10-09T14:30:45.123Z' }
    ],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.journal_entries.length, 1);
  assert.match(result.journal_entries[0].timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
});

test('T06.3 Unparseable entries skipped and logged; processing continues', () => {
  const input = {
    log_lines: [
      { line_number: 1, text: 'Good entry', timestamp_attempt: '2026-10-09T10:00:00Z' },
      { line_number: 2, text: 'Bad entry', timestamp_attempt: 'not-a-timestamp' },
      { line_number: 3, text: 'Another good entry', timestamp_attempt: '2026-10-09T12:00:00Z' }
    ],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.journal_entries.length, 2);
  assert.strictEqual(result.errors_encountered.length, 1);
  assert.ok(result.errors_encountered[0].error.includes('unable to parse'));
});

test('T06.4 Each journal entry maintains link to original grill log', () => {
  const input = {
    log_lines: [
      { line_number: 5, text: 'Original log text here', timestamp_attempt: '2026-10-09T10:00:00Z' }
    ],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.journal_entries[0].original_log_line, 'Original log text here');
  assert.strictEqual(result.journal_entries[0].line_number, 5);
});

test('T06.5 Journal entries sorted by date in stable order', () => {
  const input = {
    log_lines: [
      { line_number: 1, text: 'Third', timestamp_attempt: '2026-10-09T15:00:00Z' },
      { line_number: 2, text: 'First', timestamp_attempt: '2026-10-09T10:00:00Z' },
      { line_number: 3, text: 'Second', timestamp_attempt: '2026-10-09T12:00:00Z' }
    ],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.journal_entries[0].content, 'First');
  assert.strictEqual(result.journal_entries[1].content, 'Second');
  assert.strictEqual(result.journal_entries[2].content, 'Third');
});

test('empty log lines array', () => {
  const input = {
    log_lines: [],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.journal_entries.length, 0);
});

test('malformed input - not an array', () => {
  const input = {
    log_lines: 'not an array',
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('malformed input - missing cutoff_date', () => {
  const input = {
    log_lines: [
      { line_number: 1, text: 'Entry', timestamp_attempt: '2026-10-09T10:00:00Z' }
    ]
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - empty text field', () => {
  const input = {
    log_lines: [
      { line_number: 1, text: '', timestamp_attempt: '2026-10-09T10:00:00Z' }
    ],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.journal_entries.length, 0);
  assert.ok(result.errors_encountered.length > 0);
});

test('entries before cutoff_date are excluded', () => {
  const input = {
    log_lines: [
      { line_number: 1, text: 'Before', timestamp_attempt: '2026-10-07T10:00:00Z' },
      { line_number: 2, text: 'After', timestamp_attempt: '2026-10-09T10:00:00Z' }
    ],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.journal_entries.length, 1);
  assert.strictEqual(result.journal_entries[0].content, 'After');
});

test('no mutation of input', () => {
  const input = {
    log_lines: [
      { line_number: 1, text: 'Entry', timestamp_attempt: '2026-10-09T10:00:00Z' }
    ],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const original = JSON.stringify(input);
  run(input);
  assert.strictEqual(JSON.stringify(input), original);
});

test('same input produces same output', () => {
  const input = {
    log_lines: [
      { line_number: 1, text: 'Entry', timestamp_attempt: '2026-10-09T10:00:00Z' }
    ],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('trace contains node and steps', () => {
  const input = {
    log_lines: [
      { line_number: 1, text: 'Entry', timestamp_attempt: '2026-10-09T10:00:00Z' }
    ],
    cutoff_date: '2026-10-08T00:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.trace.node, 'L4.E08');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
