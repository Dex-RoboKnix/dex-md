import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p1/journal-entry.mjs';

test('T03.1 Entry preserves human words without escaping', () => {
  const result = run({
    humanWords: 'This is my journal entry with special chars: $#@!',
    issueLink: 'https://github.com/user/repo/issues/42',
    vaultPath: '/vault/entry.md'
  });
  assert.equal(result.ok, true);
  assert.match(result.entry, /This is my journal entry with special chars: \$#@!/);
});

test('T03.2 Source reference links issue and vault location', () => {
  const result = run({
    humanWords: 'Test entry',
    issueLink: 'https://github.com/user/repo/issues/123',
    vaultPath: '/vault/docs/note.md'
  });
  assert.equal(result.ok, true);
  assert.match(result.sourceReference, /https:\/\/github\.com\/user\/repo\/issues\/123/);
  assert.match(result.sourceReference, /vault\/docs\/note\.md/);
});

test('T03.3 Markdown format is human-readable', () => {
  const result = run({
    humanWords: 'A clear entry',
    issueLink: 'https://github.com/test/repo/issues/1',
    vaultPath: '/vault/test.md'
  });
  assert.equal(result.ok, true);
  assert.match(result.entry, /^>/); // blockquote
  assert.match(result.entry, /```/); // fenced block
  assert.match(result.entry, /Source:/); // reference heading
});

test('T03.4 Fenced block protects special characters', () => {
  const result = run({
    humanWords: 'Code: `const x = 5;` and more',
    issueLink: 'https://github.com/test/repo/issues/1',
    vaultPath: '/vault/code.md'
  });
  assert.equal(result.ok, true);
  assert.match(result.fencedBlock, /const x = 5/);
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
    humanWords: 'test',
    issueLink: 'https://github.com/test/repo/issues/1'
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be strings/i);
});

test('malformed input (empty string)', () => {
  const result = run({
    humanWords: '',
    issueLink: 'https://github.com/test/repo/issues/1',
    vaultPath: '/vault/test.md'
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /must not be empty/i);
});

test('no mutation: input object unchanged', () => {
  const input = {
    humanWords: 'Test',
    issueLink: 'https://github.com/test/repo/issues/1',
    vaultPath: '/vault/test.md'
  };
  const original = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('same output twice: deterministic', () => {
  const input = {
    humanWords: 'Consistent',
    issueLink: 'https://github.com/test/repo/issues/1',
    vaultPath: '/vault/test.md'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('trace contains node id', () => {
  const result = run({
    humanWords: 'Test',
    issueLink: 'https://github.com/test/repo/issues/1',
    vaultPath: '/vault/test.md'
  });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L4.E08');
  assert.ok(Array.isArray(result.trace.steps));
});
