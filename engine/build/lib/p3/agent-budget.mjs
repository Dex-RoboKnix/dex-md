// node: L5.E03
// input: { tasks: Array<{id: string, tokens: number}>, budgetPerAgent?: number }

const DEFAULT_BUDGET = 50000;

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid input' };
  }

  const { tasks = [], budgetPerAgent = DEFAULT_BUDGET } = input;

  if (!Array.isArray(tasks)) {
    return { ok: false, error: 'tasks must be array' };
  }

  if (typeof budgetPerAgent !== 'number' || budgetPerAgent <= 0) {
    return { ok: false, error: 'budgetPerAgent must be positive number' };
  }

  const agents = [];
  let currentAgent = { id: 1, tasks: [], usedTokens: 0, remainingBudget: budgetPerAgent };
  const oversizedTasks = [];
  const steps = [];

  for (const task of tasks) {
    if (!task || typeof task !== 'object' || !task.id || typeof task.tokens !== 'number') {
      return { ok: false, error: 'Invalid task structure' };
    }

    const { id, tokens } = task;

    // Check if task exceeds budget
    if (tokens > budgetPerAgent) {
      // Pack oversized task alone
      agents.push({
        id: agents.length + 1,
        tasks: [{ id, tokens }],
        usedTokens: tokens,
        remainingBudget: budgetPerAgent - tokens,
        oversized: true
      });
      oversizedTasks.push({ id, tokens, exceeds: tokens - budgetPerAgent });
      steps.push({ type: 'oversized-task-packed-alone', taskId: id, tokens });
      continue;
    }

    // Check if task fits in current agent
    if (currentAgent.usedTokens + tokens <= budgetPerAgent) {
      currentAgent.tasks.push({ id, tokens });
      currentAgent.usedTokens += tokens;
      currentAgent.remainingBudget -= tokens;
      steps.push({ type: 'task-packed', agentId: currentAgent.id, taskId: id });
    } else {
      // Start new agent
      if (currentAgent.tasks.length > 0) {
        agents.push(currentAgent);
      }
      currentAgent = {
        id: agents.length + 1,
        tasks: [{ id, tokens }],
        usedTokens: tokens,
        remainingBudget: budgetPerAgent - tokens
      };
      steps.push({ type: 'new-agent-created', agentId: currentAgent.id });
    }
  }

  // Add last agent if it has tasks
  if (currentAgent.tasks.length > 0) {
    agents.push(currentAgent);
  }

  return {
    ok: true,
    agentCount: agents.length,
    agents,
    oversizedTasks,
    totalTokensAcrossAgents: agents.reduce((sum, a) => sum + a.usedTokens, 0),
    budgetPerAgent,
    trace: {
      node: 'L5.E03',
      steps
    }
  };
}
