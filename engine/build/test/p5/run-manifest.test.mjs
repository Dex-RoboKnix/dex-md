import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p5/run-manifest.mjs';

test('T13.1: Manifest includes all required fields', () => {
  const input = {
    run_date: '2026-10-09',
    start_time: '10:00:00',
    end_time: '11:00:00',
    models_used: ['claude-opus', 'claude-sonnet'],
    agent_count: 3,
    task_count: 20,
    phase_number: 5,
    git_commit_at_start: 'abc123def456'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.manifest.run_date, '2026-10-09');
  assert.equal(result.manifest.agent_count, 3);
  assert.equal(result.manifest.task_count, 20);
  assert.equal(result.manifest.phase_number, 5);
  assert.equal(result.manifest.git_commit_at_start, 'abc123def456');
});

test('T13.2: Model events logged in events list', () => {
  const input = {
    run_date: '2026-10-09',
    start_time: '10:00:00',
    end_time: '11:00:00',
    models_used: ['claude-opus'],
    agent_count: 1,
    task_count: 5,
    phase_number: 5,
    git_commit_at_start: 'abc123',
    events: [
      { timestamp: '10:15:00', model_change: 'claude-sonnet' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.manifest.events, input.events);
});

test('T13.3: Manifest stored as JSON with write-file effect', () => {
  const input = {
    run_date: '2026-10-09',
    start_time: '10:00:00',
    end_time: '11:00:00',
    models_used: ['claude-haiku'],
    agent_count: 1,
    task_count: 10,
    phase_number: 5,
    git_commit_at_start: 'abc123'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.effects.length, 1);
  assert.equal(result.effects[0].kind, 'write-file');
  assert.equal(result.effects[0].path, 'out/p5.manifest.json');
  assert.ok(result.effects[0].content.includes('"run_date"'));
});

test('T13.4: Manifest enables comparison across runs', () => {
  const input1 = {
    run_date: '2026-10-09',
    start_time: '10:00:00',
    end_time: '11:00:00',
    models_used: ['claude-opus'],
    agent_count: 2,
    task_count: 20,
    phase_number: 5,
    git_commit_at_start: 'abc123'
  };
  const input2 = { ...input1 };
  const result1 = run(input1);
  const result2 = run(input2);
  assert.deepEqual(result1.manifest, result2.manifest);
});

test('T13.5: Trace includes steps for manifest creation', () => {
  const input = {
    run_date: '2026-10-09',
    start_time: '10:00:00',
    end_time: '11:00:00',
    models_used: ['claude-haiku'],
    agent_count: 1,
    task_count: 5,
    phase_number: 5,
    git_commit_at_start: 'abc123'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L4.E06');
  assert.ok(result.trace.steps.length > 0);
});

test('T13: Empty input returns error', () => {
  const result = run({});
  assert.equal(result.ok, false);
  assert.match(result.error, /required/);
});

test('T13: Missing run_date returns error', () => {
  const result = run({
    start_time: '10:00:00',
    end_time: '11:00:00',
    models_used: ['claude'],
    agent_count: 1,
    task_count: 5,
    phase_number: 5,
    git_commit_at_start: 'abc'
  });
  assert.equal(result.ok, false);
});

test('T13: Empty models_used returns error', () => {
  const result = run({
    run_date: '2026-10-09',
    start_time: '10:00:00',
    end_time: '11:00:00',
    models_used: [],
    agent_count: 1,
    task_count: 5,
    phase_number: 5,
    git_commit_at_start: 'abc'
  });
  assert.equal(result.ok, false);
});

test('T13: No mutation of input', () => {
  const input = {
    run_date: '2026-10-09',
    start_time: '10:00:00',
    end_time: '11:00:00',
    models_used: ['claude'],
    agent_count: 1,
    task_count: 5,
    phase_number: 5,
    git_commit_at_start: 'abc'
  };
  const copy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, copy);
});

test('T13: Same input produces same output twice', () => {
  const input = {
    run_date: '2026-10-09',
    start_time: '10:00:00',
    end_time: '11:00:00',
    models_used: ['claude'],
    agent_count: 1,
    task_count: 5,
    phase_number: 5,
    git_commit_at_start: 'abc'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});
