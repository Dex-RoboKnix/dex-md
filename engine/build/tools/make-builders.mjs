#!/usr/bin/env node
// Rename mof -> dex-vault in the Folio builders and template (the vault tool is handled by make-vault.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['build_folio.mjs', 'build_folio.py', 'dex-folio.template.html'];
const R = [
  ['MOF:UNPACK', 'DEX:UNPACK'], ['MOF:END', 'DEX:END'], ['Dex MoF L1 / Dex Folio', 'Dex / Dex Folio'], ['Dex MoF L1', 'Dex'], ['Dex MoF', 'Dex'],
  ['MoF.md', 'dex.md'], ['mof review', 'dex review'], ['mof_version', 'dex_version'], ['mof/', 'dex-vault/'], ['MoF ', 'Dex '],
];
for (const f of files) {
  let t = fs.readFileSync(path.join(ROOT, 'base/src', f), 'utf8');
  for (const [a, b] of R) t = t.split(a).join(b);
  // what is left is the bare folder name (quoted names, comments, prose); the data marker MOF_DATA is internal and stays on both sides
  t = t.replace(/\bmof\b/g, 'dex-vault');
  // 0.9.0+: the template is installed from the dex-md clone, so the installed copy wins; dex.md no longer carries it
  const need = (a, b) => { if (!t.includes(a)) throw new Error(`${f}: not found: ${a.slice(0, 60)}`); t = t.split(a).join(b); };
  if (f === 'build_folio.mjs') {
    need("function template() {\n", "function template() {\n  if (fs.existsSync(TEMPLATE)) return fs.readFileSync(TEMPLATE, 'utf8');\n");
    need("Folio template not found. Keep dex.md in the folder that holds dex-vault/.", "Folio template not found in dex-vault/.dex/. Run the installer again (dex.md section 3).");
  }
  if (f === 'build_folio.py') {
    need('    pat = re.compile(', '    if TEMPLATE.is_file():\n        return TEMPLATE.read_text(encoding="utf-8")\n    pat = re.compile(');
    need("Folio template not found. Keep dex.md in the folder that holds dex-vault/.", "Folio template not found in dex-vault/.dex/. Run the installer again (dex.md section 3).");
  }
  fs.mkdirSync(path.join(ROOT, 'src'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'src', f), t);
  console.log(f, 'remaining mof:', (t.match(/\bmof\b/gi) || []).length, 'MOF_DATA kept:', (t.match(/MOF_/g) || []).length);
}
