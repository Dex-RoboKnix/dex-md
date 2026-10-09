import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/subagent-plan.mjs';

test('T17.1 Subagent file is created at .claude/agents/dex-reviewer.md', () => {
  const input = { pattern: 's10-adversarial-review' };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.file, '.claude/agents/dex-reviewer.md');
  assert(result.content);
});

test('T17.2 Subagent frontmatter includes disabledTools listing all write-capable tools', () => {
  const input = { pattern: 's10-adversarial-review' };

  const result = run(input);
  assert.equal(result.ok, true);
  assert(result.content.includes('disabledTools:'));

  // Check that all write tools are disabled
  assert(result.content.includes('Edit'));
  assert(result.content.includes('Write'));
  assert(result.content.includes('Bash'));
  assert(result.content.includes('PowerShell'));
});

test('T17.3 Subagent configured with background: false for inline review findings', () => {
  const input = { pattern: 's10-adversarial-review' };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.backgroundMode, false);
  assert(result.content.includes('background: false'));
});

test('T17.4 Fresh-context prompt steers read-only code review using Read and Grep tools', () => {
  const input = { pattern: 's10-adversarial-review' };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.readOnlyTools, ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch']);
  assert(result.content.includes('Read'));
  assert(result.content.includes('Grep'));
  assert(result.content.includes('read-only'));
  assert(result.content.includes('adversarial'));
});

test('T17.5 Subagent ready to perform adversarial review per S10 pattern', () => {
  const input = { pattern: 's10-adversarial-review' };

  const result = run(input);
  assert.equal(result.ok, true);
  assert(result.content.includes('S10'));
  assert(result.content.includes('adversarial'));
  assert(result.content.includes('Correctness'));
  assert(result.content.includes('bug'));
});

test('T17 empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T17 malformed input returns error', () => {
  const result = run({ pattern: 123 });
  assert.equal(result.ok, false);
});

test('T17 unsupported pattern returns error', () => {
  const result = run({ pattern: 'unknown-pattern' });
  assert.equal(result.ok, false);
});

test('T17 no mutation of input', () => {
  const input = { pattern: 's10-adversarial-review' };
  const original = JSON.stringify(input);

  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('T17 same output twice', () => {
  const input = { pattern: 's10-adversarial-review' };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T17 trace includes node and steps', () => {
  const input = { pattern: 's10-adversarial-review' };

  const result = run(input);
  assert.equal(result.trace.node, 'L2.E02');
  assert(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
