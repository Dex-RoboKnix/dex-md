// Assembles MoF.md from src/: the instructions, then the packed assets the agent unpacks into mof/.dex/.
// Run from this folder: node pack.mjs. MoF.md is generated; edit src/ and pack again.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (n) => fs.readFileSync(path.join(here, 'src', n), 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '');
const assets = [
  ['vault.mjs', 'js'],
  ['build_folio.py', 'python'],
  ['build_folio.mjs', 'js'],
  ['dex-folio.template.html', 'html'], // last: it is the big one
];
const packed = assets.map(([name, lang]) => {
  const body = read(name);
  if (body.split('\n').includes('~~~')) throw new Error(`${name} contains a line that is exactly ~~~`);
  return `<!-- MOF:UNPACK ${name} -->\n~~~${lang}\n${body}\n~~~\n<!-- MOF:END ${name} -->`;
});
const out = `${read('instructions.md')}

<!-- MOF:INSTRUCTIONS:END -->

## Packed assets

Do not read or retype anything below this line. Section 9 unpacks these files into \`mof/.dex/\` with one small script.

${packed.join('\n\n')}
`;
fs.writeFileSync(path.join(here, 'MoF.md'), out);
console.log(`MoF.md written: ${out.split('\n').length} lines, ${Math.round(out.length / 1024)} KB, ${assets.length} packed assets.`);
