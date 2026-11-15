import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Runs the built vault tool, with the engine library beside it, from a sandbox laid out as dex-vault/.dex/.
const BUILD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TOOL = path.join(BUILD, 'src', 'vault.mjs');
const LIB = path.join(BUILD, 'dist', 'dex-lib.mjs');
function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dex-park-'));
  const vaultDir = path.join(root, 'dex-vault');
  const dex = path.join(vaultDir, '.dex');
  fs.mkdirSync(dex, { recursive: true });
  fs.copyFileSync(TOOL, path.join(dex, 'vault.mjs'));
  fs.copyFileSync(LIB, path.join(dex, 'dex-lib.mjs'));
  const held = path.join(vaultDir, '07_inbox', 'held');
  const vault = (...a) => spawnSync(process.execPath, [path.join(dex, 'vault.mjs'), ...a], { encoding: 'utf8' });
  return { root, vaultDir, dex, held, vault };
}

test('park writes a tracked held file with a DEX838 line, and resume gives the same question back', () => {
  const { held, vault } = sandbox();
  const p = vault('park', '--skill', 'dex-loop', '--issue', '92', '--question', 'Do I start the build now?', '--thought', 'dex-sprint differs from dex-loop');
  assert.equal(p.status, 0, p.stderr);
  const file = path.join(held, 'dex-loop-92.md');
  assert.ok(fs.existsSync(file));
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /^dex\(dex-loop, @issue:92,held:dex-loop-92\)\["Do I start the build now\?"\]$/m);
  assert.match(text, /^status: held$/m);
  assert.match(text, /^Readable: /m);
  const r = vault('resume', '--skill', 'dex-loop');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Held: dex-loop #92/);
  assert.match(r.stdout, /Question: Do I start the build now\?/);
  assert.match(r.stdout, /Thought: dex-sprint differs from dex-loop/);
});

test('several questions are held at once, and resume lists them oldest first', () => {
  const { held, vault } = sandbox();
  vault('park', '--skill', 'dex-grill', '--issue', '115', '--question', 'grill question', '--now', '2026-11-15T10:00:00.000Z');
  vault('park', '--skill', 'dex-spec', '--question', 'spec question', '--now', '2026-11-15T09:00:00.000Z');
  assert.deepEqual(fs.readdirSync(held).sort(), ['dex-grill-115.md', 'dex-spec.md']);
  const r = vault('resume');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.indexOf('spec question') < r.stdout.indexOf('grill question'), r.stdout);
});

test('held files are not covered by the gitignore dex.md writes, so a fresh clone sees them', () => {
  const { root, vaultDir, vault } = sandbox();
  fs.writeFileSync(path.join(vaultDir, '.gitignore'), '.dex/dex-md/\n.dex/dexspine/\n.dex/backup/\n.dex/state/\n.shadowos/\n');
  vault('park', '--skill', 'dex-loop', '--issue', '115', '--question', 'Which slice first?');
  const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8' });
  git(vaultDir, 'init', '-q');
  git(vaultDir, 'add', '-A');
  assert.match(git(vaultDir, 'ls-files', '--cached'), /07_inbox\/held\/dex-loop-115\.md/);
  git(vaultDir, '-c', 'user.email=t@users.noreply.github.com', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'held');
  const clone = path.join(root, 'clone');
  execFileSync('git', ['clone', '-q', vaultDir, clone]);
  fs.mkdirSync(path.join(clone, '.dex'), { recursive: true });
  fs.copyFileSync(TOOL, path.join(clone, '.dex', 'vault.mjs'));
  fs.copyFileSync(LIB, path.join(clone, '.dex', 'dex-lib.mjs'));
  const r = spawnSync(process.execPath, [path.join(clone, '.dex', 'vault.mjs'), 'resume'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Question: Which slice first\?/);
});

test('a held line that does not parse waits for the owner and is not acted on', () => {
  const { held, vault } = sandbox();
  vault('park', '--skill', 'dex-loop', '--question', 'fine');
  const f = path.join(held, 'dex-loop.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('@held:dex-loop', '@held:dex-loop,held:twice'));
  const r = vault('resume');
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /Waiting for the owner: 07_inbox\/held\/dex-loop\.md: its DEX838 line does not parse \(Duplicate context key: held\)\. Not acted on\./);
  assert.doesNotMatch(r.stdout, /Question: fine/);
});

test('a question that cannot be a DEX838 line is refused with a plain message, and nothing is written', () => {
  const { held, vault } = sandbox();
  const p = vault('park', '--skill', 'dex-loop', '--question', 'keep dex[this open');
  assert.notEqual(p.status, 0);
  assert.match(p.stderr, /cannot be held as a DEX838 line/);
  assert.ok(!fs.existsSync(held) || fs.readdirSync(held).length === 0);
});

test('resume with nothing held says so', () => {
  const { vault } = sandbox();
  const r = vault('resume');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'nothing held');
});

test('park refuses without a skill or a question, and refuses a path-like skill name, issue or repo', () => {
  const { dex, held, vault } = sandbox();
  assert.notEqual(vault('park', '--question', 'x').status, 0);
  assert.notEqual(vault('park', '--skill', 'dex-loop').status, 0);
  const evil = vault('park', '--skill', '../evil', '--question', 'x');
  assert.notEqual(evil.status, 0);
  assert.match(evil.stderr, /lowercase letters, digits and dashes/);
  assert.match(vault('park', '--skill', 'dex-loop', '--issue', '../1', '--question', 'x').stderr, /An issue is a number/);
  assert.match(vault('park', '--skill', 'dex-loop', '--repo', 'a/b)c', '--question', 'x').stderr, /A repo is written owner\/name/);
  assert.ok(!fs.existsSync(held) || fs.readdirSync(held).length === 0, 'a refused park wrote a file');
  assert.ok(!fs.existsSync(path.join(dex, 'evil.json')));
});

test('parking again for the same skill and issue replaces the held question', () => {
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

test('a held place from before 0.12 moves from .dex/state into held/ once', () => {
  const { dex, held, vault } = sandbox();
  fs.mkdirSync(path.join(dex, 'state'), { recursive: true });
  fs.writeFileSync(path.join(dex, 'state', 'dex-loop.json'), JSON.stringify({ skill: 'dex-loop', issue: '111', question: 'Watch cut 2?', thought: 'later', parked: '2026-11-11T02:25:12.775Z' }));
  const r = vault('resume');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Moved the held question for dex-loop from \.dex\/state\/ into 07_inbox\/held\//);
  assert.match(r.stdout, /Held: dex-loop #111 \(parked 2026-11-11T02:25:12\.775Z\)/);
  assert.ok(fs.existsSync(path.join(held, 'dex-loop-111.md')));
  assert.ok(!fs.existsSync(path.join(dex, 'state', 'dex-loop.json')));
  assert.doesNotMatch(vault('resume').stdout, /Moved/);
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
