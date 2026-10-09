// node: L2.E07
// input: { taskId, events: [ { type: 'phase-start'|'phase-end'|'failure'|'escalation'|'stall'|'retry'|'completed-task', phase?, failureClassification?, context?, timestamp? } ], now? }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input is not an object' };
  }

  if (!input.taskId) {
    return { ok: false, error: 'taskId is required' };
  }

  if (!Array.isArray(input.events)) {
    return { ok: false, error: 'events must be an array' };
  }

  const now = input.now || null;
  const trace = [];
  const effects = [];
  let failureClassifications = {};

  // Process and validate events
  for (const event of input.events) {
    if (!event || typeof event !== 'object') {
      return { ok: false, error: 'event is not an object' };
    }

    const validTypes = ['phase-start', 'phase-end', 'failure', 'escalation', 'stall', 'retry', 'completed-task'];
    if (!validTypes.includes(event.type)) {
      return { ok: false, error: `invalid event type: ${event.type}` };
    }

    // Build trace entry
    const traceEntry = {
      type: event.type,
      at: now,
      taskId: input.taskId,
    };

    // Add phase info if present
    if (event.phase) {
      traceEntry.phase = event.phase;
    }

    // For failure events, include classification only (not detailed data)
    if (event.type === 'failure' && event.failureClassification) {
      const validClassifications = ['spec-gap', 'impl-bug', 'test-gap', 'environment'];
      if (!validClassifications.includes(event.failureClassification)) {
        return { ok: false, error: `invalid failure classification: ${event.failureClassification}` };
      }
      traceEntry.failureClassification = event.failureClassification;
      failureClassifications[event.type] = event.failureClassification;
    }

    trace.push(traceEntry);
  }

  // Build log line format for each trace entry
  for (const entry of trace) {
    let logLine = `[${entry.at || 'unknown'}] ${entry.type}`;
    if (entry.phase) logLine += ` (phase: ${entry.phase})`;
    if (entry.failureClassification) logLine += ` [${entry.failureClassification}]`;
    logLine += ` taskId: ${entry.taskId}`;

    effects.push({
      kind: 'append-log',
      path: `logs/loop-trace/${input.taskId}/trace.log`,
      content: logLine,
    });
  }

  return {
    ok: true,
    trace: trace,
    audit: {
      event: 'loop-trace-recorded',
      at: now,
      taskId: input.taskId,
      eventCount: trace.length,
      classifications: failureClassifications,
    },
    effects: effects,
    steps: ['validated events', 'recorded trace entries', 'generated log effects'],
  };
}
