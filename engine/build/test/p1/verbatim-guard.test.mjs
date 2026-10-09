import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p1/verbatim-guard.mjs';

test('T04.1 Guard scans for reasoning comments, LLM signatures, inference logs', () => {
  const result = run({
    text: 'This is normal text without markers',
    sourceFile: 'test.md',
    lineNumber: 10
  });
  assert.equal(result.ok, true);
  assert.equal(result.validated, true);
});

test('T04.1a rejects reasoning marker', () => {
  const result = run({
    text: 'Some text with <reasoning>hidden thought</reasoning>',
    sourceFile: 'test.md',
    lineNumber: 5
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /forbidden/i);
});

test('T04.1b rejects signature marker', () => {
  const result = run({
    text: 'This was co-authored by Claude AI for testing purposes',
    sourceFile: 'test.md',
    lineNumber: 3
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /forbidden/i);
});

test('T04.1c rejects log marker', () => {
  const result = run({
    text: 'Here is the output log: [debug info]',
    sourceFile: 'test.md',
    lineNumber: 7
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /forbidden/i);
});

test('T04.1d rejects trace marker', () => {
  const result = run({
    text: 'Stack trace: function() -> step 1 -> step 2',
    sourceFile: 'test.md',
    lineNumber: 2
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /forbidden/i);
});

test('T04.2 Fails fast on parse with clear error message', () => {
  const result = run({
    text: 'Problem found <thinking>during processing</thinking>',
    sourceFile: 'data.md',
    lineNumber: 15
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /forbidden/i);
  assert.match(result.error, /reasoning/i);
});

test('T04.3 Diagnostics logged for troubleshooting', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({
    text: 'An error log appeared in the system',
    sourceFile: 'errors.md',
    lineNumber: 42,
    now
  });
  assert.equal(result.ok, false);
  assert.equal(result.sourceFile, 'errors.md');
  assert.equal(result.lineNumber, 42);
  assert.ok(result.markerType);
  assert.ok(result.audit);
  assert.equal(result.audit.event, 'agent-marker-detected');
  assert.equal(result.audit.at, now);
  assert.equal(result.audit.sourceFile, 'errors.md');
  assert.equal(result.audit.lineNumber, 42);
  assert.equal(result.audit.markerType, 'LOG');
});

test('T04.4 Prevents contaminated text entering pipeline', () => {
  const result = run({
    text: 'Pure text without any llm markers or artifacts',
    sourceFile: 'clean.md',
    lineNumber: 1
  });
  assert.equal(result.ok, true);
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
  const result = run(['text']);
  assert.equal(result.ok, false);
});

test('malformed input (text not string)', () => {
  const result = run({ text: 123 });
  assert.equal(result.ok, false);
  assert.match(result.error, /must be a string/i);
});

test('malformed input (empty string)', () => {
  const result = run({ text: '' });
  assert.equal(result.ok, false);
  assert.match(result.error, /must not be empty/i);
});

test('no mutation: input object unchanged', () => {
  const input = { text: 'Clean text', sourceFile: 'test.md', lineNumber: 5 };
  const original = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('same output twice: deterministic', () => {
  const input = { text: 'Consistent check', sourceFile: 'test.md' };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('trace contains node id', () => {
  const result = run({ text: 'Valid content' });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L1.E03');
  assert.ok(Array.isArray(result.trace.steps));
});
