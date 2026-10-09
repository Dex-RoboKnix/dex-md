// node: L6.E03
// input: { taskId, currentPhase, reviewPassed, outputComplete, attempt }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { taskId, currentPhase, reviewPassed, outputComplete, attempt } = input;

  if (!taskId || typeof taskId !== 'string') {
    return { ok: false, error: 'taskId is required and must be a string' };
  }

  if (!currentPhase || typeof currentPhase !== 'string') {
    return { ok: false, error: 'currentPhase is required and must be a string' };
  }

  if (reviewPassed === undefined || typeof reviewPassed !== 'boolean') {
    return { ok: false, error: 'reviewPassed is required and must be a boolean' };
  }

  if (outputComplete === undefined || typeof outputComplete !== 'boolean') {
    return { ok: false, error: 'outputComplete is required and must be a boolean' };
  }

  const phases = ['grill', 'spec', 'implement', 'review'];

  if (!phases.includes(currentPhase)) {
    return { ok: false, error: `currentPhase must be one of: ${phases.join(', ')}` };
  }

  // Loop state machine
  const phaseIndex = phases.indexOf(currentPhase);

  // If current phase is implement and output is incomplete, return to implement
  if (currentPhase === 'implement' && !outputComplete) {
    return {
      ok: true,
      action: 'loop-to-implement',
      nextPhase: 'implement',
      taskId,
      attempt,
      trace: {
        node: 'L6.E03',
        steps: [
          `Implement phase incomplete output detected`,
          'Loop returns to implement without review',
          'Output completion required before proceeding'
        ]
      }
    };
  }

  // If current phase is review
  if (currentPhase === 'review') {
    if (reviewPassed) {
      // Successful review: task complete and exit loop
      return {
        ok: true,
        action: 'complete',
        nextPhase: null,
        taskId,
        attempt,
        taskStatus: 'passed',
        trace: {
          node: 'L6.E03',
          steps: [
            'Review phase passed',
            'Task completes and loop exits',
            'Task ready for acceptance'
          ]
        }
      };
    } else {
      // Failed review: return to spec with delta requirement
      return {
        ok: true,
        action: 'loop-to-spec',
        nextPhase: 'spec',
        requireDelta: true,
        taskId,
        attempt,
        trace: {
          node: 'L6.E03',
          steps: [
            'Review phase failed',
            'Grill phase is skipped on retry',
            'Loop returns to spec with delta requirement',
            'Spec and implement phases repeat'
          ]
        }
      };
    }
  }

  // Standard phase progression: grill -> spec -> implement -> review
  const nextPhaseIndex = phaseIndex + 1;
  const nextPhase = phases[nextPhaseIndex];

  return {
    ok: true,
    action: 'loop-to-next',
    nextPhase,
    taskId,
    attempt,
    trace: {
      node: 'L6.E03',
      steps: [
        `Completed ${currentPhase} phase`,
        `Transitioning to ${nextPhase} phase`,
        'Loop continues through lifecycle'
      ]
    }
  };
}
