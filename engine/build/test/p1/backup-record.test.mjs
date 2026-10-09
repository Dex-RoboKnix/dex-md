import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p1/backup-record.mjs';

const testBackup = {
  original: { Point: 'E05', Answer: 'Yes', State: 'C' },
  replacement: { Point: 'E05', Answer: 'No', State: 'W' },
  timestamp: '2026-10-09T10:00:00Z'
};

test('T15.1: Fenced code block format used', () => {
  const result = run({
    backups: [testBackup],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.ok, true);
  assert.ok(Array.isArray(result.effects));
  assert.strictEqual(result.effects[0].kind, 'write-file');
  const markdown = result.effects[0].content;
  assert.ok(markdown.includes('```markdown'));
  assert.ok(markdown.includes('```'));
});

test('T15.2: Original and replacement tables included', () => {
  const result = run({
    backups: [testBackup],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.ok, true);
  const markdown = result.effects[0].content;
  assert.ok(markdown.includes('## Original Rows'));
  assert.ok(markdown.includes('## Replacement Rows'));
});

test('T15.3: Date-named backup file created', () => {
  const result = run({
    backups: [testBackup],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.filename, 'backup-2026-10-09.md');
  assert.ok(result.effects[0].path.includes('backup-2026-10-09.md'));
});

test('T15.4: Rows preserve structure readably', () => {
  const result = run({
    backups: [testBackup],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.ok, true);
  const markdown = result.effects[0].content;
  assert.ok(markdown.includes('Point'));
  assert.ok(markdown.includes('Answer'));
  assert.ok(markdown.includes('State'));
});

test('T15.5: Multiple backups sorted by timestamp', () => {
  const backup2 = {
    original: { Point: 'E06', Answer: 'Maybe', State: 'N' },
    replacement: { Point: 'E06', Answer: 'Sure', State: 'C' },
    timestamp: '2026-10-09T11:00:00Z'
  };

  const result = run({
    backups: [backup2, testBackup],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.ok, true);
  // Earlier timestamp should appear first
  const markdown = result.effects[0].content;
  const testIdx = markdown.indexOf('E05');
  const backup2Idx = markdown.indexOf('E06');
  assert.ok(testIdx < backup2Idx);
});

test('T15.6: Record count accurate', () => {
  const result = run({
    backups: [testBackup, testBackup],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.recordCount, 2);
});

test('T15.7: Empty backups array rejected', () => {
  const result = run({
    backups: [],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /cannot be empty/);
});

test('T15.8: Missing original row rejected', () => {
  const result = run({
    backups: [{
      replacement: { Point: 'E05', Answer: 'No' },
      timestamp: '2026-10-09T10:00:00Z'
    }],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /original row/);
});

test('T15.9: Missing replacement row rejected', () => {
  const result = run({
    backups: [{
      original: { Point: 'E05', Answer: 'Yes' },
      timestamp: '2026-10-09T10:00:00Z'
    }],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /replacement row/);
});

test('T15.10: Missing timestamp rejected', () => {
  const result = run({
    backups: [{
      original: { Point: 'E05', Answer: 'Yes' },
      replacement: { Point: 'E05', Answer: 'No' }
    }],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /timestamp/);
});

test('T15.11: Invalid checkpointDate format rejected', () => {
  const result = run({
    backups: [testBackup],
    checkpointDate: 'not-a-date'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /ISO 8601/);
});

test('T15.12: Non-array backups rejected', () => {
  const result = run({
    backups: testBackup,
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('T15.13: No mutation of input', () => {
  const input = {
    backups: [testBackup],
    checkpointDate: '2026-10-09'
  };
  const originalDate = input.checkpointDate;
  run(input);
  assert.strictEqual(input.checkpointDate, originalDate);
});

test('T15.14: Same input produces same output', () => {
  const input = {
    backups: [testBackup],
    checkpointDate: '2026-10-09'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('T15.15: Trace includes node and steps', () => {
  const result = run({
    backups: [testBackup],
    checkpointDate: '2026-10-09'
  });
  assert.ok(result.trace);
  assert.strictEqual(result.trace.node, 'L1.E06');
  assert.ok(Array.isArray(result.trace.steps));
});

test('T15.16: Checkpoint date included in result', () => {
  const result = run({
    backups: [testBackup],
    checkpointDate: '2026-10-09'
  });
  assert.strictEqual(result.checkpointDate, '2026-10-09');
});
