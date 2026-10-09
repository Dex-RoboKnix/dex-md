import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/node-assign.mjs';

test('T10.1 Conversation title checked first for layer keywords', () => {
  const result = run({
    conversations: [
      {
        id: 'c1',
        title: 'Governance and licensing discussion',
        messages: [{ content: 'Let\'s talk about the agent framework' }]
      }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.assignedCount, 1);
  assert.equal(result.assigned[0].assignedLayer, 1); // governance → L1
});

test('T10.2 First message checked if title lacks keywords', () => {
  const result = run({
    conversations: [
      {
        id: 'c2',
        title: 'Chat',
        messages: [{ content: 'We need to set up the vault for persistence' }]
      }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.assignedCount, 1);
  assert.equal(result.assigned[0].assignedLayer, 6); // persistence → L6
});

test('T10.3 Unmatched conversations flagged for review', () => {
  const result = run({
    conversations: [
      { id: 'c3', title: 'Random Chat', messages: [{ content: 'Just talking' }] }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.unassignedCount, 1);
  assert.equal(result.assigned.length, 0);
  assert(result.unassigned[0].reason);
});

test('T10.1b Product keywords assigned to L2', () => {
  const result = run({
    conversations: [
      { id: 'c4', title: 'ShadowOS development', messages: [] }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.assigned[0].assignedLayer, 2);
});

test('T10.1c ADE keywords assigned to L3', () => {
  const result = run({
    conversations: [
      { id: 'c5', title: 'Building the agent desktop', messages: [] }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.assigned[0].assignedLayer, 3);
});

test('T10.1d Validation keywords assigned to L5', () => {
  const result = run({
    conversations: [
      { id: 'c6', title: 'Setting up verification checks', messages: [] }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.assigned[0].assignedLayer, 5);
});

test('Highest layer wins if multiple matches', () => {
  const result = run({
    conversations: [
      {
        id: 'c7',
        title: 'Licensing and persistence storage',
        messages: []
      }
    ]
  });
  assert.equal(result.ok, true);
  // Both L1 (licensing) and L6 (persistence) match, L6 is highest
  assert.equal(result.assigned[0].assignedLayer, 6);
});

test('Empty conversations array processed', () => {
  const result = run({ conversations: [] });
  assert.equal(result.ok, true);
  assert.equal(result.assignedCount, 0);
  assert.equal(result.unassignedCount, 0);
});

test('Multiple conversations processed', () => {
  const result = run({
    conversations: [
      { id: 'c1', title: 'Governance', messages: [] },
      { id: 'c2', title: 'Random', messages: [] },
      { id: 'c3', title: 'Validation checks', messages: [] }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.assignedCount, 2);
  assert.equal(result.unassignedCount, 1);
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('Missing conversations array rejected', () => {
  const result = run({});
  assert.equal(result.ok, false);
});

test('Case-insensitive keyword matching', () => {
  const result = run({
    conversations: [
      { id: 'c8', title: 'GOVERNANCE DISCUSSION', messages: [] }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.assigned[0].assignedLayer, 1);
});

test('Keyword in middle of title matched', () => {
  const result = run({
    conversations: [
      { id: 'c9', title: 'Discussion about licensing terms', messages: [] }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.assigned[0].assignedLayer, 1);
});

test('No mutation of input', () => {
  const input = {
    conversations: [
      { id: 'c1', title: 'Governance', messages: [] }
    ]
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    conversations: [
      { id: 'c1', title: 'ShadowOS', messages: [] }
    ]
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    conversations: [{ id: 'c1', title: 'Test', messages: [] }]
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E01');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});

test('Validation keywords assigned to L5', () => {
  const result = run({
    conversations: [
      { id: 'c10', title: 'Adding validation checks', messages: [] }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.assigned[0].assignedLayer, 5);
});
