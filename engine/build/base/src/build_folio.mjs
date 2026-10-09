#!/usr/bin/env node
// Dex Folio builder for Dex MoF L1 (Node 18 or later, no packages). Unpacked from MoF.md into mof/.dex/
//   node mof/.dex/build_folio.mjs            copy the template out of MoF.md, build mof/dex-folio.html, take a snapshot
//   node mof/.dex/build_folio.mjs --changes  list what changed since the last snapshot (no build)
// Paths come from this script's own location (mof/.dex/), so it works from any folder.
// The vault is the source of truth: rebuild after every change and never edit the HTML by hand.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const VERSION = '0.8';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.dirname(HERE);
const ROOT = path.dirname(VAULT);
const TEMPLATE = path.join(HERE, 'dex-folio.template.html');
const OUT = path.join(VAULT, 'dex-folio.html');
const SNAP = path.join(HERE, 'snapshot.json');
const MARKER = '/*__MOF_' + 'DATA__*/null';
const START = '<!-- MOF:UNPACK ' + 'dex-folio.template.html -->';
const END = '<!-- MOF:END ' + 'dex-folio.template.html -->';
const HASH_LIMIT = 5 * 1024 * 1024;
const rel = (base, p) => path.relative(base, p).split(path.sep).join('/');
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

function template() {
  const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pat = new RegExp(reEsc(START) + '\\r?\\n~~~[a-z]*\\r?\\n([\\s\\S]*?)\\r?\\n~~~\\r?\\n' + reEsc(END));
  const mds = fs.readdirSync(ROOT).filter(n => /\.md$/i.test(n)).sort((a, b) => (a !== 'MoF.md') - (b !== 'MoF.md') || (a < b ? -1 : a > b ? 1 : 0));
  for (const n of mds) { const m = fs.readFileSync(path.join(ROOT, n), 'utf8').match(pat); if (m) { const text = m[1].replace(/\r\n/g, '\n') + '\n'; fs.writeFileSync(TEMPLATE, text); return text; } }
  if (fs.existsSync(TEMPLATE)) return fs.readFileSync(TEMPLATE, 'utf8');
  console.error('Folio template not found. Keep MoF.md in the folder that holds mof/.'); process.exit(1);
}
function scan() {
  const files = {};
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort(byName)) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.isFile()) continue;
      const r = rel(ROOT, p); if (r === 'mof/dex-folio.html') continue;
      const st = fs.statSync(p); const entry = { size: st.size, mtime: Math.floor(st.mtimeMs / 1000) };
      if (st.size <= HASH_LIMIT) entry.sha256 = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
      files[r] = entry;
    }
  };
  walk(ROOT);
  return files;
}
const sig = e => e.sha256 || `${e.size}:${e.mtime}`;

function changes() {
  if (!fs.existsSync(SNAP)) { console.log('No snapshot yet. Build the Folio once to take one.'); return; }
  const old = JSON.parse(fs.readFileSync(SNAP, 'utf8')); const before = old.files || {}, now = scan();
  const added = Object.keys(now).filter(k => !(k in before)).sort();
  const removed = Object.keys(before).filter(k => !(k in now)).sort();
  const changed = Object.keys(now).filter(k => k in before && sig(now[k]) !== sig(before[k])).sort();
  const inside = k => k.startsWith('mof/');
  console.log(`Changes since the snapshot taken ${old.taken || '?'}`);
  for (const [title, keep] of [['The material (outside mof/)', k => !inside(k)], ['Inside mof/ since the last build (usually human edits)', inside]]) {
    const rows = [...added.filter(keep).map(k => ['added', k]), ...changed.filter(keep).map(k => ['changed', k]), ...removed.filter(keep).map(k => ['removed', k])];
    console.log(`\n${title}: ${rows.length || 'none'}`);
    for (const [kind, k] of rows) console.log(`  ${kind.padEnd(8)} ${k}`);
  }
}

function build() {
  const html = template();
  const files = {};
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort(byName)) {
      if (e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!/^03_spine\/L\d_[^/]+$/.test(rel(VAULT, p))) walk(p); } // node folders: the flat layer files carry them for the Folio
      else if (/\.md$/i.test(e.name)) files[rel(VAULT, p)] = fs.readFileSync(p, 'utf8');
    }
  };
  walk(VAULT);
  const stamp = new Date().toISOString().slice(0, 19);
  const payload = { meta: { built: stamp, builder: `build_folio.mjs ${VERSION}`, files: Object.keys(files).length }, files };
  const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
  const data = JSON.stringify(payload).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\u0021--').split(LS).join('\\u2028').split(PS).join('\\u2029');
  if (html.split(MARKER).length !== 2) { console.error('Template marker not found exactly once. Check that MoF.md is the full, unedited file.'); process.exit(1); }
  fs.writeFileSync(OUT, html.replace(MARKER, () => data));
  fs.writeFileSync(SNAP, JSON.stringify({ taken: stamp, version: VERSION, files: scan() }));
  console.log(`Dex Folio written: ${OUT} (${Object.keys(files).length} markdown files, ${Math.round(fs.statSync(OUT).size / 1024)} KB). Snapshot taken.`);
}

if (process.argv.slice(2).includes('--changes')) changes(); else build();
