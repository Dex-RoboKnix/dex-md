import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p5/timeline-point.mjs';

test('T01.1 Each timeline point record contains four core and five audit fields', () => {
  const input = {
    point: {
      issue_number: 123,
      title: 'Test issue',
      date: '2026-10-09',
      commit_hash: 'abc123def456',
      entered_by: 'alice',
      entered_at: '2026-10-09T10:00:00Z',
      modified_at: '2026-10-09T11:00:00Z',
      modified_by: 'bob',
      source_issue_url: 'https://github.com/example/repo/issues/123'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.point.issue_number, 123);
  assert.strictEqual(result.point.title, 'Test issue');
  assert.strictEqual(result.point.date, '2026-10-09');
  assert.strictEqual(result.point.commit_hash, 'abc123def456');
  assert.strictEqual(result.point.entered_by, 'alice');
  assert.strictEqual(result.point.entered_at, '2026-10-09T10:00:00Z');
  assert.strictEqual(result.point.modified_at, '2026-10-09T11:00:00Z');
  assert.strictEqual(result.point.modified_by, 'bob');
  assert.strictEqual(result.point.source_issue_url, 'https://github.com/example/repo/issues/123');
});

test('T01.2 Missing commit hashes are flagged', () => {
  const input = {
    point: {
      issue_number: 124,
      title: 'Missing hash issue',
      date: '2026-10-09',
      commit_hash: '',
      entered_by: 'alice',
      entered_at: '2026-10-09T10:00:00Z',
      modified_at: '2026-10-09T11:00:00Z',
      modified_by: 'bob',
      source_issue_url: 'https://github.com/example/repo/issues/124'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.point.commit_hash, 'hash:missing');
  assert.strictEqual(result.point.hash_status, 'hash:missing');
});

test('T01.3 Audit trail captures who entered and modified with timestamps', () => {
  const input = {
    point: {
      issue_number: 125,
      title: 'Audit trail test',
      date: '2026-10-08',
      commit_hash: 'def789',
      entered_by: 'charlie',
      entered_at: '2026-10-08T09:00:00Z',
      modified_at: '2026-10-09T15:30:00Z',
      modified_by: 'diane',
      source_issue_url: 'https://github.com/example/repo/issues/125'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.point.entered_by, 'charlie');
  assert.strictEqual(result.point.entered_at, '2026-10-08T09:00:00Z');
  assert.strictEqual(result.point.modified_by, 'diane');
  assert.strictEqual(result.point.modified_at, '2026-10-09T15:30:00Z');
});

test('T01.4 Timeline points sort deterministically by date then issue number (via the module sortKey)', () => {
  const mk = (n, d) => run({ now: '2026-10-09T10:00:00Z', point: { issue_number: n, title: 't', date: d, commit_hash: 'abc', entered_by: 'a', entered_at: '2026-10-09', modified_at: '2026-10-09', modified_by: 'a', source_issue_url: 'u' } });
  const results = [mk(200, '2026-10-09'), mk(100, '2026-10-09'), mk(150, '2026-10-08'), mk(30, '2026-10-09')];
  assert.ok(results.every((r) => r.ok && typeof r.sortKey === 'string'));
  const order = results.slice().sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0)).map((r) => r.point.issue_number);
  assert.deepEqual(order, [150, 30, 100, 200]);
});

test('T01.2 a point without a commit hash is flagged and not publishable until a human verifies it', () => {
  const r = run({ now: '2026-10-09T10:00:00Z', point: { issue_number: 5, title: 't', date: '2026-10-09', entered_by: 'a', entered_at: '2026-10-09', modified_at: '2026-10-09', modified_by: 'a', source_issue_url: 'u' } });
  assert.equal(r.point.commit_hash, 'hash:missing');
  assert.equal(r.publishable, false);
  assert.equal(r.needsHumanVerification, true);
});

test('T01.3 the audit trail records who entered and modified the point, with timestamps', () => {
  const r = run({ now: '2026-10-09T10:00:00Z', point: { issue_number: 5, title: 't', date: '2026-10-09', commit_hash: 'abc', entered_by: 'ann', entered_at: '2026-10-08T09:00:00Z', modified_at: '2026-10-09T09:00:00Z', modified_by: 'bob', source_issue_url: 'u' } });
  assert.equal(r.audit.event, 'timeline-point-recorded');
  assert.equal(r.audit.at, '2026-10-09T10:00:00Z');
  assert.equal(r.audit.entered_by, 'ann');
  assert.equal(r.audit.modified_by, 'bob');
  assert.equal(r.audit.modified_at, '2026-10-09T09:00:00Z');
  assert.equal(r.publishable, true);
});

test('T01.5 GitHub issue URL is consistently linked', () => {
  const input = {
    point: {
      issue_number: 126,
      title: 'URL test',
      date: '2026-10-09',
      commit_hash: 'abc',
      entered_by: 'user1',
      entered_at: '2026-10-09T00:00:00Z',
      modified_at: '2026-10-09T00:00:00Z',
      modified_by: 'user2',
      source_issue_url: 'https://github.com/Dex-RoboKnix/dexroboknix/issues/126'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.match(result.point.source_issue_url, /\/issues\/126$/);
});

test('empty input', () => {
  const result = run({});
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /point is required/);
});

test('malformed input - null point', () => {
  const result = run({ point: null });
  assert.strictEqual(result.ok, false);
});

test('malformed input - invalid date', () => {
  const input = {
    point: {
      issue_number: 127,
      title: 'Bad date',
      date: '2026/10/09',
      commit_hash: 'abc',
      entered_by: 'user',
      entered_at: '2026-10-09T00:00:00Z',
      modified_at: '2026-10-09T00:00:00Z',
      modified_by: 'user',
      source_issue_url: 'https://example.com/issues/127'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('no mutation of input', () => {
  const input = {
    point: {
      issue_number: 128,
      title: 'No mutation',
      date: '2026-10-09',
      commit_hash: 'xyz',
      entered_by: 'user',
      entered_at: '2026-10-09T00:00:00Z',
      modified_at: '2026-10-09T00:00:00Z',
      modified_by: 'user',
      source_issue_url: 'https://example.com/issues/128'
    }
  };

  const original = JSON.stringify(input);
  run(input);
  assert.strictEqual(JSON.stringify(input), original);
});

test('same input produces same output', () => {
  const input = {
    point: {
      issue_number: 129,
      title: 'Deterministic',
      date: '2026-10-09',
      commit_hash: 'consistent',
      entered_by: 'user',
      entered_at: '2026-10-09T00:00:00Z',
      modified_at: '2026-10-09T00:00:00Z',
      modified_by: 'user',
      source_issue_url: 'https://example.com/issues/129'
    }
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('trace contains node and steps', () => {
  const input = {
    point: {
      issue_number: 130,
      title: 'Trace test',
      date: '2026-10-09',
      commit_hash: 'hash',
      entered_by: 'user',
      entered_at: '2026-10-09T00:00:00Z',
      modified_at: '2026-10-09T00:00:00Z',
      modified_by: 'user',
      source_issue_url: 'https://example.com/issues/130'
    }
  };

  const result = run(input);
  assert.strictEqual(result.trace.node, 'L4.E07');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
