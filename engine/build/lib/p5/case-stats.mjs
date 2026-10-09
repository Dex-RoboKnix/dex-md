// node: L5.E05
// input: { cases: [{ task_id, attempts, outcome: 'pass'|'fail'|'abandoned'|'escalated-and-resolved' }], now?: string }

export function run(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.cases)) {
    return { ok: false, error: 'input.cases must be an array' };
  }

  const cases = input.cases;
  if (cases.length === 0) {
    return { ok: false, error: 'cases array cannot be empty' };
  }

  let passCount = 0;
  let failCount = 0;
  let abandonedCount = 0;
  let escalatedCount = 0;
  let totalAttempts = 0;
  const steps = [];

  for (const c of cases) {
    if (!c || typeof c !== 'object' || !c.outcome) {
      return { ok: false, error: 'each case must have an outcome field' };
    }
    switch (c.outcome) {
      case 'pass':
        passCount++;
        break;
      case 'fail':
        failCount++;
        break;
      case 'abandoned':
        abandonedCount++;
        break;
      case 'escalated-and-resolved':
        escalatedCount++;
        break;
      default:
        return { ok: false, error: `invalid outcome: ${c.outcome}` };
    }
    if (typeof c.attempts === 'number' && c.attempts > 0) {
      totalAttempts += c.attempts;
    }
    steps.push({ task_id: c.task_id, outcome: c.outcome, attempts: c.attempts });
  }

  const denominator = passCount + failCount;
  if (denominator === 0) {
    return { ok: false, error: 'no pass or fail cases to compute pass rate' };
  }

  const passRate = Number((passCount / denominator).toFixed(1));
  const meanAttempts = Number((totalAttempts / cases.length).toFixed(1));

  return {
    ok: true,
    passRate,
    meanAttempts,
    abandonedCount,
    escalatedCount,
    trace: {
      node: 'L5.E05',
      steps
    }
  };
}
