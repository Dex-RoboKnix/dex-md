import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/hooks-plan.mjs';

test('T18.1 Stop hook registered in .claude/settings.json with reference to verify script', () => {
  const input = { hooksToRegister: ['Stop', 'PreToolUse', 'SessionStart'] };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.settingsPath, '.claude/settings.json');
  assert(result.hooksConfig.hooks.Stop);
  assert.match(result.hooksConfig.hooks.Stop.script, /dex-verify/);
});

test('T18.2 Template dex-verify script generated and ready to run', () => {
  const input = { hooksToRegister: ['Stop', 'PreToolUse', 'SessionStart'] };

  const result = run(input);
  assert.equal(result.ok, true);
  assert(result.scripts['.claude/hooks/dex-verify']);
  assert.match(result.scripts['.claude/hooks/dex-verify'], /Verify/);
  assert.match(result.scripts['.claude/hooks/dex-verify'], /dex verify/);
});

test('T18.3 PreToolUse hook configured to block writes with exit code 2', () => {
  const input = { hooksToRegister: ['Stop', 'PreToolUse', 'SessionStart'] };

  const result = run(input);
  assert.equal(result.ok, true);
  assert(result.hooksConfig.hooks.PreToolUse);
  assert.equal(result.hooksConfig.hooks.PreToolUse.exitCode, 2);
});

test('T18.4 SessionStart hook prints summary of CLAUDE.md, rules, verify command, and hook names', () => {
  const input = { hooksToRegister: ['Stop', 'PreToolUse', 'SessionStart'] };

  const result = run(input);
  assert.equal(result.ok, true);
  assert(result.scripts['.claude/hooks/dex-sessionstart']);
  const script = result.scripts['.claude/hooks/dex-sessionstart'];
  assert.match(script, /CLAUDE.md/);
  assert.match(script, /rules/);
  assert.match(script, /dex verify/);
  assert.match(script, /Hooks/);
});

test('T18.5 All hook scripts located under .claude/hooks/ with dex-* naming', () => {
  const input = { hooksToRegister: ['Stop', 'PreToolUse', 'SessionStart'] };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.hooksDirectory, '.claude/hooks/');
  for (const script of result.hookScripts) {
    assert.match(script, /\.claude\/hooks\/dex-/);
  }
});

test('T18 empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T18 malformed input returns error', () => {
  const result = run({ hooksToRegister: 'not an array' });
  assert.equal(result.ok, false);
});

test('T18 missing required hook returns error', () => {
  const result = run({ hooksToRegister: ['Stop', 'PreToolUse'] });
  assert.equal(result.ok, false);
  assert.match(result.error, /SessionStart/);
});

test('T18 no mutation of input', () => {
  const input = { hooksToRegister: ['Stop', 'PreToolUse', 'SessionStart'] };
  const original = JSON.stringify(input);

  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('T18 same output twice', () => {
  const input = { hooksToRegister: ['Stop', 'PreToolUse', 'SessionStart'] };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T18 trace includes node and steps', () => {
  const input = { hooksToRegister: ['Stop', 'PreToolUse', 'SessionStart'] };

  const result = run(input);
  assert.equal(result.trace.node, 'L5.E02');
  assert(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
