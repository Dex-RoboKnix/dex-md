import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run, fence } from '../../lib/p6/late-answer.mjs';

const EVENT = { id: '6900000001', held: 'dex-loop-115', skill: 'dex-loop', issue: '115', repo: 'acme/vault', url: 'https://github.com/acme/vault/issues/115#issuecomment-6900000001', author: 'owner', commented: '2026-11-17T21:05:00Z', body: 'agree, go to phase 4\nthanks' };
const HELD = { id: 'dex-loop-115', skill: 'dex-loop', issue: '115', question: 'Phase 3 verdict: agree, send back or amend?' };
const base = (over = {}) => ({ event: EVENT, held: HELD, checked: 'Agree, go to phase 4. Thanks.', journalId: 'J162', now: '2026-11-17T21:30:00.000Z', ...over });

test('the answer is recorded twice: the comment verbatim and the checked copy, with the comment id as its source', () => {
  const r = run(base());
  assert.equal(r.ok, true, r.error);
  const t = r.journal.text;
  assert.equal(r.journal.id, 'J162');
  assert.match(t, /^---\nid: J162\ndate: 2026-11-17\ntime: 21:05 GMT \(answered on GitHub\)\nchannel: github\nskill: dex-loop\n/);
  assert.match(t, /^provenance: PHC$/m);
  assert.match(t, /^source: GitHub comment 6900000001 on acme\/vault#115 \(https:\/\/github\.com\/acme\/vault\/issues\/115#issuecomment-6900000001\)$/m);
  assert.match(t, /## The held question\nPhase 3 verdict: agree, send back or amend\?\n/);
  assert.match(t, /Original \(verbatim, private\):\n```text\nagree, go to phase 4\nthanks\n```\n/);
  assert.match(t, /## Checked copy\nAgree, go to phase 4\. Thanks\.\n/);
  assert.ok(t.indexOf('Original (verbatim') < t.indexOf('## Checked copy'));
  assert.match(t, /\[DOCUMENT\] Arrived as GitHub comment 6900000001 .* recorded here at 2026-11-17T21:30:00\.000Z before dex-loop resumed\./);
});

test('an answer holding backticks is fenced longer, so the original is kept exactly', () => {
  assert.equal(fence('a ``` b'), '````text\na ``` b\n````');
  assert.equal(fence('plain'), '```text\nplain\n```');
  const r = run(base({ event: { ...EVENT, body: 'use ```code``` here' } }));
  assert.match(r.journal.text, /````text\nuse ```code``` here\n````/);
});

test('an event that answers a different held question, skill or issue is refused', () => {
  assert.match(run(base({ event: { ...EVENT, held: 'dex-grill-115' } })).error, /answers dex-grill-115, not dex-loop-115/);
  assert.match(run(base({ event: { ...EVENT, skill: 'dex-grill' } })).error, /same skill/);
  assert.match(run(base({ event: { ...EVENT, issue: '116' } })).error, /same issue/);
});

test('no checked copy, no record: the answer is never kept once', () => {
  for (const checked of [undefined, '', '   ', 3]) assert.equal(run(base({ checked })).ok, false);
});

test('bad input is refused with {ok:false}, never a throw', () => {
  for (const bad of [
    undefined, null, 1, 'x', [], {},
    base({ event: null }), base({ held: 'x' }),
    base({ event: { ...EVENT, id: '../x' } }), base({ held: { ...HELD, id: '../x' }, event: { ...EVENT, held: '../x' } }),
    base({ event: { ...EVENT, repo: 'nope' } }), base({ event: { ...EVENT, author: '' } }),
    base({ event: { ...EVENT, commented: 'later' } }), base({ event: { ...EVENT, body: 5 } }),
    base({ held: { ...HELD, question: '' } }), base({ journalId: '162' }), base({ now: 'soon' }),
  ]) {
    const r = run(bad);
    assert.equal(r.ok, false, JSON.stringify(bad));
    assert.equal(typeof r.error, 'string');
  }
});
