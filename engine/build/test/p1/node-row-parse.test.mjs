import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p1/node-row-parse.mjs';

test('T07.1 Parser maps Point, Answer, Tag, State, Sources, Verified, Next to object fields', () => {
  const result = run({
    point: 'L1.E05',
    answer: 'Define coverage metric',
    tag: 'DOCUMENT',
    state: 'C',
    sources: 'spec.md',
    verified: 'alice',
    next: 'L1.E06'
  });
  assert.equal(result.ok, true);
  assert.equal(result.parsed.point, 'L1.E05');
  assert.equal(result.parsed.answer, 'Define coverage metric');
  assert.equal(result.parsed.state, 'C');
});

test('T07.2 State codes C, W, N, NA, U validated', () => {
  const validCodes = ['C', 'W', 'N', 'NA', 'U'];
  for (const code of validCodes) {
    const result = run({
      point: 'L1.E05',
      answer: 'test',
      tag: 'DOCUMENT',
      state: code,
      sources: '',
      verified: '',
      next: ''
    });
    assert.equal(result.ok, true, `State code ${code} should be valid`);
  }
});

test('T07.2a rejects unknown state code', () => {
  const result = run({
    point: 'L1.E05',
    answer: 'test',
    tag: 'DOCUMENT',
    state: 'X',
    sources: '',
    verified: '',
    next: ''
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /invalid state code/i);
});

test('T07.3 Missing columns logged and default-filled', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({
    point: 'L1.E05',
    answer: '',
    tag: '',
    state: 'W',
    sources: '',
    verified: '',
    next: '',
    now
  });
  assert.equal(result.ok, true);
  assert.equal(result.parsed.answer, null);
  assert.equal(result.parsed.tag, null);
  assert.equal(result.parsed.verified, null);
  assert.deepEqual(result.parsed.sources, []);
  assert.deepEqual(result.parsed.next, []);
  // assert audit for missing columns
  assert.ok(result.audit);
  assert.equal(result.audit.event, 'node-row-parsed-with-defaults');
  assert.equal(result.audit.at, now);
  assert.equal(result.audit.point, 'L1.E05');
  assert.ok(Array.isArray(result.audit.missingColumns));
  assert.equal(result.audit.missingColumns.length, 5);
});

test('T07.4 Typechecked for programmatic use', () => {
  const result = run({
    point: 'L1.E05',
    answer: 'Answer text',
    tag: 'CITED',
    state: 'C',
    sources: ['source1.md', 'source2.md'],
    verified: 'bob@example.com',
    next: ['L1.E06', 'L1.E07']
  });
  assert.equal(result.ok, true);
  assert.ok(Array.isArray(result.parsed.sources));
  assert.ok(Array.isArray(result.parsed.next));
  assert.equal(result.parsed.sources[0], 'source1.md');
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
  const result = run(['L1.E05']);
  assert.equal(result.ok, false);
});

test('malformed input (missing point)', () => {
  const result = run({
    answer: 'test',
    tag: 'DOCUMENT',
    state: 'C'
  });
  assert.equal(result.ok, false);
});

test('malformed input (empty point)', () => {
  const result = run({
    point: '',
    answer: 'test',
    tag: 'DOCUMENT',
    state: 'C'
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /point must not be empty/i);
});

test('no mutation: input object unchanged', () => {
  const input = {
    point: 'L1.E05',
    answer: 'test',
    tag: 'DOCUMENT',
    state: 'C',
    sources: ['src.md'],
    verified: 'user',
    next: ['L1.E06']
  };
  const original = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('same output twice: deterministic', () => {
  const input = {
    point: 'L1.E05',
    answer: 'Consistent',
    tag: 'MODEL',
    state: 'W',
    sources: 'test.md',
    verified: 'alice',
    next: 'L1.E06'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('trace contains node id', () => {
  const result = run({
    point: 'L1.E05',
    answer: 'test',
    tag: 'DOCUMENT',
    state: 'C',
    sources: '',
    verified: '',
    next: ''
  });
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L4.E08');
  assert.ok(Array.isArray(result.trace.steps));
});
