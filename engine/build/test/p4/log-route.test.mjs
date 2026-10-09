import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/log-route.mjs';

test('T09.1 - Log paths follow <vault-root>/logs/phase-<N>/<kind>/<theme-id>/ structure', (t) => {
  const result = run({
    logKind: 'grill',
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  });

  assert.equal(result.ok, true);
  assert(result.directoryPath.includes('/vault/logs/phase-4/grill/T01'));
});

test('T09.2 - Each log kind routes to its own directory tree', (t) => {
  const kinds = ['grill', 'reasoning', 'output', 'review'];

  kinds.forEach(kind => {
    const result = run({
      logKind: kind,
      phaseNumber: 4,
      vaultRoot: '/vault',
      agentId: 'agent-001',
      themeId: 'T01',
      attemptNumber: 1
    });

    assert.equal(result.ok, true);
    assert(result.directoryPath.includes(`/${kind}/`));
  });
});

test('T09.3 - Multiple agents writing for same theme create separate numbered files', (t) => {
  const result1 = run({
    logKind: 'reasoning',
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  });

  const result2 = run({
    logKind: 'reasoning',
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-002',
    themeId: 'T01',
    attemptNumber: 1
  });

  assert.equal(result1.ok, true);
  assert.equal(result2.ok, true);
  assert(result1.filename.includes('agent-001'));
  assert(result2.filename.includes('agent-002'));
  assert.notEqual(result1.filename, result2.filename);
});

test('T09.4 - Directory structure created on demand when first log written', (t) => {
  const result = run({
    logKind: 'output',
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T02',
    attemptNumber: 1
  });

  assert.equal(result.ok, true);
  assert(Array.isArray(result.effects));
  // Effects include .gitkeep to ensure directory is created
  assert(result.effects.some(e => e.path.includes('.gitkeep')));
});

test('T09.5 - Concurrent writes use separate files to avoid locking conflicts', (t) => {
  const results = [];
  for (let i = 1; i <= 3; i++) {
    const result = run({
      logKind: 'review',
      phaseNumber: 4,
      vaultRoot: '/vault',
      agentId: `agent-${i.toString().padStart(3, '0')}`,
      themeId: 'T01',
      attemptNumber: 1
    });
    results.push(result);
  }

  // All succeeded
  results.forEach(r => assert.equal(r.ok, true));

  // All have different filenames
  const filenames = results.map(r => r.filename);
  const uniqueFilenames = new Set(filenames);
  assert.equal(uniqueFilenames.size, 3);
});

test('T09 - Different phases create separate directory trees', (t) => {
  const result1 = run({
    logKind: 'grill',
    phaseNumber: 3,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  });

  const result2 = run({
    logKind: 'grill',
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  });

  assert.equal(result1.ok, true);
  assert.equal(result2.ok, true);
  assert(result1.directoryPath.includes('phase-3'));
  assert(result2.directoryPath.includes('phase-4'));
});

test('T09 - Different themes create separate directories', (t) => {
  const result1 = run({
    logKind: 'reasoning',
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  });

  const result2 = run({
    logKind: 'reasoning',
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T02',
    attemptNumber: 1
  });

  assert.equal(result1.ok, true);
  assert.equal(result2.ok, true);
  assert(result1.directoryPath.includes('T01'));
  assert(result2.directoryPath.includes('T02'));
});

test('T09 - Empty input rejected', (t) => {
  const result = run({});
  assert.equal(result.ok, false);
  assert(result.error);
});

test('T09 - Null input rejected', (t) => {
  const result = run(null);
  assert.equal(result.ok, false);
});

test('T09 - Malformed input: missing logKind', (t) => {
  const result = run({
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('logKind'));
});

test('T09 - Malformed input: missing phaseNumber', (t) => {
  const result = run({
    logKind: 'grill',
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('phaseNumber'));
});

test('T09 - Malformed input: missing vaultRoot', (t) => {
  const result = run({
    logKind: 'grill',
    phaseNumber: 4,
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('vaultRoot'));
});

test('T09 - Malformed input: missing agentId', (t) => {
  const result = run({
    logKind: 'grill',
    phaseNumber: 4,
    vaultRoot: '/vault',
    themeId: 'T01',
    attemptNumber: 1
  });
  assert.equal(result.ok, false);
  assert(result.error.includes('agentId'));
});

test('T09 - No mutation of input', (t) => {
  const input = {
    logKind: 'grill',
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  };
  const inputCopy = JSON.stringify(input);

  run(input);

  assert.equal(JSON.stringify(input), inputCopy);
});

test('T09 - Same input produces same output twice', (t) => {
  const input = {
    logKind: 'grill',
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  };

  const result1 = run(input);
  const result2 = run(input);

  assert.deepEqual(result1, result2);
});

test('T09 - Trace includes node and steps', (t) => {
  const result = run({
    logKind: 'grill',
    phaseNumber: 4,
    vaultRoot: '/vault',
    agentId: 'agent-001',
    themeId: 'T01',
    attemptNumber: 1
  });

  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L1.E04');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
