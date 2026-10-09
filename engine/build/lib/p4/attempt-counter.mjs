// node: L6.E07
// input: { taskId, reviewRound, completed }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { taskId, reviewRound, completed } = input;

  if (!taskId || typeof taskId !== 'string') {
    return { ok: false, error: 'taskId is required and must be a string' };
  }

  if (reviewRound === undefined || typeof reviewRound !== 'number') {
    return { ok: false, error: 'reviewRound is required and must be a number' };
  }

  if (completed !== true) {
    return { ok: false, error: 'completed must be true to increment counter' };
  }

  // Counter increments once per completed review round
  // The count reflects how many rounds have been completed
  const attemptCount = reviewRound;

  return {
    ok: true,
    attemptCount,
    taskId,
    reviewRound,
    trace: {
      node: 'L6.E07',
      steps: [
        `Validated input for taskId ${taskId}`,
        `Incremented counter for review round ${reviewRound}`,
        `Counter now reflects ${attemptCount} completed round(s)`
      ]
    }
  };
}
