import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/review-roster.mjs';

test('T11.1 Roster includes both tester and devops roles', () => {
  const input = {
    team: [
      { name: 'Alice', role: 'tester', reason: 'QA expert' },
      { name: 'Bob', role: 'devops', reason: 'Infrastructure' }
    ],
    definitions: { roles: ['tester', 'devops'] }
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.validated, true);
  assert(result.roster.some(p => p.role === 'tester'));
  assert(result.roster.some(p => p.role === 'devops'));
});

test('T11.2 Role names validated against controlled vocabulary', () => {
  const input = {
    team: [
      { name: 'Alice', role: 'tester' },
      { name: 'Bob', role: 'devops' },
      { name: 'Charlie', role: 'invalid_role' }
    ]
  };

  const result = run(input);
  assert.equal(result.ok, false);
  assert.match(result.error, /not in defined set/);
});

test('T11.3 Each person appears only once, assigned to one role per team', () => {
  const input = {
    team: [
      { name: 'Alice', role: 'tester' },
      { name: 'Alice', role: 'devops' }
    ]
  };

  const result = run(input);
  assert.equal(result.ok, false);
  assert.match(result.error, /Duplicate|multiple/);
});

test('T11.4 Roster shows reasoning for role assignments', () => {
  const input = {
    team: [
      { name: 'Alice', role: 'tester', reason: 'QA expertise' },
      { name: 'Bob', role: 'devops', reason: 'Deployment experience' }
    ]
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert(result.rationale);
  assert.equal(result.rationale.length, 2);
  assert(result.rationale[0].reason);
});

test('T11 empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T11 malformed input (not array) returns error', () => {
  const result = run({ team: 'not an array' });
  assert.equal(result.ok, false);
});

test('T11 no mutation of input', () => {
  const input = {
    team: [
      { name: 'Alice', role: 'tester' },
      { name: 'Bob', role: 'devops' }
    ]
  };
  const original = JSON.stringify(input);

  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('T11 same output twice', () => {
  const input = {
    team: [
      { name: 'Alice', role: 'tester' },
      { name: 'Bob', role: 'devops' }
    ]
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepEqual(result1, result2);
});

test('T11 trace includes node and steps', () => {
  const input = {
    team: [
      { name: 'Alice', role: 'tester' },
      { name: 'Bob', role: 'devops' }
    ]
  };

  const result = run(input);
  assert.equal(result.trace.node, 'L2.E07');
  assert(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
