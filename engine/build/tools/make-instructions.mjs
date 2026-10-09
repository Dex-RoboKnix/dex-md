#!/usr/bin/env node
// Pass 1: rename the 0.8 instructions (mof -> dex-vault, MoF.md -> dex.md). The section rewrites are made on the output by hand and
// recorded in src/instructions.edits.md, so re-running this script is only for a fresh start.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let t = fs.readFileSync(path.join(ROOT, 'base/src/instructions.md'), 'utf8').replace(/\r\n/g, '\n');
const out = path.join(ROOT, 'src/instructions.md');
if (fs.existsSync(out) && !process.argv.includes('--force')) { console.log('src/instructions.md exists (it holds hand edits). Use --force to start again.'); process.exit(0); }
const R = [
  ['MOF:INSTRUCTIONS:END', 'DEX:INSTRUCTIONS:END'], ['MOF:UNPACK', 'DEX:UNPACK'], ['MOF:END', 'DEX:END'], ['`MOF:`', '`DEX:`'], ['starting `MOF:`', 'starting `DEX:`'],
  ['# Dex MoF: Matter of Fact', '# Dex'], ['Dex MoF', 'Dex'], ['MoF.md', 'dex.md'], ['mof/', 'dex-vault/'], ['`mof`', '`dex-vault`'],
  ['name: dex-mof', 'name: dex-md'], ['version: 0.8', 'version: 0.9'],
];
for (const [a, b] of R) t = t.split(a).join(b);
t = t.replace(/\bMoF\b/g, 'Dex');
fs.mkdirSync(path.join(ROOT, 'src'), { recursive: true });
fs.writeFileSync(out, t);
console.log('wrote src/instructions.md', t.split('\n').length, 'lines; remaining "mof" (case-insens):', (t.match(/\bmof\b/gi) || []).length);
