// node: L5.E03
// input: { taskCount: number, roleTokenCosts: { grill: number, spec: number, implement: number, review: number }, escalationCost?: number, willEscalate?: boolean, now? }
// note: configuration file for per-role token costs and escalation overhead model is a gap

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

  const now = input.now || null;

  // Compute baseline cost
  const perTaskCost = costs.grill + costs.spec + costs.implement + costs.review;
  const baselineCost = perTaskCost * input.taskCount;

  // Compute escalation cost only if escalation occurs
  const escalationCost = input.willEscalate ? (input.escalationCost || 15000) : 0;
  const totalCost = baselineCost + escalationCost;

  // Build estimate result
  const estimate = {
    taskCount: input.taskCount,
    perTaskCost: perTaskCost,
    baselineCost: baselineCost,
    escalationCost: escalationCost,
    willEscalate: input.willEscalate || false,
    totalCost: totalCost,
    costPerTask: Math.round(totalCost / input.taskCount),
  };

  return {
    ok: true,
    estimate: estimate,
    audit: {
      event: 'cost-estimate-computed',
      at: now,
      taskCount: input.taskCount,
      baselineCost: baselineCost,
      escalationCost: escalationCost,
      totalCost: totalCost,
    },
    steps: ['computed per-role costs', 'multiplied by task count', 'added escalation cost when triggered', 'produced total token estimate'],
  };
}
