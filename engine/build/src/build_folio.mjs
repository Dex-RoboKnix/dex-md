#!/usr/bin/env node
// Dex Folio builder for Dex (Node 18 or later, no packages). Unpacked from dex.md into dex-vault/.dex/
//   node dex-vault/.dex/build_folio.mjs            copy the template out of dex.md, build dex-vault/dex-folio.html, take a snapshot
//   node dex-vault/.dex/build_folio.mjs --changes  list what changed since the last snapshot (no build)
// Paths come from this script's own location (dex-vault/.dex/), so it works from any folder.
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
const START = '<!-- DEX:UNPACK ' + 'dex-folio.template.html -->';
const END = '<!-- DEX:END ' + 'dex-folio.template.html -->';
const HASH_LIMIT = 5 * 1024 * 1024;
const rel = (base, p) => path.relative(base, p).split(path.sep).join('/');
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

function template() {
  if (fs.existsSync(TEMPLATE)) return fs.readFileSync(TEMPLATE, 'utf8');
  const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pat = new RegExp(reEsc(START) + '\\r?\\n~~~[a-z]*\\r?\\n([\\s\\S]*?)\\r?\\n~~~\\r?\\n' + reEsc(END));
  const mds = fs.readdirSync(ROOT).filter(n => /\.md$/i.test(n)).sort((a, b) => (a !== 'dex.md') - (b !== 'dex.md') || (a < b ? -1 : a > b ? 1 : 0));
  for (const n of mds) { const m = fs.readFileSync(path.join(ROOT, n), 'utf8').match(pat); if (m) { const text = m[1].replace(/\r\n/g, '\n') + '\n'; fs.writeFileSync(TEMPLATE, text); return text; } }
  if (fs.existsSync(TEMPLATE)) return fs.readFileSync(TEMPLATE, 'utf8');
  console.error('Folio template not found in dex-vault/.dex/. Run the installer again (dex.md section 3).'); process.exit(1);
}
function scan() {
  const files = {};
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort(byName)) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.isFile()) continue;
      const r = rel(ROOT, p); if (r === 'dex-vault/dex-folio.html') continue;
      const st = fs.statSync(p); const entry = { size: st.size, mtime: Math.floor(st.mtimeMs / 1000) };
      if (st.size <= HASH_LIMIT) entry.sha256 = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
      files[r] = entry;
    }
  };
  walk(ROOT);
  return files;
}
const sig = e => e.sha256 || `${e.size}:${e.mtime}`;

