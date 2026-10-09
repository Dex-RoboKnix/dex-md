import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/checkpoint-call.mjs';

test('T13.1 Detector searches for specific function name checkpoint()', () => {
  const input = {
    skillRun: 'const result = checkpoint();',
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.verified, true);
});

test('T13.2 Skill run marked incomplete if no checkpoint() call exists', () => {
  const input = {
    skillRun: 'console.log("no checkpoint here");',
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.verified, false);
  assert.equal(result.incomplete, true);
});

test('T13.3 Only final checkpoint is verified as signal of completion', () => {
  const input = {
    skillRun: `
      checkpoint(1);
      checkpoint(2);
      checkpoint('final', true);
    `,
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.verified, true);
  assert.match(result.parameters, /final/);
});

test('T13.4 Run log records checkpoint timestamp and parameters via effects', () => {
  const input = {
    skillRun: 'checkpoint("test", { status: "done" });',
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.verified, true);
  assert(result.effects);
  assert(Array.isArray(result.effects));
  assert.equal(result.effects.length, 1);

  const logEffect = result.effects[0];
  assert.equal(logEffect.kind, 'append-log');
  assert.equal(logEffect.path, '.dex/runs/checkpoint.log');
  assert.match(logEffect.content, /checkpoint/);
  assert.match(logEffect.content, /2026-10-09/);
});

test('T13 empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T13 malformed input returns error', () => {
  const result = run({ skillRun: 123 });
  assert.equal(result.ok, false);
});

test('T13 no mutation of input', () => {
  const input = {
    skillRun: 'checkpoint();',
    now: '2026-10-09T12:00:00Z'
  };
  const original = JSON.stringify(input);

  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('T13 same output twice', () => {
  const input = {
    skillRun: 'checkpoint();',
    now: '2026-10-09T12:00:00Z'
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T13 trace includes node and steps', () => {
  const input = {
    skillRun: 'checkpoint();',
    now: '2026-10-09T12:00:00Z'
  };

  const result = run(input);
  assert.equal(result.trace.node, 'L4.E08');
  assert(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
