import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/export-split.mjs';

test('T09.1 Conversation entry receives original id', () => {
  const result = run({
    conversations: [
      { id: 'conv-001', title: 'My Chat', messages: [] }
    ],
    exportType: 'openai'
  });
  assert.equal(result.ok, true);
  assert.equal(result.split[0].id, 'conv-001');
});

test('T09.2 Missing title filled with first message snippet', () => {
  const result = run({
    conversations: [
      {
        id: 'conv-002',
        messages: [
          { content: 'Hello, how are you today?' },
          { content: 'Fine' }
        ]
      }
    ],
    exportType: 'openai'
  });
  assert.equal(result.ok, true);
  assert(result.split[0].title);
  assert(result.split[0].title.includes('Hello'));
});

test('T09.2b Title preserved if present', () => {
  const result = run({
    conversations: [
      {
        id: 'conv-003',
        title: 'Conversation Title',
        messages: [{ content: 'This is a message' }]
      }
    ],
    exportType: 'openai'
  });
  assert.equal(result.ok, true);
  assert.equal(result.split[0].title, 'Conversation Title');
});

test('T09.3 Timestamps extracted from first message', () => {
  const timestamp = '2026-10-09T10:00:00Z';
  const result = run({
    conversations: [
      {
        id: 'conv-004',
        title: 'Chat',
        messages: [
          { timestamp },
          { timestamp: '2026-10-09T11:00:00Z' }
        ]
      }
    ],
    exportType: 'openai'
  });
  assert.equal(result.ok, true);
  assert.equal(result.split[0].timestamp, timestamp);
});

test('T09.3b Alternative timestamp field names supported', () => {
  const result = run({
    conversations: [
      {
        id: 'conv-005',
        messages: [{ created_at: '2026-10-09T12:00:00Z' }]
      }
    ],
    exportType: 'gemini'
  });
  assert.equal(result.ok, true);
  assert.equal(result.split[0].timestamp, '2026-10-09T12:00:00Z');
});

test('Provenance preserved in export type field', () => {
  const result = run({
    conversations: [{ id: 'c1', messages: [] }],
    exportType: 'gemini'
  });
  assert.equal(result.ok, true);
  assert.equal(result.split[0].originalProvenance, 'gemini');
});

test('Long title truncated with ellipsis', () => {
  const longMessage = 'a'.repeat(100);
  const result = run({
    conversations: [
      {
        id: 'conv-006',
        messages: [{ content: longMessage }]
      }
    ],
    exportType: 'openai'
  });
  assert.equal(result.ok, true);
  assert(result.split[0].title.includes('...'));
});

test('Multiple conversations processed', () => {
  const result = run({
    conversations: [
      { id: 'c1', title: 'Chat 1', messages: [] },
      { id: 'c2', title: 'Chat 2', messages: [] },
      { id: 'c3', title: 'Chat 3', messages: [] }
    ],
    exportType: 'openai'
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 3);
  assert.equal(result.split.length, 3);
});

test('Empty conversations array processed', () => {
  const result = run({
    conversations: [],
    exportType: 'openai'
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 0);
});

test('Invalid exportType rejected', () => {
  const result = run({
    conversations: [],
    exportType: 'unknown'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('exportType'));
});

test('Missing conversations rejected', () => {
  const result = run({
    exportType: 'openai'
  });
  assert.equal(result.ok, false);
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('No mutation of input', () => {
  const input = {
    conversations: [
      { id: 'c1', title: 'Chat', messages: [{ content: 'test' }] }
    ],
    exportType: 'openai'
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    conversations: [
      { id: 'c1', title: 'Chat', messages: [] }
    ],
    exportType: 'openai'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    conversations: [{ id: 'c1', messages: [] }],
    exportType: 'openai'
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E01');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});

test('Message count tracked', () => {
  const result = run({
    conversations: [
      {
        id: 'c1',
        messages: [
          { content: 'msg1' },
          { content: 'msg2' },
          { content: 'msg3' }
        ]
      }
    ],
    exportType: 'openai'
  });
  assert.equal(result.split[0].messageCount, 3);
});
