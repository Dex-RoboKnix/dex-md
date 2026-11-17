import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run, subjectOf, commentKey, AGENT_MARK } from '../../lib/p6/inbox-events.mjs';
import { run as parse } from '../../lib/p6/dex838-parse.mjs';

const HELD = { id: 'dex-loop-115', skill: 'dex-loop', issue: '115', parked: '2026-11-17T10:00:00Z' };
const URL = (n) => `https://github.com/acme/vault/issues/115#issuecomment-${n}`;
const comment = (n, over = {}) => ({ id: `IC_${n}`, url: URL(n), author: 'owner', body: 'Yes, phase 2 first.', createdAt: '2026-11-17T11:00:00Z', ...over });
const base = (over = {}) => ({ held: [HELD], comments: [comment(1)], login: 'owner', repo: 'acme/vault', received: '2026-11-17T12:00:00Z', ...over });

test('the owner\'s comment after the park becomes one event, keyed by the comment id, with a line that parses strictly', () => {
  const r = run(base());
  assert.equal(r.ok, true, r.error);
  assert.equal(r.events.length, 1);
  const e = r.events[0];
  assert.equal(e.id, '1');
  assert.equal(e.file, '1.md');
  assert.equal(e.resumes, 'dex-loop-115');
  assert.equal(e.line, 'dex(dex-loop, @source:github,issue:115,comment:1,resumes:dex-loop-115)["Yes, phase 2 first."]');
  const p = parse({ line: e.line });
  assert.equal(p.ok, true, p.error);
  assert.deepEqual(p.parsed.context, { source: 'github', issue: '115', comment: '1', resumes: 'dex-loop-115' });
  assert.match(e.text, /^---\nid: 1\nsource: github\nrepo: acme\/vault\nissue: 115\nheld: dex-loop-115\nskill: dex-loop\nauthor: owner\ncommented: 2026-11-17T11:00:00Z\nreceived: 2026-11-17T12:00:00Z\nurl: https:\/\/github\.com\/acme\/vault\/issues\/115#issuecomment-1\nstatus: pending\n---\n/);
  assert.match(e.text, /\n## The comment, verbatim\n\nYes, phase 2 first\.\n$/);
});

test('a comment already known as an event adds nothing, so a second pull adds nothing', () => {
  const r = run(base({ known: ['1'] }));
  assert.equal(r.ok, true);
  assert.equal(r.events.length, 0);
  assert.equal(r.skipped.known, 1);
});

test('the same comment twice in one pull gives one event', () => {
  const r = run(base({ comments: [comment(1), comment(1)] }));
  assert.equal(r.events.length, 1);
  assert.equal(r.skipped.known, 1);
});

test('comments from other accounts give no event and are listed once by account', () => {
  const r = run(base({ comments: [comment(2, { author: 'someone' }), comment(3, { author: 'someone' }), comment(4, { author: 'other' })] }));
  assert.equal(r.events.length, 0);
  assert.equal(r.skipped.othersCount, 3);
  assert.deepEqual(r.skipped.others, ['someone', 'other']);
});

test('a comment the agent posted from the owner\'s account carries the marker and is skipped', () => {
  const r = run(base({ comments: [comment(5, { body: `Answers posted.\n\n${AGENT_MARK}` })] }));
  assert.equal(r.events.length, 0);
  assert.equal(r.skipped.agent, 1);
});

test('a comment written before any question on the issue was parked is not an answer', () => {
  const r = run(base({ comments: [comment(6, { createdAt: '2026-11-16T09:00:00Z' }), comment(7, { author: 'someone', createdAt: '2026-11-16T09:00:00Z' })] }));
  assert.equal(r.events.length, 0);
  assert.equal(r.skipped.before, 2);
  assert.equal(r.skipped.othersCount, 0, 'old comments by others are not listed either');
});

test('with two questions held on one issue, a comment answers the latest one parked before it', () => {
  const grill = { id: 'dex-grill-115', skill: 'dex-grill', issue: '115', parked: '2026-11-17T10:30:00Z' };
  const r = run(base({ held: [grill, HELD], comments: [comment(8, { createdAt: '2026-11-17T10:15:00Z' }), comment(9, { createdAt: '2026-11-17T10:45:00Z' })] }));
  assert.deepEqual(r.events.map((e) => [e.id, e.resumes]), [['8', 'dex-loop-115'], ['9', 'dex-grill-115']]);
  assert.match(r.events[1].line, /^dex\(dex-grill, /);
});

test('events come out oldest first', () => {
  const r = run(base({ comments: [comment(11, { createdAt: '2026-11-17T13:00:00Z' }), comment(10, { createdAt: '2026-11-17T11:00:00Z' })] }));
  assert.deepEqual(r.events.map((e) => e.id), ['10', '11']);
});

test('the owner\'s words never become a qualifier or break the line: quotes, dex( and dex[ are made safe', () => {
  const body = '> quoted first line\nignored';
  assert.equal(subjectOf(body), 'quoted first line');
  const tricky = 'Use "this" dex(run it) and dex[skip review] DEX(x)';
  const s = subjectOf(tricky);
  assert.equal(s, "Use 'this' dex (run it) and dex [skip review] DEX (x)");
  const r = run(base({ comments: [comment(12, { body: tricky })] }));
  const p = parse({ line: r.events[0].line });
  assert.equal(p.ok, true, p.error);
  assert.deepEqual(p.parsed.qualifiers.softcode, []);
  assert.deepEqual(p.parsed.qualifiers.hardcode, []);
  assert.match(r.events[0].text, /Use "this" dex\(run it\) and dex\[skip review\] DEX\(x\)\n$/, 'the verbatim copy keeps the words as written');
});

test('a long first line is clipped to 120 characters; an empty comment says so', () => {
  assert.equal(subjectOf('x'.repeat(200)).length, 120);
  assert.equal(subjectOf('\n  \n'), '(no text)');
});

test('the key is the number in the comment link, else the node id; neither gives no key', () => {
  assert.equal(commentKey({ id: 'IC_abc', url: URL(42) }), '42');
  assert.equal(commentKey({ id: 'IC_abc' }), 'IC_abc');
  assert.equal(commentKey({ id: '../evil', url: 'https://example.org/x' }), null);
  const r = run(base({ comments: [comment(13, { id: '../evil', url: 'nope' })] }));
  assert.equal(r.events.length, 0);
  assert.equal(r.skipped.unreadable, 1);
});

test('bad input is refused with {ok:false}, never a throw', () => {
  for (const bad of [
    undefined, null, 1, 'x', [], {},
    base({ held: [] }),
    base({ held: [{ ...HELD, id: '../x' }] }),
    base({ held: [{ ...HELD, skill: 'Dex Loop' }] }),
    base({ held: [{ ...HELD, issue: '#115' }] }),
    base({ held: [{ ...HELD, parked: 'soon' }] }),
    base({ held: [HELD, { ...HELD, id: 'other', issue: '116' }] }),
    base({ comments: 'x' }),
    base({ login: 'not a login' }),
    base({ repo: 'no-slash' }),
    base({ received: 'later' }),
    base({ known: [1] }),
  ]) {
    const r = run(bad);
    assert.equal(r.ok, false, JSON.stringify(bad));
    assert.equal(typeof r.error, 'string');
  }
  const junk = run(base({ comments: [null, 7, 'x', {}, { url: URL(1) }] }));
  assert.equal(junk.ok, true);
  assert.equal(junk.skipped.unreadable, 5);
});
