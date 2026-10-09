import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p1/checkpoint-summary.mjs';

test('T16.1: Journal items counted', () => {
  const result = run({
    checkpoint: {
      journal: [{ entry: 1 }, { entry: 2 }, { entry: 3 }]
    }
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.journalCount, 3);
});

test('T16.2: Source items counted', () => {
  const result = run({
    checkpoint: {
      source: [{ ref: 'A' }, { ref: 'B' }]
    }
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.sourceCount, 2);
});

test('T16.3: Claim items counted', () => {
  const result = run({
    checkpoint: {
      claim: [{ statement: 'X' }]
    }
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.claimCount, 1);
});

test('T16.4: NodeChange items counted', () => {
  const result = run({
    checkpoint: {
      nodeChange: [{ change: 'Y' }]
    }
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.nodeChangeCount, 1);
});

test('T16.5: Action items counted', () => {
  const result = run({
    checkpoint: {
      action: [{ task: 'Z' }, { task: 'W' }]
    }
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.actionCount, 2);
});

test('T16.6: All section types counted together', () => {
  const result = run({
    checkpoint: {
      journal: [{ a: 1 }],
      source: [{ b: 2 }, { b: 3 }],
      claim: [{ c: 4 }],
      nodeChange: [{ d: 5 }],
      action: [{ e: 6 }, { e: 7 }, { e: 8 }]
    }
  });
  assert.strictEqual(result.journalCount, 1);
  assert.strictEqual(result.sourceCount, 2);
  assert.strictEqual(result.claimCount, 1);
  assert.strictEqual(result.nodeChangeCount, 1);
  assert.strictEqual(result.actionCount, 3);
  assert.strictEqual(result.totalCount, 8);
});

test('T16.7: Empty checkpoint returns zeros', () => {
  const result = run({ checkpoint: {} });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.journalCount, 0);
  assert.strictEqual(result.sourceCount, 0);
  assert.strictEqual(result.claimCount, 0);
  assert.strictEqual(result.nodeChangeCount, 0);
  assert.strictEqual(result.actionCount, 0);
  assert.strictEqual(result.totalCount, 0);
});

test('T16.8: Invalid journal array rejected', () => {
  const result = run({
    checkpoint: {
      journal: 'not-an-array'
    }
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('T16.9: Invalid source array rejected', () => {
  const result = run({
    checkpoint: {
      source: 'not-an-array'
    }
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('T16.10: Invalid claim array rejected', () => {
  const result = run({
    checkpoint: {
      claim: 'not-an-array'
    }
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('T16.11: Invalid nodeChange array rejected', () => {
  const result = run({
    checkpoint: {
      nodeChange: 'not-an-array'
    }
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('T16.12: Invalid action array rejected', () => {
  const result = run({
    checkpoint: {
      action: 'not-an-array'
    }
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /must be an array/);
});

test('T16.13: No mutation of input', () => {
  const input = {
    checkpoint: {
      journal: [{ a: 1 }]
    }
  };
  const originalLength = input.checkpoint.journal.length;
  run(input);
  assert.strictEqual(input.checkpoint.journal.length, originalLength);
});

test('T16.14: Same input produces same output', () => {
  const input = {
    checkpoint: {
      journal: [{ a: 1 }, { a: 2 }],
      action: [{ b: 3 }]
    }
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('T16.15: Trace includes node and steps', () => {
  const result = run({
    checkpoint: {
      journal: [{ a: 1 }]
    }
  });
  assert.ok(result.trace);
  assert.strictEqual(result.trace.node, 'L4.E08');
  assert.ok(Array.isArray(result.trace.steps));
});

test('T16.16: Total count is sum of all counts', () => {
  const result = run({
    checkpoint: {
      journal: [{ a: 1 }, { a: 2 }],
      source: [{ b: 3 }],
      claim: [{ c: 4 }, { c: 5 }, { c: 6 }],
      nodeChange: [{ d: 7 }],
      action: [{ e: 8 }]
    }
  });
  const expected = 2 + 1 + 3 + 1 + 1;
  assert.strictEqual(result.totalCount, expected);
});
