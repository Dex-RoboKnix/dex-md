#!/usr/bin/env node
// Copy the built engine (src/ and dist/ under engine/build) up into engine/, where install.mjs finds it.
// Run after bundle, make-vault and make-builders: npm run build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = path.dirname(BUILD);
const files = [
  ['src/vault.mjs', 'vault.mjs'],
  ['src/build_folio.mjs', 'build_folio.mjs'],
  ['src/build_folio.py', 'build_folio.py'],
  ['src/dex-folio.template.html', 'dex-folio.template.html'],
  ['dist/dex-lib.mjs', 'dex-lib.mjs'],
  ['dist/modules.json', 'modules.json'],
];
for (const [from, to] of files) fs.copyFileSync(path.join(BUILD, from), path.join(ENGINE, to));
console.log(`Released ${files.length} files into ${ENGINE}`);
