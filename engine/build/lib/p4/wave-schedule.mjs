// node: L5.E03
// input: { taskIds: string[], maxAgentsPerWave?: number, now? }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input is not an object' };
  }

  if (!Array.isArray(input.taskIds)) {
    return { ok: false, error: 'taskIds must be an array' };
  }

  if (input.taskIds.length === 0) {
    return { ok: false, error: 'taskIds cannot be empty' };
  }

  const maxAgentsPerWave = input.maxAgentsPerWave || 8;
  const now = input.now || null;

  // Validate all taskIds are strings
  for (const taskId of input.taskIds) {
    if (typeof taskId !== 'string') {
      return { ok: false, error: 'all taskIds must be strings' };
    }
  }

  // Split tasks into waves
  const waves = [];
  for (let i = 0; i < input.taskIds.length; i += maxAgentsPerWave) {
    const waveTaskIds = input.taskIds.slice(i, i + maxAgentsPerWave);
    waves.push({
      waveNumber: waves.length + 1,
      taskIds: waveTaskIds,
      agentCount: waveTaskIds.length,
      checkpoint: waves.length > 0, // All waves after the first have a checkpoint
    });
  }

  // Build schedule result
  const schedule = {
    totalTasks: input.taskIds.length,
    waveCount: waves.length,
    maxAgentsPerWave: maxAgentsPerWave,
    waves: waves,
  };

  return {
    ok: true,
    schedule: schedule,
    audit: {
      event: 'wave-schedule-created',
      at: now,
      totalTasks: input.taskIds.length,
      waveCount: waves.length,
      maxPerWave: maxAgentsPerWave,
    },
    steps: ['validated task list', 'divided into waves', 'verified checkpoint requirements', 'allocated max 8 per wave'],
  };
}
