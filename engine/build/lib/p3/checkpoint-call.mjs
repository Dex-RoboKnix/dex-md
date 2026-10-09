// node: L4.E08
// input: { skillRun: string | {code, log}, now: ISO8601string }

export function run(input) {
  const steps = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Input must be an object' };
  }

  if (typeof input.skillRun !== 'string' && (!input.skillRun || typeof input.skillRun !== 'object')) {
    return { ok: false, error: 'Input.skillRun must be a string or object' };
  }

  const runContent = typeof input.skillRun === 'string' ? input.skillRun : input.skillRun?.code || '';
  steps.push('Searching for checkpoint() call');

  // Search for checkpoint() function call - only the final one counts
  const checkpointRegex = /checkpoint\s*\(\s*([^)]*)\s*\)/g;
  let matches = [];
  let match;

  while ((match = checkpointRegex.exec(runContent)) !== null) {
    matches.push({
      fullCall: match[0],
      parameters: match[1],
      index: match.index
    });
  }

  if (matches.length === 0) {
    steps.push('No checkpoint() call found');
    return {
      ok: true,
      verified: false,
      incomplete: true,
      message: 'Skill run is marked incomplete - no checkpoint() call detected',
      trace: {
        node: 'L4.E08',
        steps
      }
    };
  }

  // Only the final checkpoint counts
  const finalCheckpoint = matches[matches.length - 1];
  steps.push(`Found ${matches.length} checkpoint call(s), using final one`);

  // Parse parameters (simple parsing - just store as string)
  const parameters = finalCheckpoint.parameters.trim();
  const timestamp = input.now || null;

  steps.push(`Final checkpoint found at position ${finalCheckpoint.index}`);
  steps.push(`Checkpoint parameters: ${parameters || '(none)'}`);

  // Return effects with log entry
  const logEntry = `checkpoint(${parameters}) verified at ${timestamp || 'unknown time'}`;

  return {
    ok: true,
    verified: true,
    incomplete: false,
    timestamp,
    parameters,
    effects: [
      {
        kind: 'append-log',
        path: '.dex/runs/checkpoint.log',
        content: logEntry
      }
    ],
    trace: {
      node: 'L4.E08',
      steps
    }
  };
}
