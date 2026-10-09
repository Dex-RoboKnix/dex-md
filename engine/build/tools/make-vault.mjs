#!/usr/bin/env node
// Build src/vault.mjs (the Dex vault tool) from the 0.8 base tool: rename mof to dex-vault, then add the Dex commands.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let v = fs.readFileSync(path.join(ROOT, 'base/src/vault.mjs'), 'utf8').replace(/\r\n/g, '\n');
const add = fs.readFileSync(path.join(ROOT, 'src/vault-additions.js'), 'utf8').replace(/\r\n/g, '\n');

const swap = (a, b, all = true) => { if (!v.includes(a)) console.log('not found:', a.slice(0, 50)); v = all ? v.split(a).join(b) : v.replace(a, b); };
swap('Dex MoF vault tool', 'Dex vault tool');
swap('MoF.md', 'dex.md');
swap('mof/.dex', 'dex-vault/.dex');
swap('inside mof/.', 'inside dex-vault/.');
swap('// mof\n', '// dex-vault\n');
swap(' mof/.dex/backup', ' dex-vault/.dex/backup');
v = v.replace(/\bmof\/(?!\.dex)/g, 'dex-vault/');
swap("import { fileURLToPath } from 'node:url';", "import { fileURLToPath, pathToFileURL } from 'node:url';", false);
// header: document the new commands
swap('// Paths come from this file\'s location', [
  '//   node dex-vault/.dex/vault.mjs modules',
  '//        list the bundled Dex modules (pure functions) with the node each serves and the input each expects.',
  '//   node dex-vault/.dex/vault.mjs run <module> --json \'{...}\'   (or --input file.json)',
  '//        run one bundled module and print its JSON result. Modules never write; they return what should be written.',
  '//   node dex-vault/.dex/vault.mjs classify [folder]',
  '//        list a folder\'s top level (names only) and classify it: blank, blank-with-context or in-flight; lists secret-class files.',
  '//   node dex-vault/.dex/vault.mjs checkpoint [--skill <name>] [--summary "<text>"] [--chapter "<text>"] [--now <ISO>]',
  '//        close a skill: fold, coverage, RUNLOG row, story chapter, then the vault check. Never applies a node change.',
  '//',
  '// Paths come from this file\'s location',
].join('\n'), false);
// main: register the new commands and make the dispatcher async-safe
const mainAt = v.indexOf('// ---- main');
if (mainAt < 0) throw new Error('main section not found');
v = v.slice(0, mainAt) + add + '\n' + v.slice(mainAt);
swap('const commands = { scaffold, place, adapt, fold, check, migrate };', 'const commands = { scaffold, place, adapt, fold, check, migrate, modules: modulesCmd, run: runCmd, classify: classifyCmd, checkpoint: checkpointCmd };', false);
swap("<scaffold|place|adapt|fold|check|migrate>", "<scaffold|place|adapt|fold|check|migrate|modules|run|classify|checkpoint>", false);
swap('commands[cmd](a);', 'Promise.resolve(commands[cmd](a)).catch((e) => die(`Error: ${e.message}`));', false);
fs.writeFileSync(path.join(ROOT, 'src/vault.mjs'), v);
console.log('wrote src/vault.mjs', v.split('\n').length, 'lines; remaining "mof" mentions:', (v.match(/\bmof\b/gi) || []).length);
