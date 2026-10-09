import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/claude-md-merge-plan.mjs';

test('T12.1 Existing CLAUDE.md plan shows marked block plus diff', () => {
  const existingContent = '# My Project\n\nSome content here.';
  const dexContent = '# DexSpine Configuration\n\nVerify: node --test';

  const result = run({
    hasExistingClaudemd: true,
    nodeDir: '/project',
    dexContent,
    existingClaudemdContent: existingContent
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'update-existing');
  assert(result.markedDexBlock.includes('dex-start'));
  assert(result.markedDexBlock.includes('dex-end'));
  assert(result.markedDexBlock.includes(dexContent));
  assert(result.diff);
  assert(result.diff.before === existingContent);
  assert(result.diff.after.includes(existingContent));
  assert(result.diff.after.includes(dexContent));
});

test('T12.2 User text outside marked block never altered', () => {
  const existingContent = '# User Section\n\nUser content stays.\n\n# Another Section\n\nMore user text.';
  const dexContent = 'dex-managed block';

  const result = run({
    hasExistingClaudemd: true,
    nodeDir: '/project',
    dexContent,
    existingClaudemdContent: existingContent
  });

  assert.equal(result.ok, true);
  assert(result.diff.after.includes('User Section'));
  assert(result.diff.after.includes('User content stays.'));
  assert(result.diff.after.includes('Another Section'));
  assert(result.diff.after.includes('More user text.'));
});

test('T12.3 New CLAUDE.md placed when none exists', () => {
  const dexContent = '# DexSpine Configuration\n\nVerify: npm test';

  const result = run({
    hasExistingClaudemd: false,
    nodeDir: '/project',
    dexContent
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'create-new');
  assert(result.newContent === dexContent);
  assert(result.targetPath.endsWith('/CLAUDE.md'));
});

test('T12.4 Changes left unstaged (no automatic git operations)', () => {
  const result = run({
    hasExistingClaudemd: false,
    nodeDir: '/project',
    dexContent: 'new content'
  });

  assert.equal(result.ok, true);
  // note: no git.add() or git.commit() in the module; caller handles staging
  assert(!result.gitOperations);
});

test('Non-boolean hasExistingClaudemd rejected', () => {
  const result = run({
    hasExistingClaudemd: 'true',
    nodeDir: '/project',
    dexContent: 'content'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Empty nodeDir rejected', () => {
  const result = run({
    hasExistingClaudemd: false,
    nodeDir: '',
    dexContent: 'content'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Empty dexContent rejected', () => {
  const result = run({
    hasExistingClaudemd: false,
    nodeDir: '/project',
    dexContent: ''
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing existingClaudemdContent when hasExistingClaudemd is true', () => {
  const result = run({
    hasExistingClaudemd: true,
    nodeDir: '/project',
    dexContent: 'content'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('existingClaudemdContent'));
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert(result.error);
});

test('No mutation of input', () => {
  const input = {
    hasExistingClaudemd: false,
    nodeDir: '/project',
    dexContent: 'content'
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    hasExistingClaudemd: false,
    nodeDir: '/project',
    dexContent: 'new content'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    hasExistingClaudemd: false,
    nodeDir: '/project',
    dexContent: 'content'
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E01');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
