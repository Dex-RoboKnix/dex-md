import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p1/provenance-check.mjs';

const validPHC = `---
provenance: PHC
title: Test
---
Content here`;

const validOHC = `---
provenance: OHC
---
Body`;

const validAAC = `---
provenance: AAC
---
Content`;

test('T12.1: Frontmatter parsed with YAML delimiters', () => {
  const result = run({ content: validPHC, path: 'test.md' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.hasFrontmatter, true);
});

test('T12.2: PHC provenance recognized', () => {
  const result = run({ content: validPHC });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.provenance, 'PHC');
});

test('T12.3: OHC provenance recognized', () => {
  const result = run({ content: validOHC });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.provenance, 'OHC');
});

test('T12.4: AAC provenance recognized', () => {
  const result = run({ content: validAAC });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.provenance, 'AAC');
});

test('T12.5: Missing frontmatter rejected', () => {
  const now = '2024-01-15T10:30:00Z';
  const result = run({ content: 'Just content, no frontmatter', now });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /frontmatter with --- delimiters required/);
  // assert audit for rejection
  assert.ok(result.audit);
  assert.strictEqual(result.audit.event, 'provenance-check-failed');
  assert.strictEqual(result.audit.at, now);
  assert.strictEqual(result.audit.reason, 'missing-frontmatter');
});

test('T12.6: Missing provenance field rejected', () => {
  const now = '2024-01-15T10:30:00Z';
  const content = `---
title: No Provenance
---
Body`;
  const result = run({ content, now });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /provenance field required/);
  // assert audit for rejection
  assert.ok(result.audit);
  assert.strictEqual(result.audit.event, 'provenance-check-failed');
  assert.strictEqual(result.audit.reason, 'missing-provenance-field');
});

test('T12.7: Invalid provenance value rejected', () => {
  const now = '2024-01-15T10:30:00Z';
  const content = `---
provenance: INVALID
---
Body`;
  const result = run({ content, now });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be one of/);
  assert.strictEqual(result.found, 'INVALID');
  // assert audit for rejection
  assert.ok(result.audit);
  assert.strictEqual(result.audit.event, 'provenance-check-failed');
  assert.strictEqual(result.audit.reason, 'invalid-provenance-value');
  assert.strictEqual(result.audit.found, 'INVALID');
});

test('T12.8: Empty content rejected', () => {
  const result = run({ content: '' });
  assert.strictEqual(result.ok, false);
});

test('T12.9: Null content rejected', () => {
  const result = run({ content: null });
  assert.strictEqual(result.ok, false);
});

test('T12.10: Non-object input rejected', () => {
  const result = run('string');
  assert.strictEqual(result.ok, false);
});

test('T12.11: No mutation of input', () => {
  const input = { content: validPHC, path: 'test.md' };
  const originalContent = input.content;
  run(input);
  assert.strictEqual(input.content, originalContent);
});

test('T12.12: Same input produces same output', () => {
  const input = { content: validOHC };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('T12.13: Trace includes node and steps', () => {
  const result = run({ content: validAAC });
  assert.ok(result.trace);
  assert.strictEqual(result.trace.node, 'L1.E04');
  assert.ok(Array.isArray(result.trace.steps));
  assert.strictEqual(result.trace.steps.length > 0, true);
});

test('T12.14: Path included in result when provided', () => {
  const result = run({ content: validPHC, path: 'docs/file.md' });
  assert.strictEqual(result.path, 'docs/file.md');
});

test('T12.15: Path optional in input', () => {
  const result = run({ content: validPHC });
  assert.strictEqual(result.ok, true);
});
