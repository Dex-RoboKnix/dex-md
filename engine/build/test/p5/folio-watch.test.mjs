import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p5/folio-watch.mjs';

test('T05.1 File hashes compared against build record', () => {
  const input = {
    old_hashes: {
      'file1.txt': 'hash_abc123',
      'file2.txt': 'hash_def456'
    },
    new_hashes: {
      'file1.txt': 'hash_abc123',
      'file2.txt': 'hash_def456'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.report.length, 0);
  assert.strictEqual(result.summary.changed, 0);
});

test('T05.2 Changes reported in table with filepath, old_hash, new_hash, status', () => {
  const input = {
    old_hashes: {
      'file1.txt': 'hash_old'
    },
    new_hashes: {
      'file1.txt': 'hash_new'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.report.length, 1);
  assert.strictEqual(result.report[0].filepath, 'file1.txt');
  assert.strictEqual(result.report[0].old_hash, 'hash_old');
  assert.strictEqual(result.report[0].new_hash, 'hash_new');
  assert.strictEqual(result.report[0].status, 'CHANGED');
});

test('T05.3 Deleted files flagged requiring manual reconciliation', () => {
  const input = {
    old_hashes: {
      'deleted_file.txt': 'hash_abc'
    },
    new_hashes: {}
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.report.length, 1);
  assert.strictEqual(result.report[0].status, 'DELETED');
  assert.strictEqual(result.report[0].requires_reconciliation, true);
  assert.strictEqual(result.summary.requires_reconciliation, true);
});

test('T05.4 New files detected and reported as NEW status', () => {
  const input = {
    old_hashes: {},
    new_hashes: {
      'new_file.txt': 'hash_xyz'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.report.length, 1);
  assert.strictEqual(result.report[0].status, 'NEW');
  assert.strictEqual(result.report[0].filepath, 'new_file.txt');
  assert.strictEqual(result.report[0].old_hash, null);
});

test('T05.5 Report is human-scannable and actionable', () => {
  const input = {
    old_hashes: {
      'file1.txt': 'hash1',
      'file2.txt': 'hash2',
      'file3.txt': 'hash3'
    },
    new_hashes: {
      'file1.txt': 'hash1_new',
      'file3.txt': 'hash3',
      'file4.txt': 'hash4'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  const changed = result.report.filter(r => r.status === 'CHANGED');
  const deleted = result.report.filter(r => r.status === 'DELETED');
  const added = result.report.filter(r => r.status === 'NEW');

  assert.strictEqual(changed.length, 1);
  assert.strictEqual(deleted.length, 1);
  assert.strictEqual(added.length, 1);
  assert.strictEqual(result.summary.changed, 1);
  assert.strictEqual(result.summary.deleted, 1);
  assert.strictEqual(result.summary.new, 1);
});

test('empty old and new hashes', () => {
  const input = {
    old_hashes: {},
    new_hashes: {}
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.report.length, 0);
  assert.strictEqual(result.summary.total_changes, 0);
});

test('malformed input - null old_hashes', () => {
  const input = {
    old_hashes: null,
    new_hashes: {}
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - array instead of object', () => {
  const input = {
    old_hashes: [],
    new_hashes: {}
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - missing new_hashes', () => {
  const input = {
    old_hashes: {}
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('no mutation of input', () => {
  const input = {
    old_hashes: {
      'file1.txt': 'hash1'
    },
    new_hashes: {
      'file1.txt': 'hash_new'
    }
  };

  const original = JSON.stringify(input);
  run(input);
  assert.strictEqual(JSON.stringify(input), original);
});

test('same input produces same output', () => {
  const input = {
    old_hashes: {
      'file1.txt': 'hash1'
    },
    new_hashes: {
      'file1.txt': 'hash_new'
    }
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('trace contains node and steps', () => {
  const input = {
    old_hashes: {
      'file1.txt': 'hash1'
    },
    new_hashes: {
      'file1.txt': 'hash1'
    }
  };

  const result = run(input);
  assert.strictEqual(result.trace.node, 'L4.E02');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
