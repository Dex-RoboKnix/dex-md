import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/slant-draft.mjs';

test('T18.1 Slant record contains exactly 5 takeaways', () => {
  const result = run({
    folderContents: ['package.json', 'test.js', 'README.md', '.github'],
    location: '/project/my-app',
    name: 'MyApp'
  });

  assert.equal(result.ok, true);
  assert(result.draft);
  assert(result.draft.takeaways);
  assert.equal(result.draft.takeaways.length, 5);
  assert.equal(result.takeawayCount, 5);
});

test('T18.2 "What this is" statement and outcome wanted both required', () => {
  const result = run({
    folderContents: ['src/index.js', 'package.json'],
    location: '/project/lib'
  });

  assert.equal(result.ok, true);
  assert(result.draft.whatThisIs);
  assert(result.draft.whatThisIs.length > 0);
  assert(result.draft.outcomeWanted);
  assert(result.draft.outcomeWanted.length > 0);
});

test('T18.3 Agent drafts slant after checkpoint and human edits and confirms', () => {
  const result = run({
    folderContents: ['test/', 'src/', 'README.md', 'config.json'],
    location: '/project/sample'
  });

  assert.equal(result.ok, true);
  assert.equal(result.requiresHumanReview, true);
  assert(result.instructions);
  assert(result.instructions.toLowerCase().includes('human') || result.instructions.toLowerCase().includes('review'));
});

test('Each takeaway is a non-empty string', () => {
  const result = run({
    folderContents: ['file1.js', 'file2.js', 'test.js'],
    location: '/project/src'
  });

  assert.equal(result.ok, true);
  for (const takeaway of result.draft.takeaways) {
    assert.equal(typeof takeaway, 'string');
    assert(takeaway.length > 0);
  }
});

test('What this is is a single sentence', () => {
  const result = run({
    folderContents: ['package.json'],
    location: '/project/app'
  });

  assert.equal(result.ok, true);
  const whatThisIs = result.draft.whatThisIs;
  // Should end with period
  assert(whatThisIs.endsWith('.'));
  // Typically a single sentence (rough check: not too many periods)
  const periods = (whatThisIs.match(/\./g) || []).length;
  assert(periods <= 2);  // Allow some flexibility
});

test('Outcome wanted is clear statement', () => {
  const result = run({
    folderContents: ['src/main.ts', 'tests/main.test.ts'],
    location: '/workspace/lib'
  });

  assert.equal(result.ok, true);
  const outcome = result.draft.outcomeWanted;
  assert(outcome.includes('Enable') || outcome.includes('Support') || outcome.includes('Provide'));
});

test('Name parameter used in draft', () => {
  const result = run({
    folderContents: ['file.js'],
    location: '/project',
    name: 'SpecialName'
  });

  assert.equal(result.ok, true);
  assert.equal(result.draft.name, 'SpecialName');
  assert(result.draft.whatThisIs.includes('SpecialName'));
});

test('Default name when not provided', () => {
  const result = run({
    folderContents: ['file.js'],
    location: '/project'
  });

  assert.equal(result.ok, true);
  assert.equal(result.draft.name, 'Project');
});

test('Location parameter preserved in draft', () => {
  const testLocation = '/custom/project/path';
  const result = run({
    folderContents: ['file.js'],
    location: testLocation
  });

  assert.equal(result.ok, true);
  assert.equal(result.draft.location, testLocation);
});

test('Empty folderContents array accepted', () => {
  const result = run({
    folderContents: [],
    location: '/empty'
  });

  assert.equal(result.ok, true);
  assert.equal(result.draft.takeaways.length, 5);
});

test('Non-array folderContents rejected', () => {
  const result = run({
    folderContents: 'not-an-array',
    location: '/project'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Empty location rejected', () => {
  const result = run({
    folderContents: ['file.js'],
    location: ''
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing location rejected', () => {
  const result = run({
    folderContents: ['file.js']
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Non-string name rejected', () => {
  const result = run({
    folderContents: ['file.js'],
    location: '/project',
    name: 123
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert(result.error);
});

test('No mutation of input', () => {
  const input = {
    folderContents: ['file1.js', 'file2.js'],
    location: '/project/src',
    name: 'TestProject'
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    folderContents: ['test.js', 'src/index.js'],
    location: '/project'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    folderContents: ['file.js'],
    location: '/project'
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E04');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
