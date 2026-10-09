import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/grill-suggest.mjs';

test('T16.1 Suggested answers include structured source reference', () => {
  const input = {
    answer: 'Use async/await',
    source: { type: 'issue', id: '123' },
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.suggestion.text, 'Use async/await');
  assert.equal(result.suggestion.source.type, 'issue');
  assert.equal(result.suggestion.source.id, '123');
});

test('T16.2 Sources from issue ids, node ids, or doc links are verifiable', () => {
  const verifiableSources = [
    { type: 'issue', id: '42' },
    { type: 'node', id: 'L2.E03' },
    { type: 'doc-link', id: 'spec.md#section' }
  ];

  for (const source of verifiableSources) {
    const input = {
      answer: 'Test answer',
      source,
      now: '2026-10-09T12:00:00Z'
    };

    const result = run(input);
    assert.equal(result.ok, true);
    assert.equal(result.verified, true);
  }
});

test('T16.3 Unverifiable sources marked unchecked and still displayed', () => {
  const input = {
    answer: 'Some suggestion',
    source: { type: 'rumor', id: 'unknown' },
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.verified, false);
  assert.equal(result.suggestion.verified, false);
  // Still displayed despite being unverified
  assert(result.suggestion.text);
  assert(result.suggestion.source);
});

test('T16.4 Log contains suggestion text and source via effects', () => {
  const input = {
    answer: 'Import React hooks',
    source: { type: 'node', id: 'T15' },
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert(result.effects);
  assert(Array.isArray(result.effects));
  assert.equal(result.effects[0].kind, 'append-log');
  assert.match(result.effects[0].content, /Import React hooks/);
  assert.match(result.effects[0].content, /node:T15/);
});

test('T16 empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T16 malformed input returns error', () => {
  const result = run({ answer: 'test', source: null });
  assert.equal(result.ok, false);
});

test('T16 empty answer returns error', () => {
  const result = run({ answer: '', source: { type: 'issue', id: '1' } });
  assert.equal(result.ok, false);
});

test('T16 no mutation of input', () => {
  const input = {
    answer: 'Test',
    source: { type: 'issue', id: '1' },
    now: '2026-10-09T12:00:00Z'
  };
  const original = JSON.stringify(input);

  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('T16 same output twice', () => {
  const input = {
    answer: 'Test',
    source: { type: 'issue', id: '1' },
    now: '2026-10-09T12:00:00Z'
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T16 trace includes node and steps', () => {
  const input = {
    answer: 'Test',
    source: { type: 'issue', id: '1' },
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.trace.node, 'L2.E03');
  assert(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
