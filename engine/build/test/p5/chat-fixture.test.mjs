import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p5/chat-fixture.mjs';

test('T08.1 Chat fixture produces N conversations with 3-8 messages each', () => {
  const input = {
    seed: 'test-seed-1',
    N: 5,
    now: '2026-10-09T10:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.fixture.conversation_count, 5);

  for (const conv of result.fixture.conversations) {
    assert.ok(conv.messages.length >= 3);
    assert.ok(conv.messages.length <= 8);
  }
});

test('T08.2 Same seed produces identical fixture output', () => {
  const input = {
    seed: 'deterministic-seed',
    N: 3,
    now: '2026-10-09T10:00:00Z'
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepStrictEqual(result1.fixture.conversations, result2.fixture.conversations);
  assert.strictEqual(result1.metadata.checksum, result2.metadata.checksum);
});

test('T08.3 Fixture metadata includes seed, N, timestamp, version, checksum', () => {
  const input = {
    seed: 'metadata-test',
    N: 2,
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.metadata.seed, 'metadata-test');
  assert.strictEqual(result.metadata.N, 2);
  assert.strictEqual(result.metadata.timestamp_generated, '2026-10-09T12:00:00Z');
  assert.strictEqual(result.metadata.version, '1.0');
  assert.ok(result.metadata.checksum);
  assert.match(result.metadata.checksum, /^[a-f0-9]{16}$/);
});

test('T08.4 Fixtures deterministically sortable and comparable', () => {
  const fixtures = [];
  for (let i = 1; i <= 3; i++) {
    const input = {
      seed: `seed-${i}`,
      N: 2,
      now: '2026-10-09T10:00:00Z'
    };
    const result = run(input);
    fixtures.push(result.fixture);
  }

  const checksums = fixtures.map(f => f.checksum).sort();
  const checksums2 = fixtures.map(f => f.checksum).sort();
  assert.deepStrictEqual(checksums, checksums2);
});

test('T08.5 Output format matches standard chat export schema', () => {
  const input = {
    seed: 'schema-test',
    N: 1,
    now: '2026-10-09T10:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  const fixture = result.fixture;

  assert.ok(Array.isArray(fixture.conversations));
  for (const conv of fixture.conversations) {
    assert.ok(conv.id);
    assert.ok(conv.title);
    assert.ok(Array.isArray(conv.messages));
    assert.ok(conv.created_at);

    for (const msg of conv.messages) {
      assert.ok(['user', 'assistant'].includes(msg.role));
      assert.ok(typeof msg.content === 'string');
      assert.ok(msg.timestamp);
    }
  }
});

test('default 5 conversations if N not specified', () => {
  const input = {
    seed: 'default-test'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.fixture.conversation_count, 5);
  assert.strictEqual(result.fixture.conversations.length, 5);
});

test('different seeds produce different fixtures', () => {
  const input1 = {
    seed: 'seed-a',
    N: 3,
    now: '2026-10-09T10:00:00Z'
  };

  const input2 = {
    seed: 'seed-b',
    N: 3,
    now: '2026-10-09T10:00:00Z'
  };

  const result1 = run(input1);
  const result2 = run(input2);

  assert.notStrictEqual(result1.metadata.checksum, result2.metadata.checksum);
});

test('empty input', () => {
  const result = run({});
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /seed/);
});

test('malformed input - no seed', () => {
  const input = {
    N: 5,
    now: '2026-10-09T10:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - empty seed', () => {
  const input = {
    seed: '',
    N: 5,
    now: '2026-10-09T10:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - invalid N', () => {
  const input = {
    seed: 'test',
    N: 'not a number',
    now: '2026-10-09T10:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.fixture.conversation_count, 5);
});

test('no mutation of input', () => {
  const input = {
    seed: 'no-mutation-test',
    N: 2,
    now: '2026-10-09T10:00:00Z'
  };

  const original = JSON.stringify(input);
  run(input);
  assert.strictEqual(JSON.stringify(input), original);
});

test('same input produces same output', () => {
  const input = {
    seed: 'consistency-test',
    N: 2,
    now: '2026-10-09T10:00:00Z'
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('trace contains node and steps', () => {
  const input = {
    seed: 'trace-test',
    N: 1,
    now: '2026-10-09T10:00:00Z'
  };

  const result = run(input);
  assert.strictEqual(result.trace.node, 'L5.E02');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
  assert.ok(result.trace.steps.some(s => s.includes('seed')));
});
