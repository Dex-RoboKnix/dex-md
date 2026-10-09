import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/skill-path.mjs';

test('T13.1 Valid skill paths must match .claude/skills/dex-<name>/SKILL.md', () => {
  const result = run({ skillName: 'dex-verify-command' });
  assert.equal(result.ok, true);
  assert(result.skillPath.includes('.claude/skills/dex-verify-command/SKILL.md'));
  assert.equal(result.skillPath, '.claude/skills/dex-verify-command/SKILL.md');
});

test('T13.2 Skills without dex- prefix rejected with migration note', () => {
  const result = run({ skillName: 'verify-command' });
  assert.equal(result.ok, false);
  assert(result.error.includes('dex- prefix'));
  assert(result.migrationNote);
  assert(result.migrationNote.includes('dex-'));
});

test('T13.3 Only lowercase letters and hyphens allowed', () => {
  const result = run({ skillName: 'dex-valid-name' });
  assert.equal(result.ok, true);
});

test('Uppercase letters rejected', () => {
  const result = run({ skillName: 'dex-VerifyCommand' });
  assert.equal(result.ok, false);
  assert(result.error.includes('invalid characters'));
});

test('Numbers rejected', () => {
  const result = run({ skillName: 'dex-verify-123' });
  assert.equal(result.ok, false);
  assert(result.error.includes('invalid characters'));
});

test('Underscores rejected', () => {
  const result = run({ skillName: 'dex-verify_command' });
  assert.equal(result.ok, false);
  assert(result.error.includes('invalid characters'));
});

test('Consecutive hyphens rejected', () => {
  const result = run({ skillName: 'dex-verify--command' });
  assert.equal(result.ok, false);
  assert(result.error.includes('invalid characters'));
});

test('Hyphen at end rejected', () => {
  const result = run({ skillName: 'dex-verify-' });
  assert.equal(result.ok, false);
  assert(result.error.includes('invalid characters'));
});

test('Just dex- prefix rejected', () => {
  const result = run({ skillName: 'dex-' });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Empty skillName rejected', () => {
  const result = run({ skillName: '' });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing skillName rejected', () => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert(result.error);
});

test('No mutation of input', () => {
  const input = { skillName: 'dex-my-skill' };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = { skillName: 'dex-test-skill' };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({ skillName: 'dex-valid-skill' });
  assert(result.trace);
  assert.equal(result.trace.node, 'L5.E02');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
