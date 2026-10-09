// node: L1.E03
// input: {text: string, sourceFile?: string, lineNumber?: number}

export function run(input) {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Input must be an object with text field' };
  }

  const { text, sourceFile = 'unknown', lineNumber = 0, now } = input;

  if (typeof text !== 'string') {
    return { ok: false, error: 'text must be a string' };
  }

  if (text === '') {
    return { ok: false, error: 'text must not be empty' };
  }

  // note: forbidden marker list (agent-reading markers)
  const forbiddenMarkers = [
    { pattern: /<reasoning>|<analysis>|<thinking>|<internal>/i, type: 'REASONING' },
    { pattern: /reasoning\s*:/i, type: 'REASONING' },
    { pattern: /co-authored\s+by\s+claude/i, type: 'SIGNATURE' },
    { pattern: /signed\s+by/i, type: 'SIGNATURE' },
    { pattern: /\b(error log|output log|debug log|trace log)\b/i, type: 'LOG' },
    { pattern: /\b(traceback|stack trace)\b/i, type: 'TRACE' },
    { pattern: /claude\s+session|claude-session/i, type: 'SIGNATURE' },
    { pattern: /anthropic\s+sdk|anthropic-ai/i, type: 'SIGNATURE' }
  ];

  // acceptance 1: scan for forbidden markers
  for (const marker of forbiddenMarkers) {
    if (marker.pattern.test(text)) {
      const diagnostics = {
        event: 'agent-marker-detected',
        at: now || null,
        markerType: marker.type,
        sourceFile,
        lineNumber
      };
      return {
        ok: false,
        error: `Forbidden agent marker detected: ${marker.type}`,
        markerType: marker.type,
        sourceFile,
        lineNumber,
        details: `Found in ${sourceFile} at line ${lineNumber}`,
        audit: diagnostics
      };
    }
  }

  // acceptance 2 & 3: validation passed
  return {
    ok: true,
    validated: true,
    trace: {
      node: 'L1.E03',
      steps: [
        `scanned ${text.length} characters for agent markers`,
        `checked ${forbiddenMarkers.length} marker patterns`,
        `validation passed: no forbidden markers found`,
        `source: ${sourceFile}:${lineNumber}`
      ]
    }
  };
}
