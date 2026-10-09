import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/fetch-plan.mjs';

test('T02.1 Plan displays repo, ref, and destination path', () => {
  const result = run({
    repo: 'https://github.com/user/project.git',
    ref: 'v1.0.0',
    destination: '/absolute/path/to/vault',
    folderState: 'blank'
  });
  assert.equal(result.ok, true);
  assert.equal(result.plan.repo, 'https://github.com/user/project.git');
  assert.equal(result.plan.ref, 'v1.0.0');
  assert.equal(result.plan.destination, '/absolute/path/to/vault');
  assert(result.display);
});

test('T02.2a Plan indicates blank folder state', () => {
  const result = run({
    repo: 'https://github.com/user/project.git',
    ref: 'v1.0.0',
    destination: '/path',
    folderState: 'blank'
  });
  assert.equal(result.ok, true);
  assert(result.display.folderState.includes('empty'));
});

test('T02.2b Plan indicates blank-with-context folder state', () => {
  const result = run({
    repo: 'https://github.com/user/project.git',
    ref: 'v1.0.0',
    destination: '/path',
    folderState: 'blank-with-context'
  });
  assert.equal(result.ok, true);
  assert(result.display.folderState.includes('untracked'));
});

test('T02.2c Plan indicates in-flight folder state', () => {
  const result = run({
    repo: 'https://github.com/user/project.git',
    ref: 'v1.0.0',
    destination: '/path',
    folderState: 'in-flight'
  });
  assert.equal(result.ok, true);
  assert(result.display.folderState.includes('.git') || result.display.folderState.includes('.scratch') || result.display.folderState.includes('progress'));
});

test('Missing repo rejected', () => {
  const result = run({
    ref: 'v1.0.0',
    destination: '/path',
    folderState: 'blank'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('repo'));
});

test('Missing ref rejected', () => {
  const result = run({
    repo: 'https://github.com/user/project.git',
    destination: '/path',
    folderState: 'blank'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('ref'));
});

test('Missing destination rejected', () => {
  const result = run({
    repo: 'https://github.com/user/project.git',
    ref: 'v1.0.0',
    folderState: 'blank'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('destination'));
});

test('Invalid folderState rejected', () => {
  const result = run({
    repo: 'https://github.com/user/project.git',
    ref: 'v1.0.0',
    destination: '/path',
    folderState: 'unknown'
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('folderState'));
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('No mutation of input', () => {
  const input = {
    repo: 'https://github.com/user/project.git',
    ref: 'v1.0.0',
    destination: '/path',
    folderState: 'blank'
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    repo: 'https://github.com/user/project.git',
    ref: 'v1.0.0',
    destination: '/path',
    folderState: 'blank'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    repo: 'https://github.com/user/project.git',
    ref: 'v1.0.0',
    destination: '/path',
    folderState: 'blank'
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E03');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
