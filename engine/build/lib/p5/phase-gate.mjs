// node: L1.E05
// input: { tasks: [{ id, status: 'pass'|'fail'|'abandoned'|'escalated-and-resolved'|'never-run' }], escalated_approval?: boolean, layer8_name?: string, layer8_date?: string, layer8_waivers?: string[] }

export function run(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.tasks)) {
    return { ok: false, error: 'input.tasks must be an array' };
  }

  const tasks = input.tasks;
  if (tasks.length === 0) {
    return { ok: false, error: 'tasks array cannot be empty' };
  }

  const validStatuses = ['pass', 'fail', 'abandoned', 'escalated-and-resolved', 'never-run'];
  const waivers = Array.isArray(input.layer8_waivers) ? input.layer8_waivers : [];
  const steps = [];

  let hasEscalated = false;
  let hasNeverRun = false;
  const neverRunIds = [];

  for (const task of tasks) {
    if (!task || !task.status || !validStatuses.includes(task.status)) {
      return { ok: false, error: `invalid task status: ${task?.status}` };
    }
    if (task.status === 'escalated-and-resolved') {
      hasEscalated = true;
    }
    if (task.status === 'never-run') {
      hasNeverRun = true;
      neverRunIds.push(task.id);
    }
    steps.push({ id: task.id, status: task.status });
  }

  // Check escalated-and-resolved requires approval
  if (hasEscalated && !input.escalated_approval) {
    return { ok: false, error: 'escalated-and-resolved tasks require Layer 8 approval' };
  }

  // Check never-run tasks are either not present or waived
  if (hasNeverRun) {
    const neverRunWaived = neverRunIds.every(id => waivers.includes(id));
    if (!neverRunWaived) {
      const unwaived = neverRunIds.filter(id => !waivers.includes(id));
      return { ok: false, error: `never-run tasks block phase: ${unwaived.join(', ')}` };
    }
  }

  // Phase passes
  const gatesPassed = {
    terminalStatuses: true,
    escalatedApproval: hasEscalated ? input.escalated_approval : true,
    neverRunHandled: !hasNeverRun || hasNeverRun && neverRunIds.every(id => waivers.includes(id))
  };

  return {
    ok: true,
    phasePasses: true,
    gatesPassed,
    layer8Name: input.layer8_name || null,
    layer8Date: input.layer8_date || null,
    trace: {
      node: 'L1.E05',
      steps
    }
  };
}
