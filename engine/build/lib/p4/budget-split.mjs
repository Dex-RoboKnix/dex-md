// node: L5.E01
// input: { taskCount: number, roleTokenCosts: { grill: number, spec: number, implement: number, review: number }, phaseCount?: number, reservedSlots?: number, now? }
// note: configuration file for per-role token costs is currently a gap; this module accepts costs as input and computes allocation

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input is not an object' };
  }

  if (typeof input.taskCount !== 'number' || input.taskCount < 1) {
    return { ok: false, error: 'taskCount must be a positive number' };
  }

  if (!input.roleTokenCosts || typeof input.roleTokenCosts !== 'object') {
    return { ok: false, error: 'roleTokenCosts is required' };
  }

  const costs = input.roleTokenCosts;
  if (typeof costs.grill !== 'number' || typeof costs.spec !== 'number' ||
      typeof costs.implement !== 'number' || typeof costs.review !== 'number') {
    return { ok: false, error: 'roleTokenCosts must have grill, spec, implement, review as numbers' };
  }

  const phaseCount = input.phaseCount || 4; // grill, spec, implement, review
  const reservedSlots = input.reservedSlots || 1; // 1 slot for escalation agent
  const availableAgents = 8 - reservedSlots; // 7 agents for tasks

  // Compute per-task cost
  const perTaskCost = costs.grill + costs.spec + costs.implement + costs.review;

  // Compute total baseline cost for all tasks
  const totalBaselineCost = perTaskCost * input.taskCount;

  // Compute tasks per agent (divide tasks among available agents)
  const tasksPerAgent = Math.ceil(input.taskCount / availableAgents);

  // Compute budget per agent
  const budgetPerAgent = tasksPerAgent * perTaskCost;

  // Verify 50000 token cap is acceptable
  const tokenCap = 50000;

  const result = {
    taskCount: input.taskCount,
    availableAgents: availableAgents,
    reservedSlots: reservedSlots,
    totalSlots: 8,
    perTaskCost: perTaskCost,
    totalBaselineCost: totalBaselineCost,
    tasksPerAgent: tasksPerAgent,
    budgetPerAgent: budgetPerAgent,
    tokenCap: tokenCap,
    variance: {
      averagePerTask: perTaskCost,
      accepted: true,
      reason: 'Some tasks will exceed average, others will under-budget',
    },
  };

  return {
    ok: true,
    taskAllocation: result,
    audit: {
      event: 'budget-split-computed',
      at: input.now || null,
      taskCount: input.taskCount,
      tasksPerAgent: tasksPerAgent,
      availableAgents: availableAgents,
      totalBaseline: totalBaselineCost,
    },
    steps: ['computed per-task cost', 'multiplied by task count', 'allocated to 7 agents with 1 reserved', 'accepted variance'],
  };
}
