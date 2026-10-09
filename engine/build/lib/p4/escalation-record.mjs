// node: L4.E08
// input: { taskId, outcome: 'pass'|'fail', opusModel: string, sonnetTeamModel: string, attemptCount: number, errorDetails?: string, now? }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input is not an object' };
  }

  if (!input.taskId) {
    return { ok: false, error: 'taskId is required' };
  }

  if (!input.outcome || !['pass', 'fail'].includes(input.outcome)) {
    return { ok: false, error: 'outcome must be pass or fail' };
  }

  if (!input.opusModel || typeof input.opusModel !== 'string') {
    return { ok: false, error: 'opusModel is required' };
  }

  if (!input.sonnetTeamModel || typeof input.sonnetTeamModel !== 'string') {
    return { ok: false, error: 'sonnetTeamModel is required' };
  }

  if (typeof input.attemptCount !== 'number' || input.attemptCount < 1) {
    return { ok: false, error: 'attemptCount must be a positive number' };
  }

  const now = input.now || null;

  // Build escalation record
  const record = {
    taskId: input.taskId,
    escalationDate: now,
    outcome: input.outcome,
    opusModel: input.opusModel,
    sonnetTeamModel: input.sonnetTeamModel,
    attemptCount: input.attemptCount,
    errorDetails: input.errorDetails || null,
  };

  // Build effects: the record must be written to the vault
  const effects = [
    {
      kind: 'write-file',
      path: `logs/escalation/${input.taskId}/escalation-record.json`,
      content: JSON.stringify(record, null, 2),
    },
  ];

  return {
    ok: true,
    record: record,
    audit: {
      event: 'escalation-recorded',
      at: now,
      taskId: input.taskId,
      outcome: input.outcome,
      attemptCount: input.attemptCount,
    },
    effects: effects,
    steps: ['built escalation record', 'included audit fields', 'prepared persistence'],
  };
}
