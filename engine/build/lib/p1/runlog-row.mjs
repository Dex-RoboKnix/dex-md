// node: L4.E08
// input: {runNumber: number, date: string (ISO 8601), mode: string, version: string, summary: string}

export function run(input) {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Input must be an object with runNumber, date, mode, version, summary fields' };
  }

  const { runNumber, date, mode, version, summary } = input;

  // type check
  if (typeof runNumber !== 'number' || typeof date !== 'string' || typeof mode !== 'string' ||
      typeof version !== 'string' || typeof summary !== 'string') {
    return { ok: false, error: 'runNumber must be number; date, mode, version, summary must be strings' };
  }

  if (runNumber < 0 || !Number.isInteger(runNumber)) {
    return { ok: false, error: 'runNumber must be a non-negative integer' };
  }

  if (date === '' || mode === '' || version === '' || summary === '') {
    return { ok: false, error: 'date, mode, version, summary must not be empty' };
  }

  // acceptance 1: order is run number, date, mode, version, summary
  // acceptance 2: truncate summary to 80 chars with ellipsis
  const truncatedSummary = summary.length > 80 ? summary.substring(0, 77) + '...' : summary;

  const row = {
    runNumber,
    date,
    mode,
    version,
    summary: truncatedSummary
  };

  // acceptance 3: full text stored in external sidecar file
  const sidecarContent = `# Runlog Summary for Run ${runNumber} (${date})\n\n${summary}`;
  const effects = [
    {
      kind: 'write-file',
      path: `runlog/${date}/summary-${runNumber}.md`,
      content: sidecarContent
    }
  ];

  // acceptance 4: rows immutable after insertion (indicated by immutable flag)
  return {
    ok: true,
    row,
    effects,
    immutable: true,
    trace: {
      node: 'L4.E08',
      steps: [
        `created runlog row: run #${runNumber} on ${date}`,
        `mode=${mode}, version=${version}`,
        `truncated summary to ${truncatedSummary.length} chars`,
        `stored full summary in effects for ${summary.length} chars`
      ]
    }
  };
}
