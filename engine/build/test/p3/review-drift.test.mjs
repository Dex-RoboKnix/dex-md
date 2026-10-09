import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/review-drift.mjs';

test('T19.1 Analysis reads explicit code comments only', () => {
  const input = {
    codeComments: [
      { file: 'lib.js', line: 10, comment: 'TODO: implement validation' },
      { file: 'lib.js', line: 20, comment: 'Temporary workaround' }
    ],
    spec: 'validation module'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.analysisType, 'explicit-comments-only');
});

test('T19.2 Unimplemented behaviours found in comments flagged as discrepancies', () => {
  const input = {
    codeComments: [
      { file: 'service.js', line: 45, comment: 'TODO: add error handling for timeout' }
    ],
    spec: 'service module with basic features'
  };

  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.discrepancies.length > 0);
  assert(result.discrepancies.some(d => d.severity === 'discrepancy'));
});

test('T19.3 Drift report includes code file name and line number', () => {
  const input = {
    codeComments: [
      { file: 'parser.js', line: 123, comment: 'TODO: implement streaming parser' }
    ],
    spec: 'parser specification'
  };

  const result = run(input);
  assert.equal(result.ok, true);

  for (const discrepancy of result.discrepancies) {
    assert(discrepancy.file);
    assert(typeof discrepancy.line === 'number');
  }
});

test('T19.4 Each discrepancy lists behaviour description for context', () => {
  const input = {
    codeComments: [
      { file: 'db.js', line: 55, comment: 'FIXME: implement connection pooling' }
    ],
    spec: 'database module'
  };

  const result = run(input);
  assert.equal(result.ok, true);

  for (const discrepancy of result.discrepancies) {
    assert(discrepancy.behaviour);
    assert.match(discrepancy.behaviour, /FIXME|TODO|implement/i);
  }
});

test('T19 empty input returns error', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T19 malformed input returns error', () => {
  const result = run({ codeComments: 'not an array', spec: 'test' });
  assert.equal(result.ok, false);
});

test('T19 no mutation of input', () => {
  const input = {
    codeComments: [
      { file: 'test.js', line: 1, comment: 'TODO: something' }
    ],
    spec: 'test'
  };
  const original = JSON.stringify(input);

  run(input);
  assert.equal(JSON.stringify(input), original);
});

test('T19 same output twice', () => {
  const input = {
    codeComments: [
      { file: 'test.js', line: 1, comment: 'TODO: implement feature' }
    ],
    spec: 'test'
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T19 trace includes node and steps', () => {
  const input = {
    codeComments: [
      { file: 'test.js', line: 1, comment: 'A comment' }
    ],
    spec: 'test'
  };

  const result = run(input);
  assert.equal(result.trace.node, 'L6.E05');
  assert(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
