// node: L5.E03
// input: { deltas: Array<{taskId?: string, change: any}>, tasks: Array<{id: string}> }

import { createHash } from 'node:crypto';

function generateHash(content) {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid input' };
  }

  const { deltas = [], tasks = [] } = input;

  if (!Array.isArray(deltas)) {
    return { ok: false, error: 'deltas must be array' };
  }

  if (!Array.isArray(tasks)) {
    return { ok: false, error: 'tasks must be array' };
  }

  // Build a map of task IDs for validation
  const taskIds = new Set(tasks.map(t => t.id));

  // Apply deltas in order
  const mergedContent = {};
  const steps = [];
  let hasInvalidReference = false;
  let invalidRef = null;

  for (let i = 0; i < deltas.length; i++) {
    const delta = deltas[i];

    if (!delta || typeof delta !== 'object') {
      return { ok: false, error: `Delta ${i} is not a valid object` };
    }

    const { taskId, change } = delta;

    // Validate task reference if present
    if (taskId && !taskIds.has(taskId)) {
      hasInvalidReference = true;
      invalidRef = taskId;
      break;
    }

    // Apply delta (last write wins)
    if (change && typeof change === 'object') {
      Object.assign(mergedContent, change);
    }

    steps.push({ delta: i, applied: !hasInvalidReference });
  }

  if (hasInvalidReference) {
    return {
      ok: false,
      error: `Delta references non-existent task: ${invalidRef}`
    };
  }

  // Generate deterministic hash
  const contentHash = generateHash(mergedContent);

  return {
    ok: true,
    mergedContent,
    contentHash,
    deltaCount: deltas.length,
    trace: {
      node: 'L5.E03',
      steps
    }
  };
}
