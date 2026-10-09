import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p1/story-chapter.mjs';

test('T06.1 New chapters use markdown heading format with date', () => {
  const result = run({
    action: 'append',
    chapterText: 'This is a new chapter in the story.',
    date: '2026-10-09',
    existingChapters: []
  });
  assert.equal(result.ok, true);
  assert.match(result.formattedEntry, /^### 2026-10-09/);
  assert.match(result.formattedEntry, /This is a new chapter/);
});

test('T06.2 Edit to older chapter detected and blocked', () => {
  const result = run({
    action: 'edit',
    chapterText: 'Trying to edit old chapter',
    date: '2026-10-09',
    existingChapters: [
      { date: '2026-10-10', text: 'newer' }
    ],
    requestingUser: 'testuser'
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /blocked/i);
  assert.match(result.rejectionReason, /chronological/i);
});

test('T06.3 Error cites the newer chapter as reason', () => {
  const result = run({
    action: 'edit',
    chapterText: 'Attempt',
    date: '2026-10-08',
    existingChapters: [
      { date: '2026-10-09', text: 'newer' },
      { date: '2026-10-10', text: 'newest' }
    ]
  });
  assert.equal(result.ok, false);
  assert.ok(result.newerChapterDate);
});

test('T06.4 Audit log includes user identity and rejection reason', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({
    action: 'edit',
    chapterText: 'Attempt',
    date: '2026-10-07',
    existingChapters: [
      { date: '2026-10-08', text: 'newer' }
    ],
    requestingUser: 'alice@example.com',
    now
  });
  assert.equal(result.ok, false);
  assert.equal(result.requestingUser, 'alice@example.com');
  assert.ok(result.audit);
  assert.equal(result.audit.event, 'chapter-edit-rejected');
  assert.equal(result.audit.at, now);
  assert.equal(result.audit.requestingUser, 'alice@example.com');
  assert.equal(result.audit.reason, 'chronological-integrity-violation');
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
  const result = run(['test']);
  assert.equal(result.ok, false);
});

test('malformed input (missing field)', () => {
  const result = run({
    action: 'append',
    chapterText: 'text'
    // date missing
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be strings/i);
});

test('malformed input (invalid action)', () => {
  const result = run({
    action: 'delete',
    chapterText: 'text',
    date: '2026-10-09',
    existingChapters: []
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /append|edit/i);
});

test('malformed input (empty text)', () => {
  const result = run({
    action: 'append',
    chapterText: '',
    date: '2026-10-09',
    existingChapters: []
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must not be empty/i);
});

test('no mutation: input object unchanged', () => {
  const input = {
    action: 'append',
    chapterText: 'Test chapter',
    date: '2026-10-09',
    existingChapters: []
  };
  const original = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('same output twice: deterministic', () => {
  const input = {
    action: 'append',
    chapterText: 'Consistent test',
    date: '2026-10-09',
    existingChapters: []
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('trace contains node id', () => {
  const result = run({
    action: 'append',
    chapterText: 'Test',
    date: '2026-10-09',
    existingChapters: []
  });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L4.E08');
  assert.ok(Array.isArray(result.trace.steps));
});
