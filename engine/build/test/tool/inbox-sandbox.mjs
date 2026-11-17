// Shared by the inbox and answer tests: a sandbox laid out as dex-vault/.dex/ with the built tool, and GitHub stubbed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Runs the built vault tool from a sandbox laid out as dex-vault/.dex/, with GitHub stubbed: DEX_GH points at a small
// script that answers the three gh calls inbox makes from a scenario file beside it.
const BUILD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TOOL = path.join(BUILD, 'src', 'vault.mjs');
const LIB = path.join(BUILD, 'dist', 'dex-lib.mjs');
export const STUB = `import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync(new URL('./scenario.json', import.meta.url), 'utf8'));
const a = process.argv.slice(2);
const out = (t) => { process.stdout.write(t + '\\n'); process.exit(0); };
const fail = (t) => { process.stderr.write(t + '\\n'); process.exit(1); };
if (a[0] === 'api' && a[1] === 'user') { if (!s.login) fail('You are not logged into any GitHub hosts. To log in, run: gh auth login'); out(s.login); }
if (a[0] === 'repo' && a[1] === 'view') { if (!s.repo) fail('no git remotes found'); out(s.repo); }
if (a[0] === 'issue' && a[1] === 'view') {
  if (s.delayMs) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, s.delayMs);
  fs.appendFileSync(new URL('./calls.log', import.meta.url), a.join(' ') + '\\n');
  const issue = s.issues[a[2]];
  if (!issue) fail('GraphQL: Could not resolve to an issue or pull request with the number of ' + a[2] + '.');
  out(JSON.stringify({ comments: issue }));
}
fail('stub: unexpected call ' + a.join(' '));
`;
export const URL = (n) => `https://github.com/acme/vault/issues/115#issuecomment-${n}`;
export const comment = (n, over = {}) => ({ id: `IC_${n}`, url: URL(n), author: { login: 'owner' }, body: 'Yes: phase 2 first.', createdAt: '2026-11-17T11:00:00Z', ...over });

export function sandbox(scenario) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dex-inbox-'));
  const vaultDir = path.join(root, 'dex-vault');
  const dex = path.join(vaultDir, '.dex');
  fs.mkdirSync(dex, { recursive: true });
  fs.copyFileSync(TOOL, path.join(dex, 'vault.mjs'));
  fs.copyFileSync(LIB, path.join(dex, 'dex-lib.mjs'));
  const ghDir = path.join(root, 'gh');
  fs.mkdirSync(ghDir);
  fs.writeFileSync(path.join(ghDir, 'gh.mjs'), STUB);
  const setScenario = (s) => fs.writeFileSync(path.join(ghDir, 'scenario.json'), JSON.stringify({ login: 'owner', repo: 'acme/vault', issues: {}, ...s }));
  setScenario(scenario || {});
  const env = (gh = path.join(ghDir, 'gh.mjs')) => ({ ...process.env, DEX_GH: gh });
  const vault = (args, gh) => spawnSync(process.execPath, [path.join(dex, 'vault.mjs'), ...args], { encoding: 'utf8', env: env(gh) });
  const events = path.join(vaultDir, '07_inbox', 'events');
  const list = () => (fs.existsSync(events) ? fs.readdirSync(events).sort() : []);
  const lock = path.join(dex, 'state', 'inbox.lock');
  const park = (...extra) => {
    const r = vault(['park', '--skill', 'dex-loop', '--issue', '115', '--question', 'Which phase first?', '--now', '2026-11-17T10:00:00.000Z', ...extra]);
    assert.equal(r.status, 0, r.stderr);
  };
  return { root, vaultDir, dex, ghDir, vault, events, list, lock, park, setScenario, env };
}
