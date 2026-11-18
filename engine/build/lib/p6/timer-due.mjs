// node: L4.E07
// input: { timers: [{ id, skill, issue?, due: ISO8601, every?: "30m"|"12h"|"1d"|"1w", note, status }], now: ISO8601 }

// Timers: dex wakes itself for follow-ups and schedules. A timer that is due becomes one inbox event. A follow-up
// (no every) is then done; a schedule moves to its next time after now, so a week away fires it once, not seven times.
// Pure: it returns the event files to write and the timer changes; the vault tool checks each line and writes.

const ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SKILL = /^[a-z0-9-]+$/;
const ISSUE = /^\d+$/;
const UNIT = { m: 60000, h: 3600000, d: 86400000, w: 604800000 };
const time = (s) => (typeof s === 'string' ? Date.parse(s) : NaN);

// "30m", "12h", "1d", "1w" -> milliseconds; anything else -> null. Shortest period 5 minutes.
export function period(every) {
  const m = /^(\d{1,4})([mhdw])$/.exec(typeof every === 'string' ? every : '');
  if (!m) return null;
  const ms = Number(m[1]) * UNIT[m[2]];
  return ms >= 5 * 60000 ? ms : null;
}

// A note made safe to sit inside ["..."]: one line, no double quotes, no dex( or dex[, at most 160 characters.
export function noteSubject(note) {
  const s = String(note).replace(/\s+/g, ' ').trim().replace(/"/g, "'").replace(/dex([([])/gi, (m, b) => `${m.slice(0, 3)} ${b}`);
  return s.length > 160 ? `${s.slice(0, 159)}…` : s;
}

const compact = (iso) => iso.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z').slice(0, 13); // 20261118T0900

export function run(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'input must be an object' };
  const { timers, now } = input;
  if (!Array.isArray(timers)) return { ok: false, error: 'timers must be an array' };
  if (Number.isNaN(time(now))) return { ok: false, error: 'now must be an ISO time' };
  const at = time(now);
  const fire = [];
  const updates = [];
  const skipped = [];
  for (const t of timers) {
    if (!t || typeof t !== 'object' || typeof t.id !== 'string' || !ID.test(t.id)) { skipped.push({ id: t && t.id, why: 'no usable id' }); continue; }
    if ((t.status || 'waiting') !== 'waiting') continue;
    if (typeof t.skill !== 'string' || !SKILL.test(t.skill)) { skipped.push({ id: t.id, why: 'skill must be lowercase letters, digits and dashes' }); continue; }
    if (t.issue !== undefined && t.issue !== null && !(typeof t.issue === 'string' && ISSUE.test(t.issue))) { skipped.push({ id: t.id, why: 'issue must be a number' }); continue; }
    if (Number.isNaN(time(t.due))) { skipped.push({ id: t.id, why: 'due must be an ISO time' }); continue; }
    if (t.every !== undefined && t.every !== null && period(t.every) === null) { skipped.push({ id: t.id, why: 'every must be like 30m, 12h, 1d or 1w (5 minutes or more)' }); continue; }
    if (typeof t.note !== 'string' || !t.note.trim()) { skipped.push({ id: t.id, why: 'the note is empty' }); continue; }
    const due = time(t.due);
    if (due > at) continue;
    const dueIso = new Date(due).toISOString();
    const eventId = `t-${t.id}-${compact(dueIso)}`;
    const ctx = ['source:timer', `timer:${t.id}`, `due:${dueIso}`, t.issue ? `issue:${t.issue}` : null, t.every ? `every:${t.every}` : null].filter(Boolean).join(',');
    const line = `dex(${t.skill}, @${ctx})["${noteSubject(t.note)}"]`;
    const text = [
      '---',
      `id: ${eventId}`,
      'source: timer',
      `timer: ${t.id}`,
      `skill: ${t.skill}`,
      ...(t.issue ? [`issue: ${t.issue}`] : []),
      `due: ${dueIso}`,
      `received: ${new Date(at).toISOString()}`,
      'status: pending',
      '---',
      line,
      '',
      `Readable: a timer ${t.every ? `that repeats every ${t.every}` : 'set as a follow-up'} came due for ${t.skill}${t.issue ? ` on #${t.issue}` : ''}. The note is the agent's own reminder; act on it, then close it with \`vault.mjs timer done --event ${eventId}\`.`,
      '',
      '## The note',
      '',
      t.note.replace(/\r\n/g, '\n').trimEnd(),
      '',
    ].join('\n');
    fire.push({ timer: t.id, eventId, file: `${eventId}.md`, line, text });
    if (t.every) {
      const p = period(t.every);
      const next = due + (Math.floor((at - due) / p) + 1) * p; // the first time after now: missed periods fire once
      updates.push({ id: t.id, due: new Date(next).toISOString() });
    } else updates.push({ id: t.id, status: 'done' });
  }
  return { ok: true, fire, updates, skipped, trace: { node: 'L4.E07', timers: timers.length, due: fire.length } };
}
