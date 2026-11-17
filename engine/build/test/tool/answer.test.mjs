import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { sandbox, comment } from './inbox-sandbox.mjs';

// The next run resumes it: park, a comment arrives (GitHub stubbed), inbox, resume shows it, answer records it twice.
const front = (file) => Object.fromEntries(/^---\n([\s\S]*?)\n---\n/.exec(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'))[1].split('\n').map((l) => [l.slice(0, l.indexOf(': ')), l.slice(l.indexOf(': ') + 2)]));
function arrived(over = {}) {
  const s = sandbox({ issues: { 115: [comment(21, { body: 'agree, go to phase 4', ...over })] } });
  s.park();
  const i = s.vault(['inbox']);
  assert.equal(i.status, 0, i.stderr);
  assert.deepEqual(s.list(), ['21.md']);
  return s;
}

test('resume shows the answer that came in on GitHub under its held question, and how to record it', () => {
  const s = arrived();
  const r = s.vault(['resume']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Held: dex-loop #115 \(parked 2026-11-17T10:00:00\.000Z\)\n  Question: Which phase first\?\n  Answered on GitHub by owner \(comment 21, 2026-11-17T11:00:00Z\): agree, go to phase 4\n    Record it twice, then resume here: node dex-vault\/\.dex\/vault\.mjs answer --event 21 --checked "<the spelling-checked copy>"\n$/);
});

test('answer records it twice with the comment id as its source, marks the event done and the question answered, and says where to resume', () => {
  const s = arrived();
  fs.mkdirSync(path.join(s.vaultDir, '06_journal', 'raw'), { recursive: true });
  fs.writeFileSync(path.join(s.vaultDir, '06_journal', 'raw', '2026-11-16-raw-1.md'), '---\nid: J160\n---\nx\n');
  const r = s.vault(['answer', '--event', '21', '--checked', 'Agree, go to phase 4.', '--now', '2026-11-17T12:00:00.000Z']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Recorded J161 in 06_journal\/answers\/2026-11-17-dex-loop-1\.md: the original and the checked copy, source GitHub comment 21\.\nResume dex-loop #115 at: Which phase first\?\n  The answer \(checked copy\): Agree, go to phase 4\.\n$/);
  const j = fs.readFileSync(path.join(s.vaultDir, '06_journal', 'answers', '2026-11-17-dex-loop-1.md'), 'utf8');
  assert.match(j, /^source: GitHub comment 21 on acme\/vault#115 /m);
  assert.match(j, /Original \(verbatim, private\):\n```text\nagree, go to phase 4\n```/);
  assert.match(j, /## Checked copy\nAgree, go to phase 4\.\n/);
  assert.deepEqual([front(path.join(s.events, '21.md')).status, front(path.join(s.events, '21.md')).journal], ['done', 'J161']);
  const h = front(path.join(s.vaultDir, '07_inbox', 'held', 'dex-loop-115.md'));
  assert.deepEqual([h.status, h.answered, h.journal], ['answered', '21', 'J161']);
});

test('a second session start resumes nothing: no new event, nothing held, and the answer cannot be recorded twice', () => {
  const s = arrived();
  const first = s.vault(['answer', '--event', '21', '--checked', 'Agree.']);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /^Recorded J001 /, 'the first journal entry in a new vault is J001');
  const again = s.vault(['inbox']);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /no held question names an issue|0 new event/);
  assert.deepEqual(s.list(), ['21.md']);
  const r = s.vault(['resume']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'nothing held');
  const twice = s.vault(['answer', '--event', '21', '--checked', 'Agree.']);
  assert.notEqual(twice.status, 0);
  assert.match(twice.stderr, /is done, not pending: it was already recorded\. Nothing done\./);
  assert.equal(fs.readdirSync(path.join(s.vaultDir, '06_journal', 'answers')).length, 1);
});

test('an answer with no matching held question is listed for the owner and not acted on', () => {
  const s = arrived();
  fs.rmSync(path.join(s.vaultDir, '07_inbox', 'held', 'dex-loop-115.md'));
  const r = s.vault(['resume']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'Waiting for the owner: 07_inbox/events/21.md: an answer on GitHub for dex-loop-115, which is not held. Not acted on.');
  const a = s.vault(['answer', '--event', '21', '--checked', 'Agree.']);
  assert.notEqual(a.status, 0);
  assert.match(a.stderr, /answers dex-loop-115, which is not held\. Not acted on\./);
  assert.ok(!fs.existsSync(path.join(s.vaultDir, '06_journal')));
  assert.equal(front(path.join(s.events, '21.md')).status, 'pending');
});

test('an event whose line does not parse waits for the owner, in resume and in answer', () => {
  const s = arrived();
  const f = path.join(s.events, '21.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(',resumes:dex-loop-115)', ',resumes:dex-loop-115,comment:22)'));
  const r = s.vault(['resume']);
  assert.match(r.stdout, /Waiting for the owner: 07_inbox\/events\/21\.md: its DEX838 line does not parse \(Duplicate context key: comment\)\. Not acted on\./);
  assert.doesNotMatch(r.stdout, /Answered on GitHub/);
  const a = s.vault(['answer', '--event', '21', '--checked', 'Agree.']);
  assert.notEqual(a.status, 0);
  assert.match(a.stderr, /does not parse/);
});

test('answer needs a checked copy and a plain event id', () => {
  const s = arrived();
  assert.match(s.vault(['answer', '--event', '21']).stderr, /Usage: .*--checked/);
  assert.match(s.vault(['answer', '--event', '../21', '--checked', 'x']).stderr, /An event id is letters, digits/);
  assert.match(s.vault(['answer', '--event', '99', '--checked', 'x']).stderr, /No event 07_inbox\/events\/99\.md\. Run inbox first\./);
});
