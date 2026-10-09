import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/secret-detect.mjs';

test('T07.1 Secret file patterns detected', () => {
  const result = run({
    files: ['.env', 'app.key', 'cert.pem', 'id_rsa', 'credentials.json', 'secrets.yaml']
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 6);
  assert(result.secrets.some(s => s.file === '.env'));
  assert(result.secrets.some(s => s.file === 'app.key'));
  assert(result.secrets.some(s => s.file === 'cert.pem'));
});

test('T07.2 Detected files shown as list-only', () => {
  const result = run({
    files: ['.env', 'README.md', 'app.key']
  });
  assert.equal(result.ok, true);
  assert(result.secrets.every(s => s.status === 'list-only'));
  assert(result.secrets.every(s => s.contentHidden === true));
});

test('T07.3 Files flagged even if in .gitignore', () => {
  const result = run({
    files: ['.env', '.gitignore', 'node_modules']
  });
  assert.equal(result.ok, true);
  // Module doesn't check .gitignore, just detects patterns
  assert(result.secrets.some(s => s.file === '.env'));
});

test('T07.1b .key files detected', () => {
  const result = run({
    files: ['private.key', 'rsa.key', 'api.key']
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 3);
});

test('T07.1c .pem files detected', () => {
  const result = run({
    files: ['certificate.pem', 'key.pem']
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 2);
});

test('T07.1d id_rsa detected', () => {
  const result = run({
    files: ['id_rsa', 'id_rsa.pub']
  });
  assert.equal(result.ok, true);
  assert(result.secrets.some(s => s.file === 'id_rsa'));
});

test('T07.1e credentials.* detected', () => {
  const result = run({
    files: ['credentials.json', 'credentials.yaml', 'credentials.env']
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 3);
});

test('T07.1f secrets.* detected', () => {
  const result = run({
    files: ['secrets.json', 'secrets.yaml']
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 2);
});

test('Non-secret files not flagged', () => {
  const result = run({
    files: ['README.md', 'package.json', 'src/app.js', '.gitignore']
  });
  assert.equal(result.ok, true);
  assert.equal(result.count, 0);
});

test('Empty file list returns no secrets', () => {
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

test('No mutation of input', () => {
  const input = { files: ['.env', 'app.key'] };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = { files: ['.env', 'app.key', 'README.md'] };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({ files: ['.env'] });
  assert(result.trace);
  assert.equal(result.trace.node, 'L3.E05');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
