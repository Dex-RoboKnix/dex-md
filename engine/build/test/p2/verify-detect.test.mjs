import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/verify-detect.mjs';

test('T03.1 Verify command detection searches package.json scripts first', () => {
  const result = run({
    packageJsonScripts: { verify: 'npm run test' },
    makefileContent: 'verify:\n\techo "make verify"'
  });
  assert.equal(result.ok, true);
  assert.equal(result.command, 'npm run test');
  assert.equal(result.foundIn, 'package.json');
  assert(result.searchLocations.includes('package.json'));
});

test('T03.2a Verify command found in package.json displayed to user', () => {
  const result = run({
    packageJsonScripts: { verify: 'npm test && npm run lint' }
  });
  assert.equal(result.ok, true);
  assert.equal(result.command, 'npm test && npm run lint');
  assert(result.trace);
});

test('T03.2b Verify command found in Makefile when not in package.json', () => {
  const result = run({
    packageJsonScripts: {},
    makefileContent: 'verify:\n\t@echo "Verifying..."'
  });
  assert.equal(result.ok, true);
  assert.equal(result.command, '@echo "Verifying..."');
  assert.equal(result.foundIn, 'Makefile');
});

test('T03.3 When detection fails, debug information is logged', () => {
  const now = '2026-10-09T10:00:00Z';
  const result = run({
    packageJsonScripts: {},
    makefileContent: '',
    now
  });
  assert.equal(result.ok, true);
  assert.equal(result.command, null);
  assert(result.effects);
  assert(result.effects.length > 0);
  const notFoundEffect = result.effects.find(e => e.kind === 'log' && e.event === 'verify-command-not-found');
  assert(notFoundEffect);
  assert(notFoundEffect.searched);
  assert(Array.isArray(notFoundEffect.searched));
});

test('T03.3 Debug log includes search locations and errors', () => {
  const result = run({
    packageJsonScripts: null,
    makefileContent: null
  });
  assert.equal(result.ok, true);
  assert.equal(result.command, null);
  assert(result.effects);
  const effect = result.effects.find(e => e.kind === 'log');
  assert(effect);
});

test('Missing package.json treated as not found', () => {
  const result = run({
    makefileContent: ''
  });
  assert.equal(result.ok, true);
  assert.equal(result.command, null);
  assert(result.searchLocations.some(loc => loc.includes('package.json')));
});

test('Package.json without verify script falls back to Makefile', () => {
  const result = run({
    packageJsonScripts: { test: 'jest', build: 'tsc' },
    makefileContent: 'verify:\n\t@echo "verified"'
  });
  assert.equal(result.ok, true);
  assert.equal(result.command, '@echo "verified"');
  assert.equal(result.foundIn, 'Makefile');
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('No mutation of input', () => {
  const input = {
    packageJsonScripts: { verify: 'npm test' },
    makefileContent: 'verify:\n\t@echo test'
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    packageJsonScripts: { verify: 'npm test' }
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    packageJsonScripts: { verify: 'npm test' }
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L5.E05');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});

test('Effects contains log entries with timestamp from input.now', () => {
  const now = '2026-10-09T12:34:56Z';
  const result = run({
    packageJsonScripts: {},
    now
  });
  assert(result.effects);
  const effect = result.effects.find(e => e.kind === 'log');
  assert(effect);
  assert.equal(effect.timestamp, now);
});
