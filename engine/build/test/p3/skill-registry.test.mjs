import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/skill-registry.mjs';

test('T20.1 Registry maintains exactly five skill names', () => {
  const input = {
    registered: ['skill-a', 'skill-b', 'skill-c', 'skill-d', 'skill-e'],
    installed: []
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.registeredCount, 5);
});

test('T20.2 Installed skills checked against registered list', () => {
  const input = {
    registered: ['skill-a', 'skill-b', 'skill-c', 'skill-d', 'skill-e'],
    installed: [
      { name: 'skill-a', version: '1.0.0', status: 'active' },
      { name: 'skill-b', version: '1.1.0', status: 'active' }
    ]
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.installed, ['skill-a', 'skill-b']);
});

test('T20.3 Missing skills reported with coverage percentage', () => {
  const input = {
    registered: ['skill-a', 'skill-b', 'skill-c', 'skill-d', 'skill-e'],
    installed: [
      { name: 'skill-a', version: '1.0.0', status: 'active' }
    ]
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, ['skill-b', 'skill-c', 'skill-d', 'skill-e']);
  assert.equal(result.coverage, 20);
});

test('T20.4 Registry shows skill name, version, and installation status', () => {
  const input = {
    registered: ['skill-a', 'skill-b', 'skill-c', 'skill-d', 'skill-e'],
    installed: [
      { name: 'skill-a', version: '2.1.0', status: 'active' },
      { name: 'skill-c', version: '1.5.0', status: 'deprecated' }
    ]
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert(result.registry);

  const skillA = result.registry.find(s => s.name === 'skill-a');
  assert(skillA);
  assert.equal(skillA.version, '2.1.0');
  assert.equal(skillA.status, 'installed');

  const skillB = result.registry.find(s => s.name === 'skill-b');
  assert(skillB);
  assert.equal(skillB.version, 'unknown');
  assert.equal(skillB.status, 'missing');
});

test('T20 empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T20 malformed input returns error', () => {
  const result = run({ registered: 'not array', installed: [] });
  assert.equal(result.ok, false);
});

test('T20 wrong number of registered skills returns error', () => {
  const result = run({
    registered: ['skill-a', 'skill-b', 'skill-c'],
    installed: []
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /exactly 5/);
});

test('T20 no mutation of input', () => {
  const input = {
    registered: ['skill-a', 'skill-b', 'skill-c', 'skill-d', 'skill-e'],
    installed: [{ name: 'skill-a', version: '1.0', status: 'active' }]
  };
  const original = JSON.stringify(input);

  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('T20 same output twice', () => {
  const input = {
    registered: ['skill-a', 'skill-b', 'skill-c', 'skill-d', 'skill-e'],
    installed: [{ name: 'skill-a', version: '1.0', status: 'active' }]
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T20 trace includes node and steps', () => {
  const input = {
    registered: ['skill-a', 'skill-b', 'skill-c', 'skill-d', 'skill-e'],
    installed: []
  };

  const result = run(input);
  assert.equal(result.trace.node, 'L5.E02');
  assert(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
