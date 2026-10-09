import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/retry-delta.mjs';

test('T13.1 Spec-delta format shows before/after with additions, deletions and changes', () => {
  const input = {
    taskId: 'task-001',
    failureClassification: 'spec-gap',
    delta: {
      before: 'old spec text',
      after: 'new spec text with fixes',
      additions: ['requirement A', 'requirement B'],
      deletions: ['old requirement C'],
      changes: ['modified rule 1'],
    },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.accepted, true);
});

test('T13.2 Delta must reference the failure classification that prompted retry', () => {
  const input = {
    taskId: 'task-002',
    failureClassification: 'impl-bug',
    delta: {
      before: 'implementation v1',
      after: 'implementation v2 with bug fix',
      changes: ['fixed null pointer check'],
    },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.result.failureClassification, 'impl-bug');
});

test('T13.3 Delta is rejected if empty, missing or purely cosmetic', () => {
  const result = run({
    taskId: 'task-003',
    failureClassification: 'spec-gap',
    delta: {
      before: null,
      after: null,
      additions: [],
      deletions: [],
      changes: [],
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /empty/);
});

test('T13.3b Delta is rejected if purely cosmetic', () => {
  const result = run({
    taskId: 'task-003b',
    failureClassification: 'spec-gap',
    delta: {
      before: 'spec text',
      after: 'spec text',
      additions: [],
      deletions: [],
      changes: [],
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /cosmetic/);
});

test('T13.4 Root-cause addressing is sufficient even if cascade effects are not all addressed', () => {
  const input = {
    taskId: 'task-004',
    failureClassification: 'test-gap',
    delta: {
      additions: ['new test case for missing scenario'],
      deletions: [],
      changes: ['adjusted test assertion'],
    },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.result.deltaFormat.additions, 1);
});

test('T13.5 Material change is verified before retry is accepted', () => {
  const input = {
    taskId: 'task-005',
    failureClassification: 'environment',
    delta: {
      before: 'environment config v1',
      after: 'environment config v2',
      changes: ['updated timeout value'],
    },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.accepted, true);
});

test('T13 empty input rejection', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert.match(result.error, /not an object/);
});

test('T13 missing taskId rejection', () => {
  const result = run({
    failureClassification: 'spec-gap',
    delta: { additions: ['test'] },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /taskId/);
});

test('T13 missing delta rejection', () => {
  const result = run({ taskId: 'task-006', failureClassification: 'spec-gap' });
  assert.equal(result.ok, false);
  assert.match(result.error, /delta/);
});

test('T13 missing failureClassification rejection', () => {
  const result = run({
    taskId: 'task-007',
    delta: { additions: ['test'] },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /failureClassification/);
});

test('T13 invalid failureClassification rejection', () => {
  const result = run({
    taskId: 'task-008',
    failureClassification: 'invalid-class',
    delta: { additions: ['test'] },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /invalid failureClassification/);
});

test('T13 no mutation of input', () => {
  const input = {
    taskId: 'task-009',
    failureClassification: 'spec-gap',
    delta: { additions: ['test'], deletions: [], changes: [] },
    now: '2026-10-09T14:30:00.123Z',
  };
  const inputCopy = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), inputCopy);
});

test('T13 same output twice', () => {
  const input = {
    taskId: 'task-010',
    failureClassification: 'impl-bug',
    delta: { additions: ['fix'], deletions: [], changes: [] },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.equal(result1.accepted, result2.accepted);
});

test('T13 trace includes steps', () => {
  const input = {
    taskId: 'task-011',
    failureClassification: 'spec-gap',
    delta: { additions: ['new req'], deletions: [], changes: [] },
    now: '2026-10-09T14:30:00.123Z',
  };
  const result = run(input);
  assert.ok(Array.isArray(result.steps));
  assert(result.steps.length > 0);
});
