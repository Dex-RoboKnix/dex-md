import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p5/repro-hash.mjs';

test('T19.1: Repro hash computed deterministically from manifest', () => {
  const input = {
    phase: 5,
    models_used: ['claude-opus'],
    agent_count: 3,
    task_count: 20,
    git_commit_at_start: 'abc123def456'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.reproHash);
  assert.equal(typeof result.reproHash, 'string');
  assert.equal(result.reproHash.length, 16); // SHA256 truncated to 16 chars
});

test('T19.2: Identical run conditions produce identical hash', () => {
  const input = {
    phase: 5,
    models_used: ['claude-opus', 'claude-sonnet'],
    agent_count: 2,
    task_count: 15,
    git_commit_at_start: 'abc123'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.equal(result1.reproHash, result2.reproHash);
});

test('T19.3: Different conditions produce different hash', () => {
  const input1 = {
    phase: 5,
    models_used: ['claude-opus'],
    agent_count: 2,
    task_count: 15,
    git_commit_at_start: 'abc123'
  };
  const input2 = {
    phase: 5,
    models_used: ['claude-sonnet'], // different model
    agent_count: 2,
    task_count: 15,
    git_commit_at_start: 'abc123'
  };
  const result1 = run(input1);
  const result2 = run(input2);
  assert.notEqual(result1.reproHash, result2.reproHash);
});

test('T19.4: Hash stored in trace for comparison', () => {
  const input = {
    phase: 5,
    models_used: ['claude-haiku'],
    agent_count: 1,
    task_count: 10,
    git_commit_at_start: 'xyz789'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.reproHash);
  assert.equal(result.trace.node, 'L5.E05');
});

test('T19.5: Hash enables reproducibility tracking', () => {
  const inputs = [
    {
      phase: 5,
      models_used: ['claude-opus'],
      agent_count: 3,
      task_count: 20,
      git_commit_at_start: 'commit1'
    },
    {
      phase: 5,
      models_used: ['claude-opus'],
      agent_count: 3,
      task_count: 20,
      git_commit_at_start: 'commit1'
    }
  ];
  const results = inputs.map(inp => run(inp));
  assert.equal(results[0].reproHash, results[1].reproHash);
});

test('T19: Empty input returns error', () => {
  const result = run({});
  assert.equal(result.ok, false);
  assert.match(result.error, /required/);
});

test('T19: Missing phase returns error', () => {
  const result = run({
    models_used: ['claude'],
    agent_count: 1,
    task_count: 5,
    git_commit_at_start: 'abc'
  });
  assert.equal(result.ok, false);
});

test('T19: Zero or negative phase returns error', () => {
  const result1 = run({
    phase: 0,
    models_used: ['claude'],
    agent_count: 1,
    task_count: 5,
    git_commit_at_start: 'abc'
  });
  assert.equal(result1.ok, false);
});

test('T19: Empty models_used returns error', () => {
  const result = run({
    phase: 5,
    models_used: [],
    agent_count: 1,
    task_count: 5,
    git_commit_at_start: 'abc'
  });
  assert.equal(result.ok, false);
});

test('T19: No mutation of input', () => {
  const input = {
    phase: 5,
    models_used: ['claude'],
    agent_count: 1,
    task_count: 5,
    git_commit_at_start: 'abc'
  };
  const copy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, copy);
});

test('T19: Same input produces same output twice', () => {
  const input = {
    phase: 5,
    models_used: ['claude-opus', 'claude-sonnet'],
    agent_count: 2,
    task_count: 15,
    git_commit_at_start: 'abc123'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T19: Trace includes hash computation steps', () => {
  const input = {
    phase: 5,
    models_used: ['claude'],
    agent_count: 1,
    task_count: 5,
    git_commit_at_start: 'abc'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L5.E05');
  assert.ok(result.trace.steps.some(s => s.action === 'compute-hash'));
});