// ---- plain view: every note as static HTML, for viewers that never run scripts (iPhone file previews, in-app browsers) ----
const STATIC = '<!--__STATIC__-->';
const escH = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function inlineMd(s) {
  const codes = [];
  const t = escH(s).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`)
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => `<b>${b || a}</b>`)
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[+i]}</code>`);
}
function tableHtml(rows) {
  const cells = r => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  const [head, ...rest] = rows.filter(r => !/^\s*\|[\s:|-]*-[\s:|-]*\|\s*$/.test(r));
  if (!head) return '';
  const row = (r, tag) => `<tr>${cells(r).map(c => `<${tag}>${inlineMd(c)}</${tag}>`).join('')}</tr>`;
  return `<div class="sv-tw"><table><thead>${row(head, 'th')}</thead><tbody>${rest.map(r => row(r, 'td')).join('')}</tbody></table></div>`;
}
function mdHtml(src) {
  const out = [], lines = src.replace(/\r\n/g, '\n').split('\n');
  const LIST = /^\s*([-*+]|\d+[.)])\s+/, ROW = /^\s*\|.*\|\s*$/;
  let i = 0, para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inlineMd(para.join(' '))}</p>`); para = []; } };
  while (i < lines.length) {
    const l = lines[i]; let m;
    if (/^(```|~~~)/.test(l)) { flush(); const fence = l.slice(0, 3), buf = []; i++; while (i < lines.length && !lines[i].startsWith(fence)) buf.push(lines[i++]); i++; out.push(`<pre>${escH(buf.join('\n'))}</pre>`); continue; }
    if ((m = l.match(/^(#{1,6})\s+(.*)/))) { flush(); const n = Math.min(m[1].length + 1, 6); out.push(`<h${n}>${inlineMd(m[2])}</h${n}>`); i++; continue; }
    if (ROW.test(l)) { flush(); const rows = []; while (i < lines.length && ROW.test(lines[i])) rows.push(lines[i++]); out.push(tableHtml(rows)); continue; }
    if (LIST.test(l)) { flush(); const tag = /^\s*\d/.test(l) ? 'ol' : 'ul', items = []; while (i < lines.length && LIST.test(lines[i])) items.push(lines[i++].replace(LIST, '')); out.push(`<${tag}>${items.map(x => `<li>${inlineMd(x)}</li>`).join('')}</${tag}>`); continue; }
    if (/^>\s?/.test(l)) { flush(); const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, '')); out.push(`<blockquote>${inlineMd(buf.join(' '))}</blockquote>`); continue; }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { flush(); out.push('<hr>'); i++; continue; }
    if (!l.trim()) { flush(); i++; continue; }
    para.push(l.trim()); i++;
  }
  flush();
  return out.join('\n');
}
function splitFm(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return [[], src];
  const props = m[1].split(/\r?\n/).map(l => l.match(/^([\w .-]+):\s*(.*)$/)).filter(Boolean).map(x => [x[1], x[2].replace(/^["']|["']$/g, '')]);
  return [props, src.slice(m[0].length)];
}
function noteHtml(p, src, open) {
  const [props, body] = splitFm(src);
  const h = body.match(/^#\s+(.+)$/m), t = props.find(x => x[0] === 'title');
  const title = t ? t[1] : h ? h[1] : path.basename(p, '.md');
  const dl = props.length ? `<dl class="sv-props">${props.map(([k, v]) => `<dt>${escH(k)}</dt><dd>${inlineMd(v)}</dd>`).join('')}</dl>` : '';
  return `<details class="sv-note"${open ? ' open' : ''}><summary>${inlineMd(title)}<small>${escH(p)}</small></summary>${dl}<div class="sv-md">${mdHtml(h ? body.replace(h[0], '') : body)}</div></details>`;
}
function staticHtml(files, stamp) {
  const [ip, ib] = splitFm(files['00_index.md'] || '');
  const get = k => (ip.find(x => x[0] === k) || [])[1] || '';
  const ih = ib.match(/^#\s+(.+)$/m);
  const groups = new Map();
  const put = (k, label, p) => { if (!groups.has(k)) groups.set(k, { label, paths: [] }); groups.get(k).paths.push(p); };
  for (const p of Object.keys(files).sort()) {
    const top = p.includes('/') ? p.split('/')[0] : '';
    if (p === '00_index.md' || top === '01_matter') put('brief', 'Brief', p);
    else if (p === '08_story.md') put('story', 'Story', p);
    else if (top) put(top, top.replace(/^\d+_/, '').replace(/[-_]/g, ' ').replace(/^./, c => c.toUpperCase()), p);
    else put('files', 'Vault files', p);
  }
  const first = ['brief', 'story'].filter(k => groups.has(k));
  const keys = [...first, ...[...groups.keys()].filter(k => !first.includes(k) && k !== 'files'), ...(groups.has('files') ? ['files'] : [])];
  const nav = keys.map(k => `<a href="#sv-${escH(k)}">${escH(groups.get(k).label)}</a>`).join('');
  const secs = keys.map(k => {
    const g = groups.get(k);
    return `<section id="sv-${escH(k)}" class="sv-sec"><h2>${escH(g.label)} <small>${g.paths.length}</small></h2>${g.paths.map((p, i) => noteHtml(p, files[p], (k === 'brief' && i < 2) || k === 'story')).join('')}<a class="sv-up" href="#sv">Back to top</a></section>`;
  }).join('\n');
  return `<header class="sv-head"><div class="sv-brand"><i></i>Dex Folio</div><h1>${inlineMd(get('title') || (ih ? ih[1] : 'Matter of Fact'))}</h1>${get('slant') ? `<p>Slant: ${inlineMd(get('slant'))}</p>` : ''}<p class="sv-fine">Plain view, built ${escH(stamp)}. Tap a note to open it. For the node map, timeline and decisions, open this file in Safari or Chrome.</p></header><nav class="sv-nav">${nav}</nav>\n${secs}`;
}

function changes() {
  if (!fs.existsSync(SNAP)) { console.log('No snapshot yet. Build the Folio once to take one.'); return; }
  const old = JSON.parse(fs.readFileSync(SNAP, 'utf8')); const before = old.files || {}, now = scan();
  const added = Object.keys(now).filter(k => !(k in before)).sort();
  const removed = Object.keys(before).filter(k => !(k in now)).sort();
  const changed = Object.keys(now).filter(k => k in before && sig(now[k]) !== sig(before[k])).sort();
  const inside = k => k.startsWith('dex-vault/');
  console.log(`Changes since the snapshot taken ${old.taken || '?'}`);
  for (const [title, keep] of [['The material (outside dex-vault/)', k => !inside(k)], ['Inside dex-vault/ since the last build (usually human edits)', inside]]) {
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
  if (html.split(MARKER).length !== 2) { console.error('Template marker not found exactly once. Check that dex.md is the full, unedited file.'); process.exit(1); }
  let page = html.replace(MARKER, () => data);
  if (page.split(STATIC).length === 2) page = page.replace(STATIC, () => staticHtml(files, stamp));
  fs.writeFileSync(OUT, page);
  fs.writeFileSync(SNAP, JSON.stringify({ taken: stamp, version: VERSION, files: scan() }));
  console.log(`Dex Folio written: ${OUT} (${Object.keys(files).length} markdown files, ${Math.round(fs.statSync(OUT).size / 1024)} KB). Snapshot taken.`);
}

if (process.argv.slice(2).includes('--changes')) changes(); else build();
