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
  const { dex, vault } = sandbox();
  assert.notEqual(vault('park', '--question', 'x').status, 0);
  assert.notEqual(vault('park', '--skill', 'dex-loop').status, 0);
  const evil = vault('park', '--skill', '../evil', '--question', 'x');
  assert.notEqual(evil.status, 0);
  assert.match(evil.stderr, /lowercase letters, digits and dashes/);
  assert.ok(!fs.existsSync(path.join(dex, 'state')) || fs.readdirSync(path.join(dex, 'state')).length === 0, 'a refused park wrote a file');
  assert.ok(!fs.existsSync(path.join(dex, 'evil.json')));
});

test('parking again replaces the held question', () => {
  const { vault } = sandbox();
  vault('park', '--skill', 'dex-grill', '--question', 'first');
  vault('park', '--skill', 'dex-grill', '--question', 'second');
  const r = vault('resume', '--skill', 'dex-grill');
  assert.match(r.stdout, /Question: second/);
  assert.doesNotMatch(r.stdout, /first/);
});

test('resume --skill shows only that skill', () => {
  const { vault } = sandbox();
  vault('park', '--skill', 'dex-grill', '--question', 'grill question');
  vault('park', '--skill', 'dex-spec', '--question', 'spec question');
  const r = vault('resume', '--skill', 'dex-spec');
  assert.match(r.stdout, /spec question/);
  assert.doesNotMatch(r.stdout, /grill question/);
});

test('a broken state file gives a clear message, not a crash', () => {
  const { dex, vault } = sandbox();
  fs.mkdirSync(path.join(dex, 'state'), { recursive: true });
  fs.writeFileSync(path.join(dex, 'state', 'dex-loop.json'), '{ not json');
  const r = vault('resume');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /state\/dex-loop\.json: it is not valid JSON/);
  assert.doesNotMatch(r.stderr, /SyntaxError|\n\s+at /);
});
