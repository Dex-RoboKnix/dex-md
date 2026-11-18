import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p6/digest.mjs';

const NOW = '2026-11-18T09:00:00.000Z';
const items = [
  { key: 'event:21', kind: 'answer', text: 'owner answered on #115: agree' },
  { key: 'held:dex-loop-116@2026-11-18T08:00:00.000Z', kind: 'held', text: 'dex-loop #116: which form first?' },
  { key: 'run:38', kind: 'run', text: 'run 38: phase 4 built' },
];

test('a run with nothing new sends nothing and records nothing', () => {
  const r = run({ items: [], reported: [], now: NOW });
  assert.deepEqual([r.ok, r.send, r.reason, r.rows.length], [true, false, 'nothing new', 0]);
});

test('new items make one digest, grouped, with one reported row each and one for the digest', () => {
  const r = run({ items, reported: [], now: NOW, channel: 'phone' });
  assert.equal(r.send, true);
  assert.equal(r.text, 'Dex digest, 2026-11-18: 3 new.\n\nAnswers in:\n- owner answered on #115: agree\n\nWaiting for you:\n- dex-loop #116: which form first?\n\nDone since the last digest:\n- run 38: phase 4 built');
  assert.deepEqual(r.rows.map((x) => [x.kind, x.key, x.channel]), [['answer', 'event:21', 'phone'], ['held', 'held:dex-loop-116@2026-11-18T08:00:00.000Z', 'phone'], ['run', 'run:38', 'phone'], ['digest', 'digest:2026-11-18T09:00:00.000Z', 'phone']]);
});

test('what is already in reported.md is never told again', () => {
  const reported = [{ date: '2026-11-17', kind: 'answer', key: 'event:21' }, { date: '2026-11-17', kind: 'digest', key: 'digest:x' }];
  const r = run({ items, reported, now: NOW });
  assert.equal(r.send, true);
  assert.doesNotMatch(r.text, /agree/);
  assert.match(r.text, /^Dex digest, 2026-11-18: 2 new\./);
  const all = run({ items, reported: [...reported, { key: items[1].key }, { key: items[2].key }], now: NOW });
  assert.deepEqual([all.send, all.reason], [false, 'nothing new']);
});

test('at most one digest a day, unless the owner asked', () => {
  const reported = [{ date: '2026-11-18', kind: 'digest', key: 'digest:earlier' }];
  const r = run({ items, reported, now: NOW });
  assert.deepEqual([r.send, r.reason, r.waiting, r.rows.length], [false, 'one a day', 3, 0]);
  const asked = run({ items, reported, now: NOW, asked: true });
  assert.deepEqual([asked.send, asked.reason], [true, 'asked']);
  assert.match(asked.rows.at(-1).what, /asked for/);
  const tomorrow = run({ items, reported, now: '2026-11-19T07:00:00.000Z' });
  assert.equal(tomorrow.send, true);
});

test('the same key twice in one run is told once; table cells cannot break the row', () => {
  const r = run({ items: [items[0], items[0], { key: 'note:1', kind: 'note', text: 'a | b\nc' }], reported: [], now: NOW });
  assert.equal(r.rows.filter((x) => x.key === 'event:21').length, 1);
  assert.equal(r.rows.find((x) => x.key === 'note:1').what, 'a / b c');
});

test('bad input is refused with {ok:false}, never a throw', () => {
  for (const bad of [undefined, null, 1, 'x', [], {},
    { items: 'x', reported: [], now: NOW }, { items: [], reported: 'x', now: NOW }, { items: [], reported: [], now: 'later' },
    { items: [{ key: 'a b', kind: 'run', text: 'x' }], reported: [], now: NOW }, { items: [{ key: 'a', kind: 'poem', text: 'x' }], reported: [], now: NOW },
    { items: [{ key: 'a', kind: 'run', text: ' ' }], reported: [], now: NOW }, { items: [], reported: [], now: NOW, channel: 'Phone Call' }]) {
    const r = run(bad);
    assert.equal(r.ok, false, JSON.stringify(bad));
  }
});
