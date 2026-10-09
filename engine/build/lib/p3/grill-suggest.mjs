// node: L2.E03
// input: { answer: string, source: {type: string, id: string}, now: ISO8601string }

const VERIFIABLE_TYPES = ['issue', 'node', 'doc-link', 'commit'];

export function run(input) {
  const steps = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Input must be an object' };
  }

  if (typeof input.answer !== 'string' || input.answer.trim() === '') {
    return { ok: false, error: 'Input.answer must be a non-empty string' };
  }

  if (!input.source || typeof input.source !== 'object') {
    return { ok: false, error: 'Input.source must be an object with type and id' };
  }

  if (!input.source.type || !input.source.id) {
    return { ok: false, error: 'Input.source must have type and id fields' };
  }

  steps.push(`Suggestion received: "${input.answer.substring(0, 50)}..."`);
  steps.push(`Source type: ${input.source.type}, id: ${input.source.id}`);

  // Determine if source is verifiable
  const isVerifiable = VERIFIABLE_TYPES.includes(input.source.type);

  if (isVerifiable) {
    steps.push(`Source type '${input.source.type}' is verifiable`);
  } else {
    steps.push(`Source type '${input.source.type}' is not verifiable - marked unchecked`);
  }

  const timestamp = input.now || null;

  // Create suggestion object
  const suggestion = {
    text: input.answer,
    source: input.source,
    verified: isVerifiable,
    timestamp
  };

  steps.push('Suggestion object created');

  // Return effects with log entry
  const logEntry = `Suggestion: "${input.answer}" from ${input.source.type}:${input.source.id} (verified: ${isVerifiable}) at ${timestamp || 'unknown'}`;

  return {
    ok: true,
    suggestion,
    verified: isVerifiable,
    effects: [
      {
        kind: 'append-log',
        path: '.dex/suggestions/grill-suggest.log',
        content: logEntry
      }
    ],
    trace: {
      node: 'L2.E03',
      steps
    }
  };
}
