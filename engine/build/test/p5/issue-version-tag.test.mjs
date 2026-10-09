import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p5/issue-version-tag.mjs';

test('T04.1 Version tags follow format dex-issue-<number>-<YYYY-MM-DD> with counter suffix', () => {
  const input = {
    issue_number: 123,
    date_string: '2026-10-09',
    counter: 1
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.tag, 'dex-issue-123-2026-10-09');
  assert.match(result.tag, /^dex-issue-\d+-\d{4}-\d{2}-\d{2}(-\d+)?$/);
});

test('T04.1 Counter suffix appended for duplicate same-day tags', () => {
  const input = {
    issue_number: 124,
    date_string: '2026-10-09',
    counter: 2
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.tag, 'dex-issue-124-2026-10-09-2');
});

test('T04.1 Counter suffix for third tag same day', () => {
  const input = {
    issue_number: 125,
    date_string: '2026-10-09',
    counter: 3
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.tag, 'dex-issue-125-2026-10-09-3');
});

test('T04.2 Git tags stored in repository', () => {
  const input = {
    issue_number: 126,
    date_string: '2026-10-09',
    counter: 1
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.git_tag, 'dex-issue-126-2026-10-09');
  assert.ok(result.git_tag === result.tag);
});

test('T04.3 Git tag linked to GitHub issue by comment - signal set', () => {
  const input = {
    issue_number: 127,
    date_string: '2026-10-09',
    counter: 1
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.github_comment_required, true);
});

test('T04.4 Multiple tags same date disambiguated with sequential counters', () => {
  const tags = [];
  for (let i = 1; i <= 3; i++) {
    const input = {
      issue_number: 128,
      date_string: '2026-10-09',
      counter: i
    };
    const result = run(input);
    tags.push(result.tag);
  }

  assert.strictEqual(tags[0], 'dex-issue-128-2026-10-09');
  assert.strictEqual(tags[1], 'dex-issue-128-2026-10-09-2');
  assert.strictEqual(tags[2], 'dex-issue-128-2026-10-09-3');
});

test('T04.5 Tag names human-readable and sortable by date and issue', () => {
  const tags = [
    { issue: 100, date: '2026-10-08', counter: 1 },
    { issue: 101, date: '2026-10-08', counter: 1 },
    { issue: 100, date: '2026-10-09', counter: 1 },
    { issue: 101, date: '2026-10-09', counter: 1 }
  ].map(({ issue, date, counter }) => {
    const result = run({ issue_number: issue, date_string: date, counter });
    return result.tag;
  });

  const sorted = tags.slice().sort();
  assert.deepStrictEqual(sorted, [
    'dex-issue-100-2026-10-08',
    'dex-issue-100-2026-10-09',
    'dex-issue-101-2026-10-08',
    'dex-issue-101-2026-10-09'
  ]);
});

test('empty input', () => {
  const result = run({});
  assert.strictEqual(result.ok, false);
});

test('malformed input - missing issue number', () => {
  const input = {
    date_string: '2026-10-09',
    counter: 1
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - invalid date format', () => {
  const input = {
    issue_number: 130,
    date_string: '2026/10/09',
    counter: 1
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /YYYY-MM-DD/);
});

test('malformed input - invalid issue number', () => {
  const input = {
    issue_number: 'abc',
    date_string: '2026-10-09',
    counter: 1
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - negative issue number', () => {
  const input = {
    issue_number: -5,
    date_string: '2026-10-09',
    counter: 1
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('no counter defaults to 1', () => {
  const input = {
    issue_number: 131,
    date_string: '2026-10-09'
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.counter, 1);
  assert.strictEqual(result.tag, 'dex-issue-131-2026-10-09');
});

test('no mutation of input', () => {
  const input = {
    issue_number: 132,
    date_string: '2026-10-09',
    counter: 1
  };

  const original = JSON.stringify(input);
  run(input);
  assert.strictEqual(JSON.stringify(input), original);
});

test('same input produces same output', () => {
  const input = {
    issue_number: 133,
    date_string: '2026-10-09',
    counter: 1
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('trace contains node and steps', () => {
  const input = {
    issue_number: 134,
    date_string: '2026-10-09',
    counter: 1
  };

  const result = run(input);
  assert.strictEqual(result.trace.node, 'L4.E06');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
