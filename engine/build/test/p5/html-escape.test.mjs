import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p5/html-escape.mjs';

test('T12.1: All special HTML characters escaped to named entities', () => {
  const input = { text: '<div class="test">A & B</div>' };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.match(result.escaped, /&lt;/);
  assert.match(result.escaped, /&gt;/);
  assert.match(result.escaped, /&quot;/);
  assert.match(result.escaped, /&amp;/);
});

test('T12.2: Ampersand escaped correctly', () => {
  const input = { text: 'A & B' };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.escaped, 'A &amp; B');
});

test('T12.3: Less-than and greater-than escaped', () => {
  const input = { text: '<tag>' };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.escaped, '&lt;tag&gt;');
});

test('T12.4: Quotes escaped (double and apostrophe)', () => {
  const input = { text: "\"Hello\" and 'World'" };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.match(result.escaped, /&quot;/);
  assert.match(result.escaped, /&apos;/);
});

test('T12.5: Escape function is deterministic', () => {
  const input = { text: '<div class="test">A & B</div>' };
  const result1 = run(input);
  const result2 = run(input);
  // Deterministic: same input produces same escaped output
  assert.equal(result1.escaped, result2.escaped);
});

test('T12: Empty input returns error', () => {
  const result = run({});
  assert.equal(result.ok, false);
});

test('T12: Null text returns error', () => {
  const result = run({ text: null });
  assert.equal(result.ok, false);
});

test('T12: Non-string text returns error', () => {
  const result = run({ text: 123 });
  assert.equal(result.ok, false);
});

test('T12: Empty string is valid', () => {
  const result = run({ text: '' });
  assert.equal(result.ok, true);
  assert.equal(result.escaped, '');
});

test('T12: No mutation of input', () => {
  const input = { text: '<div>' };
  const copy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, copy);
});

test('T12: Same input produces same output twice', () => {
  const input = { text: '<script>alert("xss")</script>' };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T12: Trace includes steps for each escaped character', () => {
  const input = { text: '<a href="#">Link</a>' };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L5.E05');
  assert.ok(result.trace.steps.length > 0);
  assert.ok(result.trace.steps.some(s => s.character === '<' || s.character === '"'));
});
