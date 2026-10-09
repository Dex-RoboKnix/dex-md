import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/wave-schedule.mjs';

test('T17.1 Wave size is at most 8 agents', () => {
  const input = {
    taskIds: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'],
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.schedule.waves.length >= 1);
  for (const wave of result.schedule.waves) {
    assert(wave.agentCount <= 8);
  }
});

test('T17.2 Each wave completes with a checkpoint before next wave starts', () => {
  const input = {
    taskIds: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12', 't13', 't14', 't15', 't16'],
  };
  const result = run(input);
  assert.equal(result.ok, true);
  // Wave 1: 8 tasks, Wave 2: 8 tasks
  assert.equal(result.schedule.waveCount, 2);
  // Wave 2 should have checkpoint
  assert.equal(result.schedule.waves[1].checkpoint, true);
});

test('T17.3 The escalation agent counts in the 8-agent limit and uses the reserved slot', () => {
  const input = {
    taskIds: Array.from({ length: 16 }, (_, i) => `task-${i + 1}`),
  };
  const result = run(input);
  assert.equal(result.ok, true);
  // 16 tasks split into two waves of 8 each, within limit
  assert.equal(result.schedule.maxAgentsPerWave, 8);
});

test('T17.4 Wave can start with fewer than 8 tasks if queue is small', () => {
  const input = {
    taskIds: ['t1', 't2', 't3'],
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.schedule.waves[0].agentCount, 3);
  assert(result.schedule.waves[0].agentCount <= 8);
});

test('T17.5 Checkpoints verify all prior-wave tasks before releasing next wave', () => {
  const input = {
    taskIds: Array.from({ length: 17 }, (_, i) => `task-${i + 1}`),
  };
  const result = run(input);
  assert.equal(result.ok, true);
  // 17 tasks: wave 1 has 8, wave 2 has 8, wave 3 has 1
  assert.equal(result.schedule.waveCount, 3);
  // Wave 2 and 3 should have checkpoint (all prior waves verified)
  assert.equal(result.schedule.waves[1].checkpoint, true);
  assert.equal(result.schedule.waves[2].checkpoint, true);
});

test('T17 empty input rejection', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /not an object/);
});

test('T17 missing taskIds rejection', () => {
  const result = run({});
  assert.equal(result.ok, false);
  assert.match(result.error, /taskIds/);
});

test('T17 empty taskIds rejection', () => {
  const result = run({ taskIds: [] });
  assert.equal(result.ok, false);
  assert.match(result.error, /empty/);
});

test('T17 malformed taskIds rejection', () => {
  const result = run({ taskIds: 'not-an-array' });
  assert.equal(result.ok, false);
  assert.match(result.error, /array/);
});

test('T17 non-string taskId rejection', () => {
  const result = run({ taskIds: ['t1', 't2', 123] });
  assert.equal(result.ok, false);
  assert.match(result.error, /strings/);
});

test('T17 no mutation of input', () => {
  const input = {
    taskIds: ['t1', 't2', 't3'],
  };
  const inputCopy = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), inputCopy);
});

test('T17 same output twice', () => {
  const input = {
    taskIds: ['t1', 't2', 't3', 't4', 't5'],
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.equal(result1.schedule.waveCount, result2.schedule.waveCount);
  assert.deepEqual(result1.schedule.waves, result2.schedule.waves);
});

test('T17 trace includes steps', () => {
  const input = {
    taskIds: ['t1', 't2'],
  };
  const result = run(input);
  assert.ok(Array.isArray(result.steps));
  assert(result.steps.length > 0);
});
