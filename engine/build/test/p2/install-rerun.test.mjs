import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/install-rerun.mjs';

test('T20.1 Existing install detected when RUNLOG and dex-vault both present', () => {
  const result = run({
    hasRunlog: true,
    hasDexVault: true,
    isDirty: false
  });

  assert.equal(result.ok, true);
  assert.equal(result.isExistingInstall, true);
  assert.equal(result.installMode, 're-run');
});

test('T20.2 Re-run is incremental and skips unchanged assets', () => {
  const result = run({
    hasRunlog: true,
    hasDexVault: true,
    isDirty: false
  });

  assert.equal(result.ok, true);
  assert.equal(result.approach, 'incremental');
  assert(result.note.includes('skip unchanged'));
});

test('T20.3 Dirty state aborts with notification, nothing written', () => {
  const result = run({
    hasRunlog: true,
    hasDexVault: true,
    isDirty: true
  });

  assert.equal(result.ok, false);
  assert.equal(result.abort, true);
  assert.equal(result.isDirty, true);
  assert(result.notification);
  assert(result.notification.includes('uncommitted changes'));
});

test('No existing install when only RUNLOG present', () => {
  const result = run({
    hasRunlog: true,
    hasDexVault: false,
    isDirty: false
  });

  assert.equal(result.ok, true);
  assert.equal(result.isExistingInstall, false);
  assert.equal(result.installMode, 'new');
  assert(result.missingMarkers.includes('dex-vault folder'));
});

test('No existing install when only dex-vault present', () => {
  const result = run({
    hasRunlog: false,
    hasDexVault: true,
    isDirty: false
  });

  assert.equal(result.ok, true);
  assert.equal(result.isExistingInstall, false);
  assert.equal(result.installMode, 'new');
  assert(result.missingMarkers.includes('RUNLOG'));
});

test('No existing install when neither marker present', () => {
  const result = run({
    hasRunlog: false,
    hasDexVault: false,
    isDirty: false
  });

  assert.equal(result.ok, true);
  assert.equal(result.isExistingInstall, false);
  assert.equal(result.installMode, 'new');
  assert(result.missingMarkers.length >= 2);
});

test('Dirty state takes priority over install detection', () => {
  const result = run({
    hasRunlog: false,
    hasDexVault: false,
    isDirty: true
  });

  assert.equal(result.ok, false);
  assert.equal(result.abort, true);
  // Dirty state blocks even fresh install
});

test('Non-boolean hasRunlog rejected', () => {
  const result = run({
    hasRunlog: 'true',
    hasDexVault: false,
    isDirty: false
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Non-boolean hasDexVault rejected', () => {
  const result = run({
    hasRunlog: true,
    hasDexVault: 'true',
    isDirty: false
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Non-boolean isDirty rejected', () => {
  const result = run({
    hasRunlog: true,
    hasDexVault: true,
    isDirty: 'false'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing hasRunlog rejected', () => {
  const result = run({
    hasDexVault: true,
    isDirty: false
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing hasDexVault rejected', () => {
  const result = run({
    hasRunlog: true,
    isDirty: false
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing isDirty rejected', () => {
  const result = run({
    hasRunlog: true,
    hasDexVault: true
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
    hasRunlog: true,
    hasDexVault: false,
    isDirty: false
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    hasRunlog: true,
    hasDexVault: true,
    isDirty: false
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    hasRunlog: true,
    hasDexVault: true,
    isDirty: false
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L4.E06');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});

test('Re-run does not write files automatically', () => {
  const result = run({
    hasRunlog: true,
    hasDexVault: true,
    isDirty: false
  });

  assert.equal(result.ok, true);
  // note: effects array empty; caller handles re-run orchestration
  assert(Array.isArray(result.effects));
  assert.equal(result.effects.length, 0);
});
