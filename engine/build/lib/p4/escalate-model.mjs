// node: L2.E02
// input: { taskId: string, priorAttempts: object[], configuredRoles: string[] | object, escalationBriefId?: string, outcome?: 'pass' | 'fail', now?: string }

const MAX_LIVE = 8; // at most 8 live agents; the escalation lead is one of them

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'input must be an object' };
  }
  const { taskId, priorAttempts, configuredRoles, escalationBriefId, outcome, now } = input;
  if (!taskId || typeof taskId !== 'string') return { ok: false, error: 'taskId is required and must be a string' };
  if (!Array.isArray(priorAttempts)) return { ok: false, error: 'priorAttempts is required and must be an array' };
  if (!configuredRoles || typeof configuredRoles !== 'object') return { ok: false, error: 'configuredRoles is required and must be an array or object' };
  if (escalationBriefId !== undefined && typeof escalationBriefId !== 'string') return { ok: false, error: 'escalationBriefId must be a string' };
  if (outcome !== undefined && !['pass', 'fail'].includes(outcome)) return { ok: false, error: "outcome must be 'pass' or 'fail'" };

  // acceptance 1: the orchestrator assembles a Sonnet team per configured role
  const roles = Array.isArray(configuredRoles) ? configuredRoles : Object.keys(configuredRoles);
  if (roles.some((r) => typeof r !== 'string' || r === '')) return { ok: false, error: 'every configured role must be a non-empty string' };
  if (roles.length + 1 > MAX_LIVE) return { ok: false, error: `the escalation team (${roles.length + 1} agents) exceeds the live-agent limit of ${MAX_LIVE}` };

  const team = roles.map((role, i) => ({ role, model: 'sonnet', agentId: `sonnet-${taskId}-${role}-${i + 1}` }));
  // acceptance 2: the Opus agent is the lead
  const lead = { role: 'lead', model: 'opus', agentId: `opus-${taskId}-lead` };

  // acceptance 3: what the lead must read before starting (the full task context and every prior attempt)
  const context = {
    mustRead: [
      ...(escalationBriefId ? [`brief:${escalationBriefId}`] : []),
      `task:${taskId}`,
      ...priorAttempts.map((a, i) => `attempt:${i + 1}${a && typeof a === 'object' && a.id ? ':' + a.id : ''}`),
    ],
    priorAttemptCount: priorAttempts.length,
    readBeforeActing: true,
  };

  const steps = [`assembled escalation team for task ${taskId}`, `Opus lead: ${lead.agentId}`, `Sonnet team: ${team.length} agent(s)`, `lead reads ${context.mustRead.length} item(s) before acting`];
  const result = { ok: true, taskId, escalationTeam: { lead, team, totalAgents: team.length + 1 }, escalationBriefId: escalationBriefId ?? null, context };

  // acceptance 4: the team composition is logged with model types and agent ids
  result.audit = {
    event: 'escalation-team-assembled',
    at: now || null,
    taskId,
    members: [lead, ...team].map((m) => ({ model: m.model, agentId: m.agentId, role: m.role })),
  };
  result.effects = [{ kind: 'append-log', path: 'logs/escalation.md', content: `${now || 'undated'} ${taskId}: ${[lead, ...team].map((m) => `${m.model}:${m.agentId}`).join(', ')}` }];

  // acceptance 5: the outcome is recorded; a failure terminates the task
  if (outcome) {
    result.outcome = outcome;
    result.terminated = outcome === 'fail';
    result.outcomeAudit = { event: 'escalation-outcome', at: now || null, taskId, outcome, terminated: outcome === 'fail' };
    result.effects.push({ kind: 'append-log', path: 'logs/escalation.md', content: `${now || 'undated'} ${taskId}: outcome ${outcome}${outcome === 'fail' ? ' (task terminates)' : ''}` });
    steps.push(`outcome ${outcome}${outcome === 'fail' ? ': task terminates' : ''}`);
  } else {
    result.terminated = false;
  }
  result.trace = { node: 'L2.E02', steps };
  return result;
}
