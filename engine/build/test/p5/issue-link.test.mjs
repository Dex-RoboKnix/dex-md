import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p5/issue-link.mjs';

test('T18.1: Issue references formatted as Markdown links in GitHub format', () => {
  const input = {
    issue_number: 42,
    repo_url: 'https://github.com/user/repo'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.markdownLink.startsWith('[#'));
  assert.ok(result.markdownLink.includes(']('));
  assert.match(result.markdownLink, /\[#42\]/);
});

test('T18.2: Link validation occurs at generation time', () => {
  const input = {
    issue_number: 1,
    repo_url: 'https://github.com/test/test'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.trace.steps.some(s => s.action === 'validate-format'));
});

test('T18.3: Invalid GitHub issues cause generation to fail', () => {
  const input = {
    issue_number: 50000, // Simulated as non-existent
    repo_url: 'https://github.com/test/test'
  };
  const result = run(input);
  assert.equal(result.ok, false);
  assert.match(result.error, /does not exist/);
});

test('T18.4: Invalid URLs are rejected', () => {
  const input = {
    issue_number: 42,
    repo_url: 'not-a-valid-url'
  };
  const result = run(input);
  assert.equal(result.ok, false);
  assert.match(result.error, /valid GitHub URL/);
});

test('T18.5: Generated links are verifiable and current', () => {
  const input = {
    issue_number: 123,
    repo_url: 'https://github.com/dex/roboknix/'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.issueUrl.includes('123'));
  assert.ok(result.issueUrl.includes('issues'));
});

test('T18: Empty input returns error', () => {
  const result = run({});
  assert.equal(result.ok, false);
});

test('T18: Missing issue_number returns error', () => {
  const result = run({
    repo_url: 'https://github.com/test/test'
  });
  assert.equal(result.ok, false);
});

test('T18: Zero or negative issue_number returns error', () => {
  const result1 = run({ issue_number: 0, repo_url: 'https://github.com/test/test' });
  const result2 = run({ issue_number: -1, repo_url: 'https://github.com/test/test' });
  assert.equal(result1.ok, false);
  assert.equal(result2.ok, false);
});

test('T18: Missing repo_url returns error', () => {
  const result = run({
    issue_number: 42
  });
  assert.equal(result.ok, false);
});

test('T18: Empty repo_url returns error', () => {
  const result = run({
    issue_number: 42,
    repo_url: ''
  });
  assert.equal(result.ok, false);
});

test('T18: No mutation of input', () => {
  const input = {
    issue_number: 42,
    repo_url: 'https://github.com/test/test'
  };
  const copy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, copy);
});

test('T18: Same input produces same output twice', () => {
  const input = {
    issue_number: 42,
    repo_url: 'https://github.com/test/test'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T18: Trace includes validation step', () => {
  const input = {
    issue_number: 10,
    repo_url: 'https://github.com/test/test'
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L4.E04');
  assert.ok(result.trace.steps.length > 0);
});
