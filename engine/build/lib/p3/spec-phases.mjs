// node: L5.E03
// input: { phases: Array<{name: string, tasks: Array}> }

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid input' };
  }

  const { phases } = input;

  if (!Array.isArray(phases)) {
    return { ok: false, error: 'phases must be array' };
  }

  if (phases.length !== 5) {
    return { ok: false, error: `Spec must have exactly 5 phases, found ${phases.length}` };
  }

  const steps = [];
  const phaseStatuses = [];

  for (let i = 0; i < 5; i++) {
    const phase = phases[i];

    if (!phase || typeof phase !== 'object') {
      return { ok: false, error: `Phase ${i} is not a valid object` };
    }

    const { name, tasks } = phase;

    // Check phase name
    if (typeof name !== 'string' || name.trim() === '') {
      return { ok: false, error: `Phase ${i} has blank or missing name` };
    }

    // Check tasks array
    if (!Array.isArray(tasks)) {
      return { ok: false, error: `Phase ${i} tasks must be array` };
    }

    if (tasks.length === 0) {
      return { ok: false, error: `Phase ${i} has zero tasks; requires at least one` };
    }

    phaseStatuses.push({
      index: i,
      name: name.trim(),
      taskCount: tasks.length,
      valid: true
    });

    steps.push({ phase: i, name: name.trim(), taskCount: tasks.length });
  }

  return {
    ok: true,
    phaseCount: 5,
    phaseStatuses,
    totalTasks: phaseStatuses.reduce((sum, p) => sum + p.taskCount, 0),
    trace: {
      node: 'L5.E03',
      steps
    }
  };
}
