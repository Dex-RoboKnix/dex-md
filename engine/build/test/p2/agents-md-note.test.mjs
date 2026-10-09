import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/agents-md-note.mjs';

test('T15.1 Note shown during install plan when no CLAUDE.md exists', () => {
  const result = run({
    hasClaudeMd: false,
    hasClaudeLocalMd: false,
    phase: 'plan'
  });
  assert.equal(result.ok, true);
  assert.equal(result.shouldShowNote, true);
  assert(result.noteText);
  assert(result.noteText.includes('AGENTS.md'));
});

test('T15.2 No note shown if CLAUDE.md found', () => {
  const result = run({
    hasClaudeMd: true,
    hasClaudeLocalMd: false,
    phase: 'plan'
  });
  assert.equal(result.ok, true);
  assert.equal(result.shouldShowNote, false);
  assert.equal(result.noteText, null);
});

test('No note shown if CLAUDE.local.md found', () => {
  const result = run({
    hasClaudeMd: false,
    hasClaudeLocalMd: true,
    phase: 'plan'
  });
  assert.equal(result.ok, true);
  assert.equal(result.shouldShowNote, false);
  assert.equal(result.noteText, null);
});

test('No note shown if both CLAUDE.md and CLAUDE.local.md found', () => {
  const result = run({
    hasClaudeMd: true,
    hasClaudeLocalMd: true,
    phase: 'plan'
  });
  assert.equal(result.ok, true);
  assert.equal(result.shouldShowNote, false);
});

test('T15.3 Note also shown after install completes', () => {
  const result = run({
    hasClaudeMd: false,
    hasClaudeLocalMd: false,
    phase: 'complete'
  });
  assert.equal(result.ok, true);
  assert.equal(result.shouldShowNote, true);
  assert.equal(result.showAfterComplete, true);
  assert(result.noteText);
});

test('Non-boolean hasClaudeMd rejected', () => {
  const result = run({
    hasClaudeMd: 'false',
    hasClaudeLocalMd: false,
    phase: 'plan'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Non-boolean hasClaudeLocalMd rejected', () => {
  const result = run({
    hasClaudeMd: false,
    hasClaudeLocalMd: 'true',
    phase: 'plan'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Invalid phase rejected', () => {
  const result = run({
    hasClaudeMd: false,
    hasClaudeLocalMd: false,
    phase: 'invalid'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Empty phase rejected', () => {
  const result = run({
    hasClaudeMd: false,
    hasClaudeLocalMd: false,
    phase: ''
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing phase rejected', () => {
  const result = run({
    hasClaudeMd: false,
    hasClaudeLocalMd: false
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
    hasClaudeMd: false,
    hasClaudeLocalMd: false,
    phase: 'plan'
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    hasClaudeMd: false,
    hasClaudeLocalMd: false,
    phase: 'plan'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    hasClaudeMd: false,
    hasClaudeLocalMd: false,
    phase: 'plan'
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E02');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
