// node: L2.E03
// input: { answer: string, now?: string, source?: string, confidence?: number }

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid input' };
  }

  const { answer, now, source = 'user', confidence = 1.0 } = input;

  if (typeof answer !== 'string') {
    return { ok: false, error: 'answer must be string' };
  }

  if (answer === '') {
    return { ok: false, error: 'answer cannot be empty' };
  }

  if (now !== undefined && typeof now !== 'string') {
    return { ok: false, error: 'now must be ISO 8601 string' };
  }

  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    return { ok: false, error: 'confidence must be number between 0 and 1' };
  }

  // Escape newlines and preserve whitespace
  const escaped = answer.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');

  const effects = [];

  // Timestamp on separate metadata line
  const metadata = {
    timestamp: now || null,
    source,
    confidence
  };

  // Format log entry
  const logEntry = `verbatim: ${escaped}\n` +
    `metadata: timestamp=${metadata.timestamp || 'null'}, source=${source}, confidence=${confidence}`;

  effects.push({
    kind: 'append-log',
    path: 'grill.log',
    content: logEntry
  });

  return {
    ok: true,
    verbatim: escaped,
    reading: {
      source,
      confidence
    },
    trace: {
      node: 'L2.E03',
      steps: [
        { type: 'escaped', newlines: (answer.match(/\n/g) || []).length },
        { type: 'formatted', hasTimestamp: !!now }
      ]
    },
    effects
  };
}
