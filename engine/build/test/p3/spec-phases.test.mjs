import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/spec-phases.mjs';

const validSpec = {
  phases: [
    { name: 'Phase 1', tasks: [{ id: 't1' }] },
    { name: 'Phase 2', tasks: [{ id: 't2' }] },
    { name: 'Phase 3', tasks: [{ id: 't3' }] },
    { name: 'Phase 4', tasks: [{ id: 't4' }] },
    { name: 'Phase 5', tasks: [{ id: 't5' }] }
  ]
};

test('T05.1: Spec with zero tasks in any phase is rejected', () => {
  const result = run({
    phases: [
      { name: 'Phase 1', tasks: [] },
      { name: 'Phase 2', tasks: [{ id: 't2' }] },
      { name: 'Phase 3', tasks: [{ id: 't3' }] },
      { name: 'Phase 4', tasks: [{ id: 't4' }] },
      { name: 'Phase 5', tasks: [{ id: 't5' }] }
    ]
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('zero tasks'));
});

test('T05.2: Blank or whitespace-only phase names are rejected', () => {
  const result = run({
    phases: [
      { name: '', tasks: [{ id: 't1' }] },
      { name: 'Phase 2', tasks: [{ id: 't2' }] },
      { name: 'Phase 3', tasks: [{ id: 't3' }] },
      { name: 'Phase 4', tasks: [{ id: 't4' }] },
      { name: 'Phase 5', tasks: [{ id: 't5' }] }
    ]
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('blank'));
});

test('T05.2: Whitespace-only names are rejected', () => {
  const result = run({
    phases: [
      { name: '   ', tasks: [{ id: 't1' }] },
      { name: 'Phase 2', tasks: [{ id: 't2' }] },
      { name: 'Phase 3', tasks: [{ id: 't3' }] },
      { name: 'Phase 4', tasks: [{ id: 't4' }] },
      { name: 'Phase 5', tasks: [{ id: 't5' }] }
    ]
  });
  assert.equal(result.ok, false);
});

test('T05.3: Validation reports the status of each phase separately', () => {
  const result = run(validSpec);
  assert.equal(result.ok, true);
  assert.equal(result.phaseStatuses.length, 5);
  result.phaseStatuses.forEach((s, i) => {
    assert.equal(s.index, i);
    assert.equal(s.valid, true);
    assert.equal(s.taskCount, 1);
  });
});

test('T05.4: Spec must have exactly 5 named phases', () => {
  const result = run({
    phases: [
      { name: 'Phase 1', tasks: [{ id: 't1' }] },
      { name: 'Phase 2', tasks: [{ id: 't2' }] },
      { name: 'Phase 3', tasks: [{ id: 't3' }] }
    ]
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('exactly 5'));
});

test('T05: valid spec with 5 phases passes', () => {
  const result = run(validSpec);
  assert.equal(result.ok, true);
  assert.equal(result.phaseCount, 5);
  assert.equal(result.totalTasks, 5);
});

test('T05: invalid input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T05: no mutation of input', () => {
  const input = JSON.parse(JSON.stringify(validSpec));
  const orig = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), orig);
});

test('T05: same input produces same output twice', () => {
  const input = JSON.parse(JSON.stringify(validSpec));
  const r1 = run(input);
  const r2 = run(input);
  assert.deepEqual(r1, r2);
});

test('T05: trace includes node id', () => {
  const result = run(validSpec);
  assert.equal(result.trace.node, 'L5.E03');
  assert(Array.isArray(result.trace.steps));
  assert.equal(result.trace.steps.length, 5);
});
