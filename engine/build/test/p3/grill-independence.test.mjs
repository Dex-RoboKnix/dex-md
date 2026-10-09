import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/grill-independence.mjs';

test('T02.1: Question text containing "based on Q1" is flagged as dependent', () => {
  const result = run({
    questions: [
      { text: 'First question?' },
      { text: 'Based on Q1, what do you think?' }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.dependencies.length, 1);
  assert.equal(result.dependencies[0].questionIndex, 1);
  assert.equal(result.dependencies[0].dependsOn, 0);
});

test('T02.1: Question text containing "depending on your answer" is flagged', () => {
  const result = run({
    questions: [
      { text: 'First question?' },
      { text: 'Depending on your answer, next question?' }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.dependencies.length, 1);
  assert.equal(result.dependencies[0].questionIndex, 1);
});

test('T02.2: Implicit phrase "similar to the previous answer" is detected', () => {
  const result = run({
    questions: [
      { text: 'First question?' },
      { text: 'Similar to the previous answer, but...' }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.dependencies.length, 1);
  assert.equal(result.dependencies[0].questionIndex, 1);
  assert.equal(result.dependencies[0].dependsOn, 0);
});

test('T02.3: Detection records which question B depends on', () => {
  const result = run({
    questions: [
      { text: 'Q1?' },
      { text: 'Q2?' },
      { text: 'Based on Q1, Q3?' }
    ]
  });
  assert.equal(result.ok, true);
  const dep = result.dependencies[0];
  assert.equal(dep.questionIndex, 2);
  assert.equal(dep.dependsOn, 0);
  assert.equal(dep.referenced, 0);
});

test('T02.4: No false positives on independent questions', () => {
  const result = run({
    questions: [
      { text: 'First question about preferences?' },
      { text: 'Second question about something different?' },
      { text: 'Third question unrelated?' }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.dependencies.length, 0);
  assert.equal(result.independentCount, 3);
});

test('T02: empty questions array', () => {
  const result = run({ questions: [] });
  assert.equal(result.ok, true);
  assert.equal(result.dependencies.length, 0);
});

test('T02: invalid input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T02: no mutation of input', () => {
  const input = { questions: [{ text: 'Q1?' }, { text: 'Based on Q1?' }] };
  const orig = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), orig);
});

test('T02: same input produces same output twice', () => {
  const input = { questions: [{ text: 'Q1?' }, { text: 'Based on Q1?' }] };
  const r1 = run(input);
  const r2 = run(input);
  assert.deepEqual(r1, r2);
});

test('T02: trace includes node id', () => {
  const result = run({ questions: [{ text: 'Q?' }] });
  assert.equal(result.trace.node, 'L5.E03');
  assert(Array.isArray(result.trace.steps));
});
