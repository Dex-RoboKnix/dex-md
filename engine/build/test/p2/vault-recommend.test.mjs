import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/vault-recommend.mjs';

const P = '/home/user/projects';

test('T05.1 blank folder: recommendation is the parent folder', () => {
  const r = run({ folderState: 'blank', parentFolder: P });
  assert.equal(r.ok, true);
  assert.equal(r.recommendation, P);
  assert.equal(r.final, false);
});

test('T05.1b blank-with-context folder: recommendation is the parent folder', () => {
  assert.equal(run({ folderState: 'blank-with-context', parentFolder: P }).recommendation, P);
});

test('T05.2 stuck and in-flight folders: recommendation is a dex-vault folder in the parent', () => {
  assert.equal(run({ folderState: 'stuck', parentFolder: P }).recommendation, `${P}/dex-vault`);
  assert.equal(run({ folderState: 'in-flight', parentFolder: P }).recommendation, `${P}/dex-vault`);
});

test('T05.3 the final choice is the human and needs an explicit yes', () => {
  const r = run({ folderState: 'in-flight', parentFolder: P, human: { choice: 'parent', yes: true }, now: '2026-10-09T10:00:00Z' });
  assert.equal(r.ok, true);
  assert.equal(r.choice, P); // the human overrode the recommendation
  assert.equal(r.recommendation, `${P}/dex-vault`);
  assert.equal(r.final, true);
  assert.equal(r.audit.event, 'vault-location-chosen');
  assert.equal(r.audit.decidedBy, 'human');
  assert.equal(r.audit.at, '2026-10-09T10:00:00Z');
  assert.equal(r.effects[0].kind, 'append-log');
  assert.equal(run({ folderState: 'blank', parentFolder: P, human: { choice: 'parent', yes: false } }).ok, false);
  assert.equal(run({ folderState: 'blank', parentFolder: P, human: { choice: 'elsewhere', yes: true } }).ok, false);
});

test('T05.3b a previous choice is honoured on a re-run', () => {
  const r = run({ folderState: 'blank', parentFolder: P, previousChoice: 'dex-vault' });
  assert.equal(r.choice, `${P}/dex-vault`);
  assert.equal(r.decidedBy, 'previous-choice-honoured');
  assert.equal(r.final, true);
});

test('T05.4 a legacy mof folder is rejected with a migration note', () => {
  const r = run({ folderState: 'in-flight', parentFolder: P, existingFolders: ['docs', 'mof'] });
  assert.equal(r.ok, true);
  assert.equal(r.legacy.rejected, 'mof');
  assert.match(r.legacy.migrationNote, /copy, never move/);
  assert.notEqual(r.choice, `${P}/mof`);
  assert.equal(run({ folderState: 'in-flight', parentFolder: P, existingFolders: ['docs'] }).legacy, null);
});

test('malformed input is rejected', () => {
  for (const bad of [undefined, null, 5, '', [], {}, { folderState: 'unknown', parentFolder: P }, { folderState: 'blank' }, { folderState: 'blank', parentFolder: '' },
    { folderState: 'blank', parentFolder: P, existingFolders: 'mof' }, { folderState: 'blank', parentFolder: P, previousChoice: 'x' }]) {
    const r = run(bad);
    assert.equal(r.ok, false);
    assert.equal(typeof r.error, 'string');
  }
});

test('no mutation and same output twice', () => {
  const input = { folderState: 'in-flight', parentFolder: P, existingFolders: ['mof'], now: '2026-10-09T10:00:00Z' };
  const copy = JSON.parse(JSON.stringify(input));
  const a = run(input), b = run(input);
  assert.deepEqual(input, copy);
  assert.deepEqual(a, b);
});

test('audit carries input.now, or null when absent', () => {
  assert.equal(run({ folderState: 'blank', parentFolder: P, now: '2026-10-09T12:34:56Z' }).audit.at, '2026-10-09T12:34:56Z');
  assert.equal(run({ folderState: 'blank', parentFolder: P }).audit.at, null);
});

test('trace carries the node and steps', () => {
  const r = run({ folderState: 'blank', parentFolder: P });
  assert.equal(r.trace.node, 'L1.E01');
  assert.ok(r.trace.steps.length > 0);
});
