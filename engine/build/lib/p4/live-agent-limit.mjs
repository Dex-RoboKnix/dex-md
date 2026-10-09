// node: L5.E03
// input: { liveAgentCount, taskQueueLength, agentIdToSpawn }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { liveAgentCount, taskQueueLength, agentIdToSpawn } = input;

  if (liveAgentCount === undefined || typeof liveAgentCount !== 'number') {
    return { ok: false, error: 'liveAgentCount is required and must be a number' };
  }

  if (taskQueueLength === undefined || typeof taskQueueLength !== 'number') {
    return { ok: false, error: 'taskQueueLength is required and must be a number' };
  }

  const MAX_LIVE_AGENTS = 8;

  // Pre-spawn check: live agent count checked before spawn is issued
  if (liveAgentCount >= MAX_LIVE_AGENTS) {
    // Spawn refused if 8 agents are already live
    return {
      ok: true,
      action: 'queue',
      liveAgentCount,
      taskQueueLength,
      reason: 'live agent count at or above maximum of 8',
      spawned: false,
      queuedFor: true,
      trace: {
        node: 'L5.E03',
        steps: [
          `Live agent check: ${liveAgentCount}/${MAX_LIVE_AGENTS}`,
          'At capacity; spawn refused',
          `Task queued (queue length: ${taskQueueLength + 1})`,
          'Spawn will resume as agents complete and are recycled'
        ]
      }
    };
  }

  // New agent can spawn immediately if count is below 8
  return {
    ok: true,
    action: 'spawn',
    liveAgentCount,
    taskQueueLength,
    agentIdToSpawn,
    newLiveCount: liveAgentCount + 1,
    spawned: true,
    trace: {
      node: 'L5.E03',
      steps: [
        `Live agent check: ${liveAgentCount}/${MAX_LIVE_AGENTS}`,
        'Under capacity; spawn permitted',
        `Agent ${agentIdToSpawn} will be spawned`,
        `New live count will be: ${liveAgentCount + 1}`
      ]
    }
  };
}
