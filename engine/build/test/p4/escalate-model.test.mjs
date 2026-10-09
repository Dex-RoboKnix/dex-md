import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p4/escalate-model.mjs';

const base = { taskId: 'task-7', priorAttempts: [{ id: 'a1' }, { id: 'a2' }], configuredRoles: ['tester', 'devops'], escalationBriefId: 'brief-9', now: '2026-10-09T10:00:00Z' };

test('T03.1 the orchestrator assembles a Sonnet team per configured role', () => {
  const r = run(base);
  assert.equal(r.ok, true);
  assert.deepEqual(r.escalationTeam.team.map((m) => [m.role, m.model]), [['tester', 'sonnet'], ['devops', 'sonnet']]);
  assert.equal(r.escalationTeam.totalAgents, 3);
  assert.deepEqual(run({ ...base, configuredRoles: { tester: 1, devops: 1 } }).escalationTeam.team.length, 2);
});

test('T03.2 the Opus agent is the lead', () => {
  const r = run(base);
  assert.equal(r.escalationTeam.lead.model, 'opus');
  assert.equal(r.escalationTeam.lead.role, 'lead');
});

test('T03.3 the lead must read the brief, the task and every prior attempt before acting', () => {
  const r = run(base);
  assert.equal(r.context.readBeforeActing, true);
  assert.deepEqual(r.context.mustRead, ['brief:brief-9', 'task:task-7', 'attempt:1:a1', 'attempt:2:a2']);
  assert.equal(r.context.priorAttemptCount, 2);
});

test('T03.4 the team composition is logged with model types and agent ids', () => {
  const r = run(base);
  assert.equal(r.audit.event, 'escalation-team-assembled');
  assert.equal(r.audit.at, '2026-10-09T10:00:00Z');
  assert.deepEqual(r.audit.members.map((m) => m.model), ['opus', 'sonnet', 'sonnet']);
  assert.ok(r.audit.members.every((m) => typeof m.agentId === 'string' && m.agentId));
  assert.equal(r.effects[0].kind, 'append-log');
  assert.match(r.effects[0].content, /opus:opus-task-7-lead/);
});

test('T03.5 the outcome is recorded and a failure terminates the task', () => {
  const fail = run({ ...base, outcome: 'fail' });
  assert.equal(fail.terminated, true);
  assert.equal(fail.outcomeAudit.outcome, 'fail');
  assert.equal(fail.outcomeAudit.terminated, true);
  assert.match(fail.effects.at(-1).content, /task terminates/);
  const pass = run({ ...base, outcome: 'pass' });
  assert.equal(pass.terminated, false);
  assert.equal(run(base).terminated, false);
});

test('the escalation team respects the 8-agent live limit', () => {
  assert.equal(run({ ...base, configuredRoles: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] }).ok, false); // 8 roles + lead = 9
  assert.equal(run({ ...base, configuredRoles: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }).ok, true); // 7 roles + lead = 8, exactly the limit
});

test('malformed input is rejected and never throws', () => {
  for (const bad of [undefined, null, 5, '', [], {}, { ...base, taskId: '' }, { ...base, priorAttempts: 'x' }, { ...base, configuredRoles: null }, { ...base, configuredRoles: [''] }, { ...base, outcome: 'maybe' }, { ...base, escalationBriefId: 5 }]) {
    const r = run(bad);
    assert.equal(r.ok, false);
    assert.equal(typeof r.error, 'string');
  }
});

test('no mutation and the same output twice', () => {
  const input = structuredClone(base);
  const a = run(input), b = run(input);
  assert.deepEqual(input, base);
  assert.deepEqual(a, b);
});

test('audit time is null when input.now is absent; trace carries the node', () => {
  const { now, ...noNow } = base;
  assert.equal(run(noNow).audit.at, null);
  assert.equal(run(base).trace.node, 'L2.E02');
});
