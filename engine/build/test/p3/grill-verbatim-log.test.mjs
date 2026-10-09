import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/grill-verbatim-log.mjs';

test('T03.1: Verbatim answer text is logged exactly as provided with escaped newlines', () => {
  const result = run({ answer: 'Line 1\nLine 2', now: '2026-10-09T12:00:00Z' });
  assert.equal(result.ok, true);
  assert.equal(result.verbatim, 'Line 1\\nLine 2');
});

test('T03.2: Timestamp appears on a separate metadata line, not with the answer', () => {
  const result = run({ answer: 'My answer', now: '2026-10-09T12:00:00Z' });
  assert.equal(result.ok, true);
  assert(result.effects);
  assert.equal(result.effects.length, 1);
  const content = result.effects[0].content;
  assert(!content.includes('verbatim: My answer 2026'));
  assert(content.includes('timestamp=2026-10-09T12:00:00Z'));
});

test('T03.3: Agent-reading line includes source and confidence score', () => {
  const result = run({ answer: 'test', source: 'user', confidence: 0.95 });
  assert.equal(result.ok, true);
  assert.equal(result.reading.source, 'user');
  assert.equal(result.reading.confidence, 0.95);
  assert(result.effects[0].content.includes('source=user'));
  assert(result.effects[0].content.includes('confidence=0.95'));
});

test('T03.4: Whitespace and formatting are preserved in verbatim log', () => {
  const result = run({ answer: 'Text with  spaces\tand tabs' });
  assert.equal(result.ok, true);
  assert(result.verbatim.includes('\\t'));
});

test('T03: empty answer returns error', () => {
  const result = run({ answer: '' });
  assert.equal(result.ok, false);
});

test('T03: missing answer returns error', () => {
  const result = run({ now: '2026-10-09T12:00:00Z' });
  assert.equal(result.ok, false);
});

test('T03: invalid now string returns error', () => {
  const result = run({ answer: 'test', now: 123 });
  assert.equal(result.ok, false);
});

test('T03: timestamp null when now absent', () => {
  const result = run({ answer: 'test' });
  assert.equal(result.ok, true);
  assert(result.effects[0].content.includes('timestamp=null'));
});

test('T03: no mutation of input', () => {
  const input = { answer: 'test\nlines', now: '2026-10-09T12:00:00Z' };
  const orig = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), orig);
});

test('T03: same input produces same output twice', () => {
  const input = { answer: 'test', now: '2026-10-09T12:00:00Z' };
  const r1 = run(input);
  const r2 = run(input);
  assert.deepEqual(r1, r2);
});

test('T03: trace includes node id', () => {
  const result = run({ answer: 'test' });
  assert.equal(result.trace.node, 'L2.E03');
  assert(Array.isArray(result.trace.steps));
});

test('T03: effects includes append-log', () => {
  const result = run({ answer: 'test' });
  assert.equal(result.ok, true);
  assert(Array.isArray(result.effects));
  assert.equal(result.effects[0].kind, 'append-log');
  assert(result.effects[0].path);
  assert(result.effects[0].content);
});
