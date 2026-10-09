import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/folder-classify.mjs';

test('T04.1 Folder with only dex.md classified as blank', () => {
  const result = run({ files: ['dex.md'] });
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'blank');
});

test('T04.1b Empty folder classified as blank', () => {
  const result = run({ files: [] });
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'blank');
});

test('T04.2 Folder with non-dex content and no markers classified as blank-with-context', () => {
  const result = run({
    files: ['dex.md', 'README.md', 'notes.txt', 'export.json']
  });
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'blank-with-context');
});

test('T04.2b Documents without .git or .scratch are blank-with-context', () => {
  const result = run({
    files: ['README.md', 'notes/', 'export.json']
  });
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'blank-with-context');
});

test('T04.3a Folder with .git classified as in-flight', () => {
  const result = run({
    files: ['dex.md', '.git', '.git/config', '.git/HEAD', 'notes.txt']
  });
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'in-flight');
  assert(result.reason.includes('.git'));
});

test('T04.3b Folder with .scratch classified as in-flight', () => {
  const result = run({
    files: ['dex.md', '.scratch', '.scratch/file.md', 'README.md']
  });
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'in-flight');
  assert(result.reason.includes('.scratch'));
});

test('T04.3c .git or .scratch marker wins over other content', () => {
  const result = run({
    files: ['.git', '.scratch']
  });
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'in-flight');
});

test('T04.3d in-flight classification regardless of age', () => {
  const result = run({
    files: ['dex.md', '.git/config']
  });
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'in-flight');
});

test('dex-vault folder is not a marker here', () => {
  const result = run({
    files: ['dex-vault/', 'dex-vault/file.md']
  });
  assert.equal(result.ok, true);
  // dex-vault is dex content, so this is just blank/blank-with-context
  assert(['blank', 'blank-with-context'].includes(result.classification));
});

test('Folder with only lib/ and test/ (dex structure) is blank', () => {
  const result = run({
    files: ['lib/', 'lib/index.mjs', 'test/', 'test/index.test.mjs']
  });
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'blank');
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('Missing files array rejected', () => {
  const result = run({});
  assert.equal(result.ok, false);
});

test('Invalid files input rejected', () => {
  const result = run({ files: 'not-an-array' });
  assert.equal(result.ok, false);
});

test('No mutation of input', () => {
  const input = { files: ['.git', 'dex.md', 'file.txt'] };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = { files: ['.git', 'dex.md'] };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({ files: ['dex.md'] });
  assert(result.trace);
  assert.equal(result.trace.node, 'L1.E01');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});

test('in-flight wins over blank-with-context', () => {
  const result = run({
    files: ['.git', 'dex.md', 'README.md', 'notes.txt']
  });
  assert.equal(result.classification, 'in-flight');
});
