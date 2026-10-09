import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/chat-export-detect.mjs';

test('T08.1 OpenAI exports identified by conversations.json', () => {
  const result = run({
    files: ['conversations.json', 'file1.json', 'file2.json']
  });
  assert.equal(result.ok, true);
  assert(result.exports.some(e => e.type === 'openai'));
  assert(result.exports.some(e => e.signature === 'conversations.json'));
});

test('T08.2 Gemini exports identified by Takeout folder structure', () => {
  const result = run({
    files: ['Takeout/Gemini/chats.json', 'Takeout/Gemini/file.txt']
  });
  assert.equal(result.ok, true);
  assert(result.exports.some(e => e.type === 'gemini'));
  assert(result.exports.some(e => e.signature.includes('Takeout')));
});

test('T08.3 Both export types handled in same folder with provenance tracked', () => {
  const result = run({
    files: [
      'conversations.json',
      'Takeout/Gemini/chats.json'
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 2);
  assert(result.exports.some(e => e.type === 'openai'));
  assert(result.exports.some(e => e.type === 'gemini'));
  assert(result.provenance.some(p => p.source === 'OpenAI'));
  assert(result.provenance.some(p => p.source === 'Gemini'));
});

test('No exports detected returns empty list', () => {
  const result = run({
    files: ['README.md', 'notes.txt', 'data.csv']
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 0);
  assert.equal(result.exports.length, 0);
});

test('Empty file list returns no exports', () => {
  const result = run({ files: [] });
  assert.equal(result.ok, true);
  assert.equal(result.count, 0);
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('Missing files array rejected', () => {
  const result = run({});
  assert.equal(result.ok, false);
});

test('Gemini variant paths recognized', () => {
  const result = run({
    files: ['Takeout/Gemini/chats.json']
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 1);
  assert(result.exports.some(e => e.type === 'gemini'));
});

test('Only conversations.json detected (not other .json files)', () => {
  const result = run({
    files: ['data.json', 'export.json', 'conversations.json']
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 1);
  assert(result.exports.every(e => e.signature === 'conversations.json'));
});

test('No mutation of input', () => {
  const input = { files: ['conversations.json'] };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = { files: ['Takeout/Gemini/chats.json'] };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({ files: ['conversations.json'] });
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E01');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});

test('Provenance includes source and marker', () => {
  const result = run({
    files: ['conversations.json', 'Takeout/Gemini/chats.json']
  });
  assert(result.provenance);
  assert(result.provenance.every(p => p.source && p.marker));
});
