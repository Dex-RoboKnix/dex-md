// node: L1.E04
// input: { agentId, taskId, reasoningText, now, agentRestart }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { agentId, taskId, reasoningText, now, agentRestart } = input;

  if (!agentId || typeof agentId !== 'string') {
    return { ok: false, error: 'agentId is required and must be a string' };
  }

  if (!taskId || typeof taskId !== 'string') {
    return { ok: false, error: 'taskId is required and must be a string' };
  }

  if (reasoningText === undefined || reasoningText === null || reasoningText === '') {
    return { ok: false, error: 'reasoningText is required and must be non-empty' };
  }

  if (typeof reasoningText !== 'string') {
    return { ok: false, error: 'reasoningText must be a string' };
  }

  // Timestamp from input.now (ISO 8601 string), never from clock
  // If now is absent, at is null
  const timestamp = now || null;

  // Reasoning log captures only explicit reasoning text, not tool calls
  const reasoningRecord = {
    agentId,
    taskId,
    timestamp,
    reasoning: reasoningText,
    restart: agentRestart ? true : false
  };

  // Construct log line for effects
  const restartNote = agentRestart ? ' [RESTART]' : '';
  const timeStr = timestamp ? ` at ${timestamp}` : '';
  const logLine = `[${agentId}]${timeStr}: ${reasoningText}${restartNote}`;

  const effects = [
    {
      kind: 'append-log',
      path: `logs/reasoning-${agentId}.md`,
      content: logLine
    }
  ];

  return {
    ok: true,
    reasoningRecord,
    effects,
    trace: {
      node: 'L1.E04',
      steps: [
        `Captured reasoning from agent ${agentId}`,
        `Task: ${taskId}`,
        `Timestamp: ${timestamp || 'null'}`,
        agentRestart ? 'Agent restart annotated' : 'Normal reasoning capture',
        'Reasoning appended to log'
      ]
    }
  };
}
