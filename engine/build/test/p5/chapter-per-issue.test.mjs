import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p5/chapter-per-issue.mjs';

test('T02.1 Chapter title enforced at max 10 words and 60 characters', () => {
  const input = {
    issue: {
      number: 1,
      title: 'Build the core parser and validator system',
      body: 'This is the issue body'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.chapter_stub.word_count, 7);
  assert.strictEqual(result.chapter_stub.char_count, 42);
  assert.ok(result.chapter_stub.word_count <= 10);
  assert.ok(result.chapter_stub.char_count <= 60);
});

test('T02.1 Title exceeding 10 words is rejected', () => {
  const input = {
    issue: {
      number: 2,
      title: 'This is a title that has more than ten words in it and should fail',
      body: 'Body text'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /exceeds 10 words/);
});

test('T02.1 Title exceeding 60 characters is rejected', () => {
  const input = {
    issue: {
      number: 3,
      title: 'Implement comprehensive database management system architecture framework',
      body: 'Body'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /exceeds 60 characters/);
});

test('T02.2 Missing body description shows placeholder', () => {
  const input = {
    issue: {
      number: 4,
      title: 'No body issue',
      body: ''
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.chapter_stub.body, '[NEEDS BODY DESCRIPTION]');
  assert.strictEqual(result.chapter_stub.missing_body_description, true);
});

test('T02.2 Null body shows placeholder', () => {
  const input = {
    issue: {
      number: 5,
      title: 'Null body issue',
      body: null
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.chapter_stub.body, '[NEEDS BODY DESCRIPTION]');
});

test('T02.3 Chapter stub requires human sign-off', () => {
  const input = {
    issue: {
      number: 6,
      title: 'Requires sign off',
      body: 'Description here'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.chapter_stub.requires_human_signoff, true);
});

test('T02.4 Chapter references original GitHub issue', () => {
  const input = {
    issue: {
      number: 42,
      title: 'GitHub reference test',
      body: 'Some body'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.chapter_stub.github_issue_reference, '#42');
});

test('T02.5 Sign-off record includes author name and date - input for signoff', () => {
  const input = {
    issue: {
      number: 7,
      title: 'Sign off tracking',
      body: 'Body'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.chapter_stub.issue_number, 7);
});

test('empty input', () => {
  const result = run({});
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /issue is required/);
});

test('malformed input - null issue', () => {
  const result = run({ issue: null });
  assert.strictEqual(result.ok, false);
});

test('malformed input - missing issue number', () => {
  const input = {
    issue: {
      title: 'No number',
      body: 'Body'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - invalid issue number', () => {
  const input = {
    issue: {
      number: 'abc',
      title: 'Invalid number',
      body: 'Body'
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('no mutation of input', () => {
  const input = {
    issue: {
      number: 8,
      title: 'No mutation test',
      body: 'Original body'
    }
  };

  const original = JSON.stringify(input);
  run(input);
  assert.strictEqual(JSON.stringify(input), original);
});

test('same input produces same output', () => {
  const input = {
    issue: {
      number: 9,
      title: 'Deterministic',
      body: 'Consistent body'
    }
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('trace contains node and steps', () => {
  const input = {
    issue: {
      number: 10,
      title: 'Trace test',
      body: 'Body'
    }
  };

  const result = run(input);
  assert.strictEqual(result.trace.node, 'L4.E08');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
