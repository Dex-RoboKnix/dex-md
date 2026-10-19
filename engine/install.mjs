#!/usr/bin/env node
// Dex installer (Node 18 or later, no packages). Run from the folder that holds dex.md, after the pinned clone:
//   node dex-vault/.dex/dex-md/engine/install.mjs
// Copies the engine, the seven dex skills, the CLAUDE.md template and the promote issue template from the clone into dex-vault/.dex/.
// Writes only inside dex-vault/.dex/. Never places skills in .claude/skills/ (that is Stage 4b, on the owner's yes).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENGINE = path.dirname(fileURLToPath(import.meta.url));
const CLONE = path.dirname(ENGINE);
const DEX = path.dirname(CLONE);
if (path.basename(DEX) !== '.dex' || path.basename(path.dirname(DEX)) !== 'dex-vault') {
  console.error(`install.mjs must run from a clone at dex-vault/.dex/dex-md/ (found ${CLONE})`);
  process.exit(1);
}
const files = [
  ['engine/vault.mjs', 'vault.mjs'],
  ['engine/dex-lib.mjs', 'dex-lib.mjs'],
  ['engine/build_folio.mjs', 'build_folio.mjs'],
  ['engine/build_folio.py', 'build_folio.py'],
  ['engine/dex-folio.template.html', 'dex-folio.template.html'],
  ['templates/dex-claude.md', 'dex-claude.md'],
  ['templates/promote-issue.md', 'promote-issue.md'],
  ...['dex-grill', 'dex-spec', 'dex-implement', 'dex-review', 'dex-checkpoint', 'dex-loop', 'dex-sprint'].map((s) => [`skills/${s}.md`, `skills/${s}.md`]),
];
const missing = files.filter(([from]) => !fs.existsSync(path.join(CLONE, from)));
if (missing.length) { console.error('missing in the clone: ' + missing.map(([f]) => f).join(', ')); process.exit(1); }
for (const [from, to] of files) {
  const out = path.join(DEX, to);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(path.join(CLONE, from), out);
}
console.log(`Installed ${files.length} files into ${DEX}`);
