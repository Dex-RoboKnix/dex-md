#!/usr/bin/env node
// Sensitive-data scan of every tracked file and of commit author/committer emails. Run before every push: npm run scan
// Exit 1 with a list of hits; exit 0 when clean. Lists file names and line numbers only, never the matched text.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' });
let top = '';
try { top = git('rev-parse', '--show-toplevel').trim(); } catch { /* not a repo */ }
if (path.resolve(top) !== REPO) { console.log(`not a git repo of its own: ${REPO} (git init first; never scan a parent repo)`); process.exit(1); }
const PATTERNS = [
  ['personal email', /[A-Za-z0-9._%+-]+@(gmail|googlemail|me|icloud|hotmail|outlook|yahoo)\.com\b/i],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Anthropic key', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['GitHub token', /\b(ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}/],
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/],
  ['AWS key', /AKIA[0-9A-Z]{16}/],
];
const SECRET_FILE = /(^|\/)(\.env(\..*)?|id_rsa|id_ed25519|credentials\.[a-z]+|.*\.pem|.*\.key)$/i;
const hits = [];
for (const f of git('ls-files').split('\n').filter(Boolean)) {
  if (SECRET_FILE.test(f)) { hits.push(`${f}: secret-class file is tracked`); continue; }
  const text = fs.readFileSync(path.join(REPO, f), 'utf8');
  text.split('\n').forEach((line, i) => { for (const [name, re] of PATTERNS) if (re.test(line)) hits.push(`${f}:${i + 1}: ${name}`); });
}
let emails = [];
try { emails = [...new Set(git('log', '--all', '--format=%ae%n%ce').split('\n').filter(Boolean))]; } catch { /* no commits yet */ }
for (const e of emails) if (!/@users\.noreply\.github\.com$|^noreply@github\.com$/.test(e)) hits.push(`commit metadata: a non-noreply address is in history`);
if (hits.length) { console.log([...new Set(hits)].join('\n')); console.log(`\n${hits.length} hit(s). Do not push.`); process.exit(1); }
console.log('scan clean');
