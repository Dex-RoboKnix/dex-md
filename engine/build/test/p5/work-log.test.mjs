import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p5/work-log.mjs';

test('T03.1 Work log captures one entry per agent work event', () => {
  const input = {
    entries: [
      {
        agent_name: 'Builder',
        timestamp: '2026-10-09T10:00:00Z',
        theme: 'T01',
        file_path: 'lib/p5/timeline-point.mjs',
        commit_hash: 'abc123'
      },
      {
        agent_name: 'Tester',
        timestamp: '2026-10-09T10:05:00Z',
        theme: 'T01',
        file_path: 'test/p5/timeline-point.test.mjs',
        commit_hash: 'def456'
      }
    ]
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.work_log.length, 2);
});

test('T03.2 Each entry includes agent name, timestamp, theme, file path, commit hash', () => {
  const input = {
    entries: [
      {
        agent_name: 'TestBuilder',
        timestamp: '2026-10-09T11:00:00Z',
        theme: 'T02',
        file_path: 'lib/p5/chapter.mjs',
        commit_hash: 'xyz789'
      }
    ]
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  const entry = result.work_log[0];
  assert.strictEqual(entry.agent_name, 'TestBuilder');
  assert.strictEqual(entry.timestamp, '2026-10-09T11:00:00Z');
  assert.strictEqual(entry.theme, 'T02');
  assert.strictEqual(entry.file_path, 'lib/p5/chapter.mjs');
  assert.strictEqual(entry.commit_hash, 'xyz789');
});

test('T03.3 Work log is sortable by theme and date', () => {
  const input = {
    entries: [
      {
        agent_name: 'A',
        timestamp: '2026-10-09T15:00:00Z',
        theme: 'T02',
        file_path: 'file2.mjs',
        commit_hash: 'hash2'
      },
      {
        agent_name: 'B',
        timestamp: '2026-10-09T10:00:00Z',
        theme: 'T01',
        file_path: 'file1.mjs',
        commit_hash: 'hash1'
      },
      {
        agent_name: 'C',
        timestamp: '2026-10-09T12:00:00Z',
        theme: 'T01',
        file_path: 'file3.mjs',
        commit_hash: 'hash3'
      }
    ]
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.work_log[0].theme, 'T01');
  assert.strictEqual(result.work_log[0].timestamp, '2026-10-09T10:00:00Z');
  assert.strictEqual(result.work_log[1].theme, 'T01');
  assert.strictEqual(result.work_log[1].timestamp, '2026-10-09T12:00:00Z');
  assert.strictEqual(result.work_log[2].theme, 'T02');
});

test('T03.4 Duplicate entries deduplicated by timestamp and theme', () => {
  const input = {
    entries: [
      {
        agent_name: 'A',
        timestamp: '2026-10-09T10:00:00Z',
        theme: 'T01',
        file_path: 'file1.mjs',
        commit_hash: 'hash1'
      },
      {
        agent_name: 'B',
        timestamp: '2026-10-09T10:00:00Z',
        theme: 'T01',
        file_path: 'different_file.mjs',
        commit_hash: 'hash2'
      },
      {
        agent_name: 'C',
        timestamp: '2026-10-09T11:00:00Z',
        theme: 'T02',
        file_path: 'file2.mjs',
        commit_hash: 'hash3'
      }
    ]
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.deduped_count, 2);
  assert.strictEqual(result.work_log.length, 2);
});

test('T03.5 Enables deterministic replay', () => {
  const input = {
    entries: [
      {
        agent_name: 'A',
        timestamp: '2026-10-09T10:00:00Z',
        theme: 'T03',
        file_path: 'file3.mjs',
        commit_hash: 'hash3'
      },
      {
        agent_name: 'B',
        timestamp: '2026-10-09T09:00:00Z',
        theme: 'T02',
        file_path: 'file2.mjs',
        commit_hash: 'hash2'
      }
    ]
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  const sorted = result.work_log;
  assert.strictEqual(sorted[0].theme, 'T02');
  assert.strictEqual(sorted[1].theme, 'T03');
});

test('empty entries array', () => {
  const result = run({ entries: [] });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /cannot be empty/);
});

test('malformed input - not an array', () => {
  const result = run({ entries: 'not an array' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('malformed input - missing agent name', () => {
  const input = {
    entries: [
      {
        timestamp: '2026-10-09T10:00:00Z',
        theme: 'T01',
        file_path: 'file.mjs',
        commit_hash: 'hash'
      }
    ]
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - missing commit hash', () => {
  const input = {
    entries: [
      {
        agent_name: 'A',
        timestamp: '2026-10-09T10:00:00Z',
        theme: 'T01',
        file_path: 'file.mjs'
      }
    ]
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('no mutation of input', () => {
  const input = {
    entries: [
      {
        agent_name: 'A',
        timestamp: '2026-10-09T10:00:00Z',
        theme: 'T01',
        file_path: 'file.mjs',
        commit_hash: 'hash'
      }
    ]
  };

  const original = JSON.stringify(input);
  run(input);
  assert.strictEqual(JSON.stringify(input), original);
});

test('same input produces same output', () => {
  const input = {
    entries: [
      {
        agent_name: 'A',
        timestamp: '2026-10-09T10:00:00Z',
        theme: 'T01',
        file_path: 'file.mjs',
        commit_hash: 'hash'
      }
    ]
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('trace contains node and steps', () => {
  const input = {
    entries: [
      {
        agent_name: 'A',
        timestamp: '2026-10-09T10:00:00Z',
        theme: 'T01',
        file_path: 'file.mjs',
        commit_hash: 'hash'
      }
    ]
  };

  const result = run(input);
  assert.strictEqual(result.trace.node, 'L4.E07');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
