import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p5/coverage-report.mjs';

test('T09.1 Per-layer and overall scores follow coverage-score rule', () => {
  const input = {
    coverage_scores: {
      'L1.E01': { status: 'C', layer: 'L1' },
      'L1.E02': { status: 'W', layer: 'L1' },
      'L2.E01': { status: 'C', layer: 'L2' },
      'L2.E02': { status: 'N', layer: 'L2' }
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  // L1: (1 + 0.5) / 2 = 0.75 = 75%
  // L2: (1 + 0) / 2 = 0.5 = 50%
  // Overall: (2 + 0.5) / 4 = 62.5% = 63%
  assert.strictEqual(result.layer_scores['L1'], 75);
  assert.strictEqual(result.layer_scores['L2'], 50);
});

test('T09.2 No layer weighting is applied', () => {
  const input = {
    coverage_scores: {
      'L1.E01': { status: 'C', layer: 'L1' },
      'L2.E01': { status: 'C', layer: 'L2' },
      'L2.E02': { status: 'C', layer: 'L2' },
      'L2.E03': { status: 'C', layer: 'L2' }
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  // Each node counts the same, no layer weights
  assert.strictEqual(result.stats.nodes_counted, 4);
  assert.strictEqual(result.overall_score, '100%');
});

test('T09.3 Every node appears with status C/W/N/U/NA so each score is traceable', () => {
  const input = {
    coverage_scores: {
      'L1.E01': { status: 'C', layer: 'L1' },
      'L1.E02': { status: 'W', layer: 'L1' },
      'L1.E03': { status: 'N', layer: 'L1' },
      'L1.E04': { status: 'U', layer: 'L1' },
      'L1.E05': { status: 'NA', layer: 'L1' }
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.nodes_with_status.length, 5);

  const statuses = result.nodes_with_status.map(n => n.status);
  assert.ok(statuses.includes('C'));
  assert.ok(statuses.includes('W'));
  assert.ok(statuses.includes('N'));
  assert.ok(statuses.includes('U'));
  assert.ok(statuses.includes('NA'));
});

test('T09.4 Overall score reported as percentage next to 90 percent bar', () => {
  const input = {
    coverage_scores: {
      'L1.E01': { status: 'C', layer: 'L1' },
      'L1.E02': { status: 'C', layer: 'L1' },
      'L1.E03': { status: 'C', layer: 'L1' },
      'L1.E04': { status: 'C', layer: 'L1' }
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.overall_score, '100%');
  assert.strictEqual(result.bar_target, '90%');
  assert.strictEqual(result.meets_target, true);
});

test('T09.5 Report never computes score differently from coverage-score', () => {
  const input = {
    coverage_scores: {
      'L3.E01': { status: 'C', layer: 'L3' },
      'L3.E02': { status: 'W', layer: 'L3' },
      'L3.E03': { status: 'W', layer: 'L3' },
      'L3.E04': { status: 'N', layer: 'L3' }
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  // (1 + 0.5 + 0.5) / 4 = 2 / 4 = 50%
  assert.strictEqual(result.stats.covered, 1);
  assert.strictEqual(result.stats.weak, 1);
  assert.strictEqual(result.stats.overall_percentage, 50);
});

test('NA status excluded from denominator', () => {
  const input = {
    coverage_scores: {
      'L1.E01': { status: 'C', layer: 'L1' },
      'L1.E02': { status: 'NA', layer: 'L1' },
      'L1.E03': { status: 'NA', layer: 'L1' }
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.stats.nodes_na, 2);
  assert.strictEqual(result.stats.nodes_counted, 1);
  assert.strictEqual(result.overall_score, '100%');
});

test('below 90 percent target', () => {
  const input = {
    coverage_scores: {
      'L1.E01': { status: 'C', layer: 'L1' },
      'L1.E02': { status: 'N', layer: 'L1' },
      'L1.E03': { status: 'N', layer: 'L1' },
      'L1.E04': { status: 'N', layer: 'L1' }
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.overall_score, '25%');
  assert.strictEqual(result.meets_target, false);
});

test('empty coverage scores', () => {
  const result = run({ coverage_scores: {} });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /cannot be empty/);
});

test('malformed input - not an object', () => {
  const result = run({ coverage_scores: [] });
  assert.strictEqual(result.ok, false);
});

test('malformed input - invalid status', () => {
  const input = {
    coverage_scores: {
      'L1.E01': { status: 'INVALID', layer: 'L1' }
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /invalid status/);
});

test('no mutation of input', () => {
  const input = {
    coverage_scores: {
      'L1.E01': { status: 'C', layer: 'L1' }
    }
  };

  const original = JSON.stringify(input);
  run(input);
  assert.strictEqual(JSON.stringify(input), original);
});

test('same input produces same output', () => {
  const input = {
    coverage_scores: {
      'L1.E01': { status: 'C', layer: 'L1' },
      'L2.E01': { status: 'W', layer: 'L2' }
    }
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('trace contains node and steps', () => {
  const input = {
    coverage_scores: {
      'L1.E01': { status: 'C', layer: 'L1' }
    }
  };

  const result = run(input);
  assert.strictEqual(result.trace.node, 'L1.E05');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
