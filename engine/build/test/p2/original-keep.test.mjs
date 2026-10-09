import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/original-keep.mjs';

test('T11.1 Original files placed in original/ subfolder', () => {
  const result = run({
    originalPath: 'doc/notes.txt',
    nodeDir: '/project/node-001',
    existingFiles: []
  });
  assert.equal(result.ok, true);
  assert(result.targetPath.includes('/original/notes.txt'));
  assert.equal(result.frontmatterField, result.targetPath);
});

test('T11.2 Filename conflicts resolved with numbered suffix', () => {
  const result = run({
    originalPath: 'export.json',
    nodeDir: '/project/node-001',
    existingFiles: ['/project/node-001/original/export.json']
  });
  assert.equal(result.ok, true);
  assert(result.targetPath.includes('export.orig.1.json'));
  assert.equal(result.hasConflict, true);
});

test('T11.3 Original file path recorded in both frontmatter and markdown link', () => {
  const result = run({
    originalPath: 'archive.md',
    nodeDir: '/vault/node-002',
    existingFiles: []
  });
  assert.equal(result.ok, true);
  assert(result.frontmatterField);
  assert(result.markdownLink);
  assert(result.markdownLink.includes('[original]'));
  assert(result.markdownLink.includes(result.targetPath));
});

test('Empty originalPath rejected', () => {
  const result = run({
    originalPath: '',
    nodeDir: '/project/node-001',
    existingFiles: []
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing originalPath rejected', () => {
  const result = run({
    nodeDir: '/project/node-001',
    existingFiles: []
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Empty nodeDir rejected', () => {
  const result = run({
    originalPath: 'file.txt',
    nodeDir: '',
    existingFiles: []
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing nodeDir rejected', () => {
  const result = run({
    originalPath: 'file.txt',
    existingFiles: []
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Non-array existingFiles rejected', () => {
  const result = run({
    originalPath: 'file.txt',
    nodeDir: '/project/node-001',
    existingFiles: 'not-an-array'
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
    originalPath: 'test.txt',
    nodeDir: '/project/node-001',
    existingFiles: ['/project/node-001/other.txt']
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    originalPath: 'data.json',
    nodeDir: '/vault/node-003',
    existingFiles: []
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    originalPath: 'file.md',
    nodeDir: '/project/node-001',
    existingFiles: []
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E06');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
