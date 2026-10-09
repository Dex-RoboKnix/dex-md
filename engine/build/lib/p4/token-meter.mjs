// node: L5.E02
// input: { agentId, tokensUsedThisAction, cumulativeTokensBefore, actionOutcome }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { agentId, tokensUsedThisAction, cumulativeTokensBefore, actionOutcome } = input;

  if (!agentId || typeof agentId !== 'string') {
    return { ok: false, error: 'agentId is required and must be a string' };
  }

  if (tokensUsedThisAction === undefined || typeof tokensUsedThisAction !== 'number') {
    return { ok: false, error: 'tokensUsedThisAction is required and must be a number' };
  }

  if (cumulativeTokensBefore === undefined || typeof cumulativeTokensBefore !== 'number') {
    return { ok: false, error: 'cumulativeTokensBefore is required and must be a number' };
  }

  if (actionOutcome === undefined || typeof actionOutcome !== 'string') {
    return { ok: false, error: 'actionOutcome is required and must be a string' };
  }

  const THRESHOLD = 50000;

  // Sum is computed after each agent action completes
  // All tokens used count toward cap regardless of outcome
  const newCumulative = cumulativeTokensBefore + tokensUsedThisAction;

  // Flag is raised only when cumulative sum exceeds 50000
  const overThreshold = newCumulative > THRESHOLD;

  return {
    ok: true,
    agentId,
    cumulativeTokensBefore,
    tokensUsedThisAction,
    newCumulative,
    actionOutcome,
    overThreshold,
    flag: overThreshold ? 'exceeded' : null,
    trace: {
      node: 'L5.E02',
      steps: [
        `Agent ${agentId} action completed with outcome: ${actionOutcome}`,
        `Tokens used this action: ${tokensUsedThisAction}`,
        `Cumulative before: ${cumulativeTokensBefore}`,
        `Cumulative after: ${newCumulative}`,
        overThreshold ? `FLAG: Cumulative sum (${newCumulative}) exceeds ${THRESHOLD}` : `Remaining tokens: ${THRESHOLD - newCumulative}`
      ]
    }
  };
}
