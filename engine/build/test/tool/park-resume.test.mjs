import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Runs the built vault tool from a sandbox laid out as dex-vault/.dex/vault.mjs.
const TOOL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/vault.mjs');
function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dex-park-'));
  const dex = path.join(root, 'dex-vault', '.dex');
  fs.mkdirSync(dex, { recursive: true });
  fs.copyFileSync(TOOL, path.join(dex, 'vault.mjs'));
  const vault = (...a) => spawnSync(process.execPath, [path.join(dex, 'vault.mjs'), ...a], { encoding: 'utf8' });
  return { dex, vault };
}

test('park then resume gives the same question back', () => {
  const { dex, vault } = sandbox();
  const p = vault('park', '--skill', 'dex-loop', '--issue', '92', '--question', 'Do I start the build now?', '--thought', 'dex-sprint differs from dex-loop');
  assert.equal(p.status, 0, p.stderr);
  assert.ok(fs.existsSync(path.join(dex, 'state', 'dex-loop.json')));
  const r = vault('resume', '--skill', 'dex-loop');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Held: dex-loop #92/);
  assert.match(r.stdout, /Question: Do I start the build now\?/);
  assert.match(r.stdout, /Thought: dex-sprint differs from dex-loop/);
});

test('resume with nothing held says so', () => {
  const { vault } = sandbox();
  const r = vault('resume');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'nothing held');
});

test('park refuses without a skill or a question, and refuses a path-like skill name', () => {
  const { vault } = sandbox();
  assert.notEqual(vault('park', '--question', 'x').status, 0);
  assert.notEqual(vault('park', '--skill', 'dex-loop').status, 0);
  assert.notEqual(vault('park', '--skill', '../evil', '--question', 'x').status, 0);
});
