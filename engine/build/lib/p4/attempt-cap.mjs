// node: L2.E07
// input: { attemptCount, reviewPassed, delta, escalationOutcome }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { attemptCount, reviewPassed, delta, escalationOutcome } = input;

  if (attemptCount === undefined || typeof attemptCount !== 'number') {
    return { ok: false, error: 'attemptCount is required and must be a number' };
  }

  if (reviewPassed === undefined || typeof reviewPassed !== 'boolean') {
    return { ok: false, error: 'reviewPassed is required and must be a boolean' };
  }

  // Detect blind retry: empty or missing delta when review fails
  if (!reviewPassed && (!delta || (typeof delta === 'string' && delta.trim() === ''))) {
    return {
      ok: false,
      error: 'blind retry rejected: empty delta without material change',
      trace: {
        node: 'L2.E07',
        steps: [
          'Checked for blind retry condition',
          'Delta is empty or missing on review failure',
          'Rejected without incrementing attempt count'
        ]
      }
    };
  }

  // If review passed, task succeeds
  if (reviewPassed) {
    return {
      ok: true,
      action: 'continue',
      taskStatus: 'passed',
      trace: {
        node: 'L2.E07',
        steps: [
          `Review passed at attempt ${attemptCount}`,
          'Task continues to completion'
        ]
      }
    };
  }

  // Review failed: check if we've hit the cap
  if (attemptCount >= 2) {
    // Hard cap reached: escalate immediately
    return {
      ok: true,
      action: 'escalate',
      attemptCount,
      escalationTriggered: true,
      escalationOutcome: escalationOutcome || null,
      trace: {
        node: 'L2.E07',
        steps: [
          `Review failure at attempt ${attemptCount}`,
          'Attempt cap of 2 reached',
          'Escalation action triggered immediately',
          'Escalation is final decision boundary'
        ]
      }
    };
  }

  // Review failed, but under cap: retry
  return {
    ok: true,
    action: 'retry',
    attemptCount,
    nextAttempt: attemptCount + 1,
    trace: {
      node: 'L2.E07',
      steps: [
        `Review failure at attempt ${attemptCount}`,
        'Under attempt cap of 2',
        'Retry permitted with delta requirement'
      ]
    }
  };
}
