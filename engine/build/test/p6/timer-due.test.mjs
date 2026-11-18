import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run, period, noteSubject } from '../../lib/p6/timer-due.mjs';
import { run as parse } from '../../lib/p6/dex838-parse.mjs';

const T = (over = {}) => ({ id: 'dex-loop-115-20261118t0900', skill: 'dex-loop', issue: '115', due: '2026-11-18T09:00:00.000Z', note: 'Check the Mozilla form', status: 'waiting', ...over });

test('a follow-up that is due becomes one event with a strict DEX838 line, and is then done', () => {
  const r = run({ timers: [T()], now: '2026-11-18T09:30:00.000Z' });
  assert.equal(r.ok, true, r.error);
  assert.equal(r.fire.length, 1);
  const f = r.fire[0];
  assert.equal(f.eventId, 't-dex-loop-115-20261118t0900-20261118T0900');
  assert.equal(f.line, 'dex(dex-loop, @source:timer,timer:dex-loop-115-20261118t0900,due:2026-11-18T09:00:00.000Z,issue:115)["Check the Mozilla form"]');
  assert.equal(parse({ line: f.line }).ok, true);
  assert.match(f.text, /^status: pending$/m);
  assert.match(f.text, /## The note\n\nCheck the Mozilla form\n$/);
  assert.deepEqual(r.updates, [{ id: 'dex-loop-115-20261118t0900', status: 'done' }]);
});

test('a timer not yet due does nothing; a done timer never fires again', () => {
  assert.equal(run({ timers: [T()], now: '2026-11-18T08:59:59.000Z' }).fire.length, 0);
  assert.equal(run({ timers: [T({ status: 'done' })], now: '2026-11-19T00:00:00.000Z' }).fire.length, 0);
});

test('a schedule fires once and moves to its next time after now: a week away fires it once, not seven times', () => {
  const r = run({ timers: [T({ every: '1d' })], now: '2026-11-25T10:00:00.000Z' });
  assert.equal(r.fire.length, 1);
  assert.match(r.fire[0].line, /,every:1d\)\[/);
  assert.deepEqual(r.updates, [{ id: 'dex-loop-115-20261118t0900', due: '2026-11-26T09:00:00.000Z' }]);
  const same = run({ timers: [T({ every: '1d' })], now: '2026-11-18T09:00:00.000Z' });
  assert.deepEqual(same.updates, [{ id: 'dex-loop-115-20261118t0900', due: '2026-11-19T09:00:00.000Z' }], 'due exactly now: the next time is one period on');
});

test('periods: minutes, hours, days, weeks, at least 5 minutes', () => {
  assert.equal(period('30m'), 1800000);
  assert.equal(period('12h'), 43200000);
  assert.equal(period('1w'), 604800000);
  for (const bad of ['1m', '4m', '1y', 'daily', '', null, 5]) assert.equal(period(bad), null, String(bad));
});

test('the note never becomes a qualifier or breaks the line', () => {
  assert.equal(noteSubject('ask "him" dex(now) dex[x]'), "ask 'him' dex (now) dex [x]");
  const r = run({ timers: [T({ note: 'ask "him" dex(now) dex[x]\nsecond line' })], now: '2026-11-19T00:00:00.000Z' });
  const p = parse({ line: r.fire[0].line });
  assert.equal(p.ok, true, p.error);
  assert.deepEqual(p.parsed.qualifiers.softcode, []);
  assert.match(r.fire[0].text, /ask "him" dex\(now\) dex\[x\]\nsecond line\n$/, 'the note itself is kept as written');
});

test('a timer that cannot be read is skipped with a reason, and the others still fire', () => {
  const r = run({ timers: [T({ id: '../x' }), T({ id: 'b', skill: 'Bad' }), T({ id: 'c', every: '1y' }), T({ id: 'd', note: ' ' }), T({ id: 'e', due: 'soon' }), T({ id: 'f', issue: '#1' }), T({ id: 'ok' })], now: '2026-11-19T00:00:00.000Z' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.fire.map((f) => f.timer), ['ok']);
  assert.equal(r.skipped.length, 6);
});

test('bad input is refused with {ok:false}, never a throw', () => {
  for (const bad of [undefined, null, 1, 'x', [], {}, { timers: 'x', now: '2026-11-19T00:00:00Z' }, { timers: [], now: 'later' }]) {
    const r = run(bad);
    assert.equal(r.ok, false, JSON.stringify(bad));
  }
});
