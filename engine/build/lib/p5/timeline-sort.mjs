// node: L4.E07
// input: { points: [{ issue_number: number, title: string, date?: string, commit_hash?: string }], now?: string }

export function run(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.points)) {
    return { ok: false, error: 'input.points must be an array' };
  }

  const points = input.points;
  if (points.length === 0) {
    return { ok: false, error: 'points array cannot be empty' };
  }

  // Validate all points have required fields
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!p || typeof p.issue_number !== 'number' || typeof p.title !== 'string') {
      return { ok: false, error: `point ${i} missing issue_number or title` };
    }
  }

  // Sort: by date ascending, then by issue_number ascending
  const sorted = [...points].sort((a, b) => {
    const aDate = a.date || '';
    const bDate = b.date || '';

    if (aDate === '' && bDate === '') return a.issue_number - b.issue_number;
    if (aDate === '') return 1; // missing dates to end
    if (bDate === '') return -1;

    const dateCompare = aDate.localeCompare(bDate);
    if (dateCompare !== 0) return dateCompare;

    return a.issue_number - b.issue_number;
  });

  // Build log entries
  const logLines = [];
  const steps = [];
  const now = input.now || new Date().toISOString();

  for (const point of sorted) {
    const dateFlag = !point.date ? ' [date:missing]' : '';
    const logLine = `${now} | #${point.issue_number} | ${point.title}${dateFlag} | ${point.commit_hash || 'hash:missing'}`;
    logLines.push(logLine);
    steps.push({
      issue_number: point.issue_number,
      date: point.date || 'missing',
      timestamp: now
    });
  }

  // Create effects for logging
  const effects = [
    {
      kind: 'append-log',
      path: 'out/p5.sort.log',
      content: logLines.join('\n') + '\n'
    }
  ];

  return {
    ok: true,
    sorted,
    logEntries: logLines,
    effects,
    trace: {
      node: 'L4.E07',
      steps
    }
  };
}
