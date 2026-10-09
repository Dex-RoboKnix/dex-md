// node: L1.E05
// input: {coverage: number (0-100)}

export function run(input) {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Input must be an object with coverage field' };
  }

  const { coverage, now } = input;

  // type check
  if (typeof coverage !== 'number') {
    return { ok: false, error: 'coverage must be a number' };
  }

  if (coverage < 0 || coverage > 100) {
    return { ok: false, error: 'coverage must be between 0 and 100' };
  }

  // acceptance 1: coverage percentage determines ask or suggest mode
  // acceptance 2: threshold boundary at 90% inclusive
  let mode;
  if (coverage < 90) {
    mode = 'ask';
  } else {
    mode = 'suggest';
  }

  // acceptance 3: log recommendations in suggest mode
  const audit = mode === 'suggest' ? {
    event: 'coverage-suggestion-logged',
    at: now || null,
    coverage,
    mode,
    message: 'Coverage at or above 90%; suggesting improvements'
  } : undefined;

  return {
    ok: true,
    coverage,
    mode,
    description: mode === 'ask'
      ? 'Coverage below 90%; asking human for direction'
      : 'Coverage at or above 90%; suggesting improvements',
    audit,
    trace: {
      node: 'L1.E05',
      steps: [
        `compared coverage ${coverage}% to 90% threshold`,
        `threshold boundary: ${coverage} ${coverage >= 90 ? '>=' : '<'} 90`,
        `assigned mode: ${mode}`
      ]
    }
  };
}
