// node: L6.E05
// input: { taskId, loopHistory: [ { round: number, failureClassification: string, affectedItems: string[] }, ... ], now? }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input is not an object' };
  }

  if (!input.taskId) {
    return { ok: false, error: 'taskId is required' };
  }

  if (!Array.isArray(input.loopHistory)) {
    return { ok: false, error: 'loopHistory must be an array' };
  }

  if (input.loopHistory.length < 2) {
    return { ok: false, error: 'loopHistory must have at least 2 rounds to detect stall' };
  }

  const now = input.now || null;

  // Validate all history entries
  for (const entry of input.loopHistory) {
    if (!entry || typeof entry !== 'object') {
      return { ok: false, error: 'loopHistory entries must be objects' };
    }
    if (typeof entry.round !== 'number') {
      return { ok: false, error: 'each loopHistory entry must have a round number' };
    }
    if (!entry.failureClassification || typeof entry.failureClassification !== 'string') {
      return { ok: false, error: 'each loopHistory entry must have failureClassification' };
    }
    if (!Array.isArray(entry.affectedItems)) {
      return { ok: false, error: 'affectedItems must be an array' };
    }
  }

  // Check last two rounds for identical failure pattern
  const sortedHistory = [...input.loopHistory].sort((a, b) => a.round - b.round);
  const lastRound = sortedHistory[sortedHistory.length - 1];
  const secondLastRound = sortedHistory[sortedHistory.length - 2];

  // Normalize item sets for comparison
  const lastItems = new Set(lastRound.affectedItems.sort());
  const secondLastItems = new Set(secondLastRound.affectedItems.sort());

  // Check if sets are identical
  const itemsIdentical = lastItems.size === secondLastItems.size &&
    [...lastItems].every(item => secondLastItems.has(item));

  // Detect stall: same classification and same affected items in consecutive rounds
  const stallDetected = lastRound.failureClassification === secondLastRound.failureClassification &&
    itemsIdentical;

  // Build result
  const result = {
    taskId: input.taskId,
    stallDetected: stallDetected,
    lastRound: lastRound.round,
    secondLastRound: secondLastRound.round,
  };

  if (stallDetected) {
    result.failureClassification = lastRound.failureClassification;
    result.affectedItems = lastRound.affectedItems;
    result.vetoRaised = true;
    result.vetoReason = 'Identical failure pattern detected in two consecutive rounds';
  }

  return {
    ok: true,
    stalled: stallDetected,
    result: result,
    audit: {
      event: stallDetected ? 'stall-detected' : 'no-stall',
      at: now,
      taskId: input.taskId,
      stallDetected: stallDetected,
    },
    steps: ['compared last two rounds', 'checked failure classification match', 'verified affected items match', stallDetected ? 'raised Layer 8 veto' : 'no stall detected'],
  };
}
