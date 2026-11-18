import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { sandbox, comment } from './inbox-sandbox.mjs';

// Timers and a quiet outbox, run through the built tool from a sandbox (GitHub stubbed where it is needed).
const front = (file) => Object.fromEntries(/^---\n([\s\S]*?)\n---\n/.exec(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'))[1].split('\n').map((l) => [l.slice(0, l.indexOf(': ')), l.slice(l.indexOf(': ') + 2)]));

test('a follow-up that is due becomes one event at the next pull, then is done; a second pull adds nothing', () => {
  const s = sandbox();
  const add = s.vault(['timer', 'add', '--due', '2026-11-18T09:00:00Z', '--skill', 'dex-loop', '--issue', '115', '--note', 'Check the Mozilla form', '--now', '2026-11-17T20:00:00Z']);
  assert.equal(add.status, 0, add.stderr);
  assert.match(add.stdout, /^Timer set 07_inbox\/timers\/dex-loop-115-20261118t0900\.md: once, at 2026-11-18T09:00:00\.000Z: Check the Mozilla form$/m);
  assert.equal(s.vault(['inbox', '--now', '2026-11-18T08:00:00Z']).stdout.trim(), 'Inbox: no held question names an issue, so no late answer can arrive. Nothing read.', 'not due yet');
  const r = s.vault(['inbox', '--now', '2026-11-18T09:05:00Z']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Timer due 07_inbox\/events\/t-dex-loop-115-20261118t0900-20261118T0900\.md: dex-loop #115: Check the Mozilla form$/m);
  assert.match(r.stdout, /Inbox: 0 new event\(s\) in 07_inbox\/events\/\. 1 timer\(s\) came due\./);
  assert.deepEqual(s.list(), ['t-dex-loop-115-20261118t0900-20261118T0900.md']);
  assert.equal(front(path.join(s.vaultDir, '07_inbox', 'timers', 'dex-loop-115-20261118t0900.md')).status, 'done');
  const again = s.vault(['inbox', '--now', '2026-11-18T10:00:00Z']);
  assert.doesNotMatch(again.stdout, /Timer due/);
  assert.equal(s.list().length, 1);
  assert.ok(!fs.existsSync(s.lock));
});

test('a schedule moves to its next time; resume shows what is due; timer done closes it', () => {
  const s = sandbox();
  assert.equal(s.vault(['timer', 'add', '--due', '2026-11-18T09:00:00Z', '--every', '1d', '--skill', 'dex-checkpoint', '--note', 'Daily digest']).status, 0);
  const r = s.vault(['inbox', '--now', '2026-11-25T10:00:00Z']);
  assert.match(r.stdout, /Timer due .*: dex-checkpoint: Daily digest \(next: 2026-11-26T09:00:00\.000Z\)/);
  assert.equal(s.list().length, 1, 'a week away fires it once');
  const t = front(path.join(s.vaultDir, '07_inbox', 'timers', 'dex-checkpoint-20261118t0900.md'));
  assert.deepEqual([t.status, t.due], ['waiting', '2026-11-26T09:00:00.000Z']);
  const res = s.vault(['resume']);
  assert.equal(res.status, 0, res.stderr);
  const id = s.list()[0].slice(0, -3);
  assert.match(res.stdout, new RegExp(`^Due: dex-checkpoint \\(timer dex-checkpoint-20261118t0900, due 2026-11-18T09:00:00\\.000Z\\): Daily digest\\n    When it is done: node dex-vault/\\.dex/vault\\.mjs timer done --event ${id}\\n$`));
  assert.equal(s.vault(['timer', 'done', '--event', id]).status, 0);
  assert.equal(s.vault(['resume']).stdout.trim(), 'nothing held');
  assert.match(s.vault(['timer', 'done', '--event', id]).stderr, /already done/);
  assert.match(s.vault(['timer', 'list']).stdout, /^2026-11-26T09:00:00\.000Z {2}dex-checkpoint \(every 1d\): Daily digest {2}\[dex-checkpoint-20261118t0900\]$/m);
});

test('due timers still fire when GitHub cannot be read', () => {
  const s = sandbox({ issues: { 115: [comment(1)] } });
  s.park();
  assert.equal(s.vault(['timer', 'add', '--due', '2026-11-18T09:00:00Z', '--skill', 'dex-loop', '--note', 'Follow up']).status, 0);
  const r = s.vault(['inbox', '--now', '2026-11-18T09:05:00Z'], path.join(s.root, 'no-such-gh'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Inbox: the GitHub CLI \(gh\) is not installed here, so late answers were not read\.$/m);
  assert.match(r.stdout, /Timer due /);
  assert.deepEqual(s.list().filter((f) => f.startsWith('t-')).length, 1);
  assert.ok(!s.list().includes('1.md'));
});

test('a timer file that cannot be read is listed as waiting for the owner, never dropped silently', () => {
  const s = sandbox();
  assert.equal(s.vault(['timer', 'add', '--due', '2026-11-18T09:00:00Z', '--skill', 'dex-loop', '--note', 'Ping']).status, 0);
  const f = path.join(s.vaultDir, '07_inbox', 'timers', 'dex-loop-20261118t0900.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/\n## The note\n\nPing\n$/, '\n'));
  const r = s.vault(['inbox', '--now', '2026-11-18T10:00:00Z']);
  assert.match(r.stdout, /^Waiting for the owner: 07_inbox\/timers\/dex-loop-20261118t0900\.md: the note is empty\. Not fired\.$/m);
  assert.deepEqual(s.list(), []);
});

test('timer add refuses a bad time, period, skill or issue, and writes nothing', () => {
  const s = sandbox();
  for (const args of [['--due', 'soon'], ['--due', '2026-11-18T09:00:00Z', '--every', '1y'], ['--due', '2026-11-18T09:00:00Z', '--skill', 'Bad Skill'], ['--due', '2026-11-18T09:00:00Z', '--issue', '../1']]) {
    const r = s.vault(['timer', 'add', '--skill', 'dex-loop', '--note', 'x', ...args]);
    assert.notEqual(r.status, 0, args.join(' '));
  }
  assert.ok(!fs.existsSync(path.join(s.vaultDir, '07_inbox', 'timers')));
});

test('digest: nothing new sends nothing and writes nothing', () => {
  const s = sandbox();
  const r = s.vault(['digest', '--now', '2026-11-18T09:00:00Z']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'Digest: nothing new since the last one. Nothing to send.');
  assert.ok(!fs.existsSync(path.join(s.vaultDir, '06_journal', 'reported.md')));
});

test('digest: tells each thing once, records it in reported.md, and sends at most one a day unless asked', () => {
  const s = sandbox({ issues: { 115: [comment(31, { body: 'agree' })] } });
  s.park();
  assert.equal(s.vault(['inbox']).status, 0);
  const first = s.vault(['digest', '--now', '2026-11-18T09:00:00Z', '--channel', 'phone']);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /^Dex digest, 2026-11-18: 2 new\.\n\nAnswers in:\n- owner answered on #115: agree\n\nWaiting for you:\n- dex-loop #115: Which phase first\?\n/);
  assert.match(first.stdout, /Digest: 2 item\(s\) recorded in 06_journal\/reported\.md\. Send this as one message now\./);
  const rep = fs.readFileSync(path.join(s.vaultDir, '06_journal', 'reported.md'), 'utf8');
  assert.match(rep, /^\| 2026-11-18 \| 09:00 \| phone \| answer \| event:31 \| owner answered on #115: agree \|$/m);
  assert.match(rep, /^\| 2026-11-18 \| 09:00 \| phone \| digest \| digest:2026-11-18T09:00:00\.000Z \| 2 item\(s\) \|$/m);
  const again = s.vault(['digest', '--now', '2026-11-18T12:00:00Z']);
  assert.equal(again.stdout.trim(), 'Digest: nothing new since the last one. Nothing to send.');
  assert.equal(s.vault(['timer', 'add', '--due', '2026-11-18T10:00:00Z', '--skill', 'dex-loop', '--note', 'Ping']).status, 0);
  assert.equal(s.vault(['inbox', '--now', '2026-11-18T11:00:00Z']).status, 0);
  const capped = s.vault(['digest', '--now', '2026-11-18T12:00:00Z']);
  assert.equal(capped.stdout.trim(), "Digest: one a day, and today's was already sent. 1 new item(s) wait for tomorrow's, or for --asked if the owner asks.");
  const asked = s.vault(['digest', '--now', '2026-11-18T12:00:00Z', '--asked']);
  assert.match(asked.stdout, /Reminders due:\n- dex-loop: Ping/);
  assert.doesNotMatch(asked.stdout, /agree/, 'what was told this morning is not told again');
});

test('digest: an old run log is not replayed; runs since the last digest are', () => {
  const s = sandbox();
  fs.writeFileSync(path.join(s.vaultDir, 'RUNLOG.md'), '| Run | Date | Mode | Version | Summary |\n|---|---|---|---|---|\n| 1 | 2026-10-01 | checkpoint | 0.11.3 | old work |\n| 2 | 2026-11-18 | checkpoint | 0.11.3 | phase 4 built |\n');
  const r = s.vault(['digest', '--now', '2026-11-18T09:00:00Z']);
  assert.match(r.stdout, /Done since the last digest:\n- run 2: phase 4 built/);
  assert.doesNotMatch(r.stdout, /old work/);
});
