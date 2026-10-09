// node: L5.E03
// input: { agentId, cumulativeTokens, tasksCompleted, isTaskComplete }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { agentId, cumulativeTokens, tasksCompleted, isTaskComplete } = input;

  if (!agentId || typeof agentId !== 'string') {
    return { ok: false, error: 'agentId is required and must be a string' };
  }

  if (cumulativeTokens === undefined || typeof cumulativeTokens !== 'number') {
    return { ok: false, error: 'cumulativeTokens is required and must be a number' };
  }

  if (tasksCompleted === undefined || typeof tasksCompleted !== 'number') {
    return { ok: false, error: 'tasksCompleted is required and must be a number' };
  }

  if (isTaskComplete === undefined || typeof isTaskComplete !== 'boolean') {
    return { ok: false, error: 'isTaskComplete is required and must be a boolean' };
  }

  const TOKEN_TARGET = 50000;
  const overCap = cumulativeTokens > TOKEN_TARGET;

  // Decision: if agent crossed the target, delete at next task boundary
  if (overCap && isTaskComplete) {
    return {
      ok: true,
      action: 'delete',
      agentId,
      cumulativeTokens,
      reason: 'crossed 50000 token target at task boundary',
      deleteAt: 'next-task-boundary',
      trace: {
        node: 'L5.E03',
        steps: [
          `Agent ${agentId} cumulative tokens: ${cumulativeTokens}`,
          `Exceeded target of ${TOKEN_TARGET}`,
          'Agent will be deleted at next task boundary',
          'Not mid-task, but after current task completes'
        ]
      }
    };
  }

  // If task alone exceeds the target, escalate instead of split/kill
  if (input.currentTaskTokens && input.currentTaskTokens > TOKEN_TARGET) {
    return {
      ok: true,
      action: 'escalate',
      agentId,
      cumulativeTokens,
      reason: 'single task exceeds 50000 token target',
      trace: {
        node: 'L5.E03',
        steps: [
          `Task for agent ${agentId} alone exceeds ${TOKEN_TARGET}`,
          'Task will be escalated rather than split or killed mid-task',
          'Escalation handles oversized work'
        ]
      }
    };
  }

  // Otherwise, keep agent alive
  return {
    ok: true,
    action: 'keep',
    agentId,
    cumulativeTokens,
    tasksCompleted,
    tokensRemaining: TOKEN_TARGET - cumulativeTokens,
    trace: {
      node: 'L5.E03',
      steps: [
        `Agent ${agentId} lifecycle evaluated`,
        `Cumulative tokens: ${cumulativeTokens} (target: ${TOKEN_TARGET})`,
        'Agent remains active for next task assignment',
        `Tokens remaining: ${TOKEN_TARGET - cumulativeTokens}`
      ]
    }
  };
}
