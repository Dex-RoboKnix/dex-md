import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p3/rules-split.mjs';

test('T09.1: When CLAUDE.md exceeds 200 lines, dex proposes splitting', () => {
  const result = run({
    claudemdLines: 250,
    dexSections: [
      { layer: 'L1', content: 'Section L1 content' }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.needsSplit, true);
});

test('T09.1: CLAUDE.md under 200 lines does not trigger split', () => {
  const result = run({ claudemdLines: 150, dexSections: [] });
  assert.equal(result.ok, true);
  assert.equal(result.needsSplit, false);
});

test('T09.3: Only dex-managed sections marked are proposed for moving', () => {
  const result = run({
    claudemdLines: 250,
    dexSections: [
      { layer: 'L1', content: 'Dex content L1' },
      { layer: 'L2', content: 'Dex content L2' }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.proposedFiles.length, 2);
});

test('T09.4: Full diff is shown of old CLAUDE.md and new .claude/rules/ structure', () => {
  const result = run({
    claudemdLines: 250,
    dexSections: [
      { layer: 'L1', content: 'content' }
    ]
  });
  assert.equal(result.ok, true);
  assert(result.diff);
  assert(result.diff.before.includes('250'));
  assert(result.diff.after.includes('.claude/rules/'));
});

test('T09.5: User approval is required before any files are written', () => {
  const result = run({
    claudemdLines: 250,
    dexSections: [
      { layer: 'L1', content: 'test' }
    ]
  });
  assert.equal(result.ok, true);
  assert.equal(result.requiresApproval, true);
});

test('T09.6: Path-scoped rules include paths frontmatter', () => {
  const result = run({
    claudemdLines: 250,
    dexSections: [
      { layer: 'L3', content: 'L3 rules' }
    ]
  });
  assert.equal(result.ok, true);
  const effect = result.effects[0];
  assert(effect.content.includes('paths:'));
  assert(effect.content.includes('layer: L3'));
});

test('T09: invalid dexSections structure returns error', () => {
  const result = run({
    claudemdLines: 250,
    dexSections: [{ content: 'missing layer' }]
  });
  assert.equal(result.ok, false);
});

test('T09: no mutation of input', () => {
  const input = {
    claudemdLines: 250,
    dexSections: [{ layer: 'L1', content: 'test' }]
  };
  const orig = JSON.stringify(input);
  run(input);
  assert.equal(JSON.stringify(input), orig);
});

test('T09: same input produces same output twice', () => {
  const input = {
    claudemdLines: 300,
    dexSections: [{ layer: 'L2', content: 'content' }]
  };
  const r1 = run(input);
  const r2 = run(input);
  assert.deepEqual(r1, r2);
});

test('T09: trace includes node id', () => {
  const result = run({ claudemdLines: 250, dexSections: [{ layer: 'L1', content: 'x' }] });
  assert.equal(result.trace.node, 'L5.E04');
  assert(Array.isArray(result.trace.steps));
});

test('T09: effects includes write-file for split files', () => {
  const result = run({
    claudemdLines: 250,
    dexSections: [{ layer: 'L1', content: 'test' }]
  });
  assert.equal(result.ok, true);
  assert(Array.isArray(result.effects));
  assert.equal(result.effects[0].kind, 'write-file');
  assert(result.effects[0].path.includes('dex-l1'));
});
