import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p5/phase-gate.mjs';

test('T14.1: Phase gate checks all tasks have terminal status', () => {
  const input = {
    tasks: [
      { id: 'T1', status: 'pass' },
      { id: 'T2', status: 'fail' },
      { id: 'T3', status: 'abandoned' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.phasePasses, true);
});

test('T14.2: Escalated-and-resolved requires Layer 8 approval', () => {
  const input = {
    tasks: [
      { id: 'T1', status: 'pass' },
      { id: 'T2', status: 'escalated-and-resolved' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, false);
  assert.match(result.error, /Layer 8/);
});

test('T14.2b: Escalated-and-resolved passes with Layer 8 approval', () => {
  const input = {
    tasks: [
      { id: 'T1', status: 'pass' },
      { id: 'T2', status: 'escalated-and-resolved' }
    ],
    escalated_approval: true,
    layer8_name: 'Alice',
    layer8_date: '2026-10-09'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.phasePasses, true);
});

test('T14.3: Never-run tasks block unless explicitly waived', () => {
  const input = {
    tasks: [
      { id: 'T1', status: 'pass' },
      { id: 'T2', status: 'never-run' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, false);
  assert.match(result.error, /never-run tasks block/);
});

test('T14.3b: Never-run tasks pass when waived by Layer 8', () => {
  const input = {
    tasks: [
      { id: 'T1', status: 'pass' },
      { id: 'T2', status: 'never-run' }
    ],
    layer8_waivers: ['T2'],
    layer8_name: 'Bob',
    layer8_date: '2026-10-09'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.phasePasses, true);
});

test('T14.4: Phase sign-off records human name, date, and sign-off reference', () => {
  const input = {
    tasks: [
      { id: 'T1', status: 'pass' }
    ],
    layer8_name: 'Charlie',
    layer8_date: '2026-10-09'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.layer8Name, 'Charlie');
  assert.equal(result.layer8Date, '2026-10-09');
});

test('T14.5: Phase gate prevents progression with unmet requirements', () => {
  const input = {
    tasks: [
      { id: 'T1', status: 'escalated-and-resolved' },
      { id: 'T2', status: 'never-run' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, false);
});

test('T14: Empty input returns error', () => {
  const result = run({});
  assert.equal(result.ok, false);
});

test('T14: Null tasks returns error', () => {
  const result = run({ tasks: null });
  assert.equal(result.ok, false);
});

test('T14: Invalid task status returns error', () => {
  const result = run({
    tasks: [{ id: 'T1', status: 'invalid' }]
  });
  assert.equal(result.ok, false);
});

test('T14: No mutation of input', () => {
  const input = {
    tasks: [{ id: 'T1', status: 'pass' }],
    layer8_waivers: []
  };
  const copy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, copy);
});

test('T14: Same input produces same output twice', () => {
  const input = {
    tasks: [
      { id: 'T1', status: 'pass' },
      { id: 'T2', status: 'fail' }
    ]
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T14: Trace captures all task statuses', () => {
  const input = {
    tasks: [
      { id: 'A', status: 'pass' },
      { id: 'B', status: 'fail' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L1.E05');
  assert.equal(result.trace.steps.length, 2);
});
