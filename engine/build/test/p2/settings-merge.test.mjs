import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/settings-merge.mjs';

test('T19.1 Merge operation shows complete diff before write', () => {
  const existing = { editor: 'vim' };
  const dexEntries = { theme: 'dark' };

  const result = run({ existing, dexEntries });

  assert.equal(result.ok, true);
  assert(result.diff);
  assert.deepEqual(result.diff.before, existing);
  assert(result.diff.after);
  assert(result.diff.after.theme === 'dark');
});

test('T19.2 Conflicting keys logged with warning, not silently overwritten', () => {
  const existing = { permissions: { fetch: false } };
  const dexEntries = { permissions: { fetch: true } };

  const result = run({ existing, dexEntries });

  assert.equal(result.ok, true);
  assert(result.conflicts.length > 0);
  assert(result.conflictingKeys.includes('permissions.fetch'));
  assert(result.conflictWarnings.length > 0);
  assert(result.conflictWarnings[0].includes('WARNING'));
});

test('T19.3 Schema reference added and logged', () => {
  const existing = {};
  const dexEntries = { permissions: { edit: true } };

  const result = run({ existing, dexEntries });

  assert.equal(result.ok, true);
  assert(result.merged.$schema);
  assert.equal(result.schemaAdded, true);
  assert(result.trace.steps.some(s => s.includes('$schema')));
});

test('T19.4 User approval required before write', () => {
  const result = run({ existing: {}, dexEntries: { test: true } });

  assert.equal(result.ok, true);
  assert.equal(result.requiresUserApproval, true);
  // note: no actual file operations; effects empty
  assert(Array.isArray(result.effects));
  assert.equal(result.effects.length, 0);
});

test('T19.5 Verify allow rule added when dex writes', () => {
  const existing = {};
  const dexEntries = { permissions: { fetch: true } };

  const result = run({ existing, dexEntries });

  assert.equal(result.ok, true);
  assert(result.merged.verify);
  assert.equal(result.merged.verify.allow, true);
  assert.equal(result.verifyRuleAdded, true);
});

test('Non-conflicting entries merged smoothly', () => {
  const existing = { editor: 'vim', theme: 'light' };
  const dexEntries = { fontSize: 14, font: 'mono' };

  const result = run({ existing, dexEntries });

  assert.equal(result.ok, true);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.merged.editor, 'vim');
  assert.equal(result.merged.theme, 'light');
  assert.equal(result.merged.fontSize, 14);
  assert.equal(result.merged.font, 'mono');
});

test('Nested merge preserves existing structure', () => {
  const existing = { permissions: { read: true, write: false } };
  const dexEntries = { permissions: { write: true } };

  const result = run({ existing, dexEntries });

  assert.equal(result.ok, true);
  assert.equal(result.merged.permissions.read, true);
  assert.equal(result.merged.permissions.write, true);
});

test('Existing schema preserved if already present', () => {
  const existing = { $schema: 'https://existing-schema.json' };
  const dexEntries = { test: true };

  const result = run({ existing, dexEntries });

  assert.equal(result.ok, true);
  assert.equal(result.merged.$schema, 'https://existing-schema.json');
  assert.equal(result.schemaAdded, false);
});

test('Existing verify rule preserved if already present', () => {
  const existing = { verify: { allow: false } };
  const dexEntries = { theme: 'dark' };

  const result = run({ existing, dexEntries });

  assert.equal(result.ok, true);
  assert.equal(result.merged.verify.allow, false);
  assert.equal(result.verifyRuleAdded, false);
});

test('Multiple conflicts all tracked', () => {
  const existing = { a: 1, b: 2, c: 3 };
  const dexEntries = { a: 10, b: 20, c: 30 };

  const result = run({ existing, dexEntries });

  assert.equal(result.ok, true);
  assert.equal(result.conflicts.length, 3);
  assert.equal(result.conflictWarnings.length, 3);
});

test('Non-object existing rejected', () => {
  const result = run({
    existing: 'not-an-object',
    dexEntries: {}
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Non-object dexEntries rejected', () => {
  const result = run({
    existing: {},
    dexEntries: 'not-an-object'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert(result.error);
});

test('No mutation of input', () => {
  const input = {
    existing: { a: 1 },
    dexEntries: { b: 2 }
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    existing: { x: 1 },
    dexEntries: { y: 2 }
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    existing: {},
    dexEntries: { test: true }
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L5.E04');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
