// node: L2.E07
// input: { findings: [{ description, blocker: bool }] }

export function run(input) {
  const steps = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Input must be an object' };
  }

  if (!Array.isArray(input.findings)) {
    return { ok: false, error: 'Input.findings must be an array' };
  }

  steps.push(`Analyzing ${input.findings.length} findings`);

  // Empty findings list means PASS
  if (input.findings.length === 0) {
    steps.push('No findings: verdict is PASS');
    return {
      ok: true,
      verdict: 'PASS',
      blockers: [],
      summary: 'No findings',
      trace: {
        node: 'L2.E07',
        steps
      }
    };
  }

  // Check for blockers
  const blockers = input.findings.filter(f => f.blocker === true);
  steps.push(`Found ${blockers.length} blocking findings`);

  if (blockers.length > 0) {
    steps.push('At least one blocker present: verdict is FAIL');

    // Summarize blocking findings
    const summary = blockers.map(b => b.description).join('; ');

    return {
      ok: true,
      verdict: 'FAIL',
      blockers,
      summary,
      trace: {
        node: 'L2.E07',
        steps
      }
    };
  }

  // No blockers: PASS
  steps.push('No blockers: verdict is PASS');
  return {
    ok: true,
    verdict: 'PASS',
    blockers: [],
    summary: 'Findings present but none blocking',
    trace: {
      node: 'L2.E07',
      steps
    }
  };
}
