import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/gitignore-lines.mjs';

test('T06.1 Both files checked if already tracked', () => {
  const result = run({
    gitignoreContent: '',
    isTracked: { claudeLocal: false, settingsLocal: false }
  });
  assert.equal(result.ok, true);
  assert(Array.isArray(result.trackedFiles));
});

test('T06.2 .gitignore created with dex lines if it does not exist', () => {
  const result = run({
    isTracked: {}
  });
  assert.equal(result.ok, true);
  assert.equal(result.gitignorePlan.action, 'create');
  assert(result.gitignorePlan.content.includes('CLAUDE.local.md'));
  assert(result.gitignorePlan.content.includes('.claude/settings.local.json'));
});

test('T06.3 Warning logged with git rm --cached when files already tracked', () => {
  const now = '2026-10-09T10:00:00Z';
  const result = run({
    gitignoreContent: 'node_modules/\n',
    isTracked: { claudeLocal: true, settingsLocal: true },
    now
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.trackedFiles, ['CLAUDE.local.md', '.claude/settings.local.json']);
  assert(result.effects);
  const warningEffect = result.effects.find(e => e.event === 'gitignore-files-already-tracked');
  assert(warningEffect);
  assert(warningEffect.gitRmCommand.includes('git rm --cached'));
  assert(warningEffect.at, now);
});

test('T06.4 User informed of extra step required for tracked files', () => {
  const result = run({
    gitignoreContent: 'node_modules/\n',
    isTracked: { claudeLocal: true }
  });
  assert.equal(result.ok, true);
  assert(result.effects);
  const effect = result.effects.find(e => e.event === 'gitignore-files-already-tracked');
  assert(effect);
  assert(effect.message);
  assert(effect.message.includes('git rm --cached'));
});

test('T06.2b .gitignore appends only missing lines if exists with some present', () => {
  const result = run({
    gitignoreContent: 'node_modules/\nCLAUDE.local.md\n',
    isTracked: {}
  });
  assert.equal(result.ok, true);
  assert.equal(result.gitignorePlan.action, 'append');
  assert(result.gitignorePlan.content.includes('.claude/settings.local.json'));
  assert(!result.gitignorePlan.content.includes('CLAUDE.local.md'));
});

test('T06.2c .gitignore skipped if all lines already present', () => {
  const result = run({
    gitignoreContent: 'node_modules/\nCLAUDE.local.md\n.claude/settings.local.json\n',
    isTracked: {}
  });
  assert.equal(result.ok, true);
  assert.equal(result.gitignorePlan.action, 'skip');
});

test('Only CLAUDE.local.md tracked produces warning', () => {
  const result = run({
    gitignoreContent: '',
    isTracked: { claudeLocal: true, settingsLocal: false }
  });
  assert.equal(result.trackedFiles.length, 1);
  assert(result.trackedFiles.includes('CLAUDE.local.md'));
});

test('Only .claude/settings.local.json tracked produces warning', () => {
  const result = run({
    gitignoreContent: '',
    isTracked: { claudeLocal: false, settingsLocal: true }
  });
  assert.equal(result.trackedFiles.length, 1);
  assert(result.trackedFiles.includes('.claude/settings.local.json'));
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('No mutation of input', () => {
  const input = {
    gitignoreContent: 'node_modules/\n',
    isTracked: { claudeLocal: true }
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    gitignoreContent: 'node_modules/\n',
    isTracked: {}
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    gitignoreContent: ''
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L3.E05');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});

test('Effects contains log entries with timestamp', () => {
  const now = '2026-10-09T12:34:56Z';
  const result = run({
    gitignoreContent: '',
    now
  });
  assert(result.effects);
  const logEffect = result.effects.find(e => e.kind === 'log');
  assert(logEffect);
  assert.equal(logEffect.at, now);
});
