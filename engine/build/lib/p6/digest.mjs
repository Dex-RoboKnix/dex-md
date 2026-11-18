// node: L4.E07
// input: { items: [{ key, kind, text }], reported: [{ date: "YYYY-MM-DD", key, kind }], now: ISO8601, asked?: boolean, channel?: string }

// A quiet outbox: earn the owner's attention slowly. A digest holds only what was not told before (its key is not in
// reported.md). Nothing new: nothing is sent. At most one digest a day, unless the owner asked for one.
// Pure: it returns whether to send, the text, and the reported.md rows to add; the vault tool writes them.

const KEY = /^[A-Za-z0-9:@._#-]{1,200}$/;
const CHANNEL = /^[a-z][a-z0-9-]{0,30}$/;
const KINDS = ['answer', 'timer', 'held', 'run', 'note'];
const LABEL = { answer: 'Answers in', timer: 'Reminders due', held: 'Waiting for you', run: 'Done since the last digest', note: 'Notes' };
const time = (s) => (typeof s === 'string' ? Date.parse(s) : NaN);
const cell = (s) => String(s).replace(/\s+/g, ' ').replace(/\|/g, '/').trim();

export function run(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'input must be an object' };
  const { items, reported, now } = input;
  const channel = input.channel === undefined ? 'session' : input.channel;
  if (!Array.isArray(items)) return { ok: false, error: 'items must be an array' };
  if (!Array.isArray(reported)) return { ok: false, error: 'reported must be an array' };
  if (Number.isNaN(time(now))) return { ok: false, error: 'now must be an ISO time' };
  if (typeof channel !== 'string' || !CHANNEL.test(channel)) return { ok: false, error: 'channel must be a short lowercase word, like session or phone' };
  for (const it of items) {
    if (!it || typeof it !== 'object' || typeof it.key !== 'string' || !KEY.test(it.key)) return { ok: false, error: 'each item needs a key of letters, digits and :@._#-' };
    if (!KINDS.includes(it.kind)) return { ok: false, error: `item ${it.key}: kind must be one of ${KINDS.join(', ')}` };
    if (typeof it.text !== 'string' || !it.text.trim()) return { ok: false, error: `item ${it.key}: text is empty` };
  }
  const today = new Date(time(now)).toISOString().slice(0, 10);
  const told = new Set(reported.filter((r) => r && typeof r.key === 'string').map((r) => r.key));
  const seen = new Set();
  const fresh = items.filter((it) => !told.has(it.key) && !seen.has(it.key) && seen.add(it.key));
  if (!fresh.length) return { ok: true, send: false, reason: 'nothing new', text: '', rows: [], trace: { node: 'L4.E07', items: items.length, fresh: 0 } };
  const sentToday = reported.some((r) => r && r.kind === 'digest' && r.date === today);
  if (sentToday && input.asked !== true) return { ok: true, send: false, reason: 'one a day', text: '', rows: [], waiting: fresh.length, trace: { node: 'L4.E07', items: items.length, fresh: fresh.length } };
  const lines = [`Dex digest, ${today}: ${fresh.length} new.`];
  for (const k of KINDS) {
    const of = fresh.filter((it) => it.kind === k);
    if (!of.length) continue;
    lines.push('', `${LABEL[k]}:`);
    for (const it of of) lines.push(`- ${cell(it.text)}`);
  }
  const iso = new Date(time(now)).toISOString();
  const rows = [
    ...fresh.map((it) => ({ date: today, time: iso.slice(11, 16), channel, kind: it.kind, key: it.key, what: cell(it.text).slice(0, 200) })),
    { date: today, time: iso.slice(11, 16), channel, kind: 'digest', key: `digest:${iso}`, what: `${fresh.length} item(s)${input.asked === true ? ', asked for' : ''}` },
  ];
  return { ok: true, send: true, reason: input.asked === true && sentToday ? 'asked' : 'new', text: lines.join('\n'), rows, trace: { node: 'L4.E07', items: items.length, fresh: fresh.length } };
}
