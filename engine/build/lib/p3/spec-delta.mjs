// node: L5.E03
// input: { change: any, reason?: string, specVersion?: string, deltaCount?: number }

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid input' };
  }

  const { change, reason = '', specVersion = '1.0', deltaCount = 0 } = input;

  // Validate change is not empty or null
  if (change === null || change === undefined) {
    return { ok: false, error: 'change cannot be null or undefined' };
  }

  if (typeof change === 'object' && !Array.isArray(change) && Object.keys(change).length === 0) {
    return { ok: false, error: 'change cannot be empty object' };
  }

  if (Array.isArray(change) && change.length === 0) {
    return { ok: false, error: 'change cannot be empty array' };
  }

  if (typeof change === 'string' && change.trim() === '') {
    return { ok: false, error: 'change cannot be empty string' };
  }

  // Generate sequential ID
  const deltaId = deltaCount + 1;

  // Create delta log entry
  const deltaEntry = {
    id: deltaId,
    change,
    reason: reason || 'No reason provided',
    specVersion,
    timestamp: null
  };

  const effects = [
    {
      kind: 'append-log',
      path: 'delta.log',
      content: `delta_${deltaId}: version=${specVersion}, reason="${deltaEntry.reason}"`
    }
  ];

  const steps = [
    { type: 'id-generation', id: deltaId, sequential: true },
    { type: 'validation', changePresent: true },
    { type: 'version-reference', specVersion }
  ];

  return {
    ok: true,
    delta: deltaEntry,
    nextDeltaId: deltaId + 1,
    effects,
    trace: {
      node: 'L5.E03',
      steps
    }
  };
}
