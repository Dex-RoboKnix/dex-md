// node: L2.E07
// input: { taskId, priorSpec: string, priorOutputs: string[], reviewFeedback: string, failureClassifications: string[], priorAgentAttempts: { agentId: string, model: string }[], vaultLogPath: string, now? }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input is not an object' };
  }

  if (!input.taskId) {
    return { ok: false, error: 'taskId is required' };
  }

  if (!input.priorSpec || typeof input.priorSpec !== 'string') {
    return { ok: false, error: 'priorSpec is required' };
  }

  if (!Array.isArray(input.priorOutputs)) {
    return { ok: false, error: 'priorOutputs must be an array' };
  }

  if (!input.reviewFeedback || typeof input.reviewFeedback !== 'string') {
    return { ok: false, error: 'reviewFeedback is required' };
  }

  if (!Array.isArray(input.failureClassifications)) {
    return { ok: false, error: 'failureClassifications must be an array' };
  }

  if (!Array.isArray(input.priorAgentAttempts)) {
    return { ok: false, error: 'priorAgentAttempts must be an array' };
  }

  if (!input.vaultLogPath || typeof input.vaultLogPath !== 'string') {
    return { ok: false, error: 'vaultLogPath is required' };
  }

  const now = input.now || null;

  // Build escalation brief
  const brief = {
    taskId: input.taskId,
    escalatedAt: now,
    priorSpec: input.priorSpec,
    priorOutputCount: input.priorOutputs.length,
    priorOutputs: input.priorOutputs,
    reviewFeedback: input.reviewFeedback,
    failureClassifications: input.failureClassifications,
    failureCount: input.failureClassifications.length,
    agentHistory: input.priorAgentAttempts.map((attempt) => ({
      agentId: attempt.agentId,
      model: attempt.model,
    })),
    vaultLogPath: input.vaultLogPath,
    traceability: {
      agentIds: input.priorAgentAttempts.map((a) => a.agentId),
      models: [...new Set(input.priorAgentAttempts.map((a) => a.model))],
      failureTypes: [...new Set(input.failureClassifications)],
    },
  };

  return {
    ok: true,
    brief: brief,
    audit: {
      event: 'escalation-brief-assembled',
      at: now,
      taskId: input.taskId,
      priorAttempts: input.priorAgentAttempts.length,
      failureClassifications: input.failureClassifications.length,
      vaultPath: input.vaultLogPath,
    },
    steps: ['collected prior spec and outputs', 'compiled failure classifications', 'assembled full traceability', 'linked to task logs'],
  };
}
