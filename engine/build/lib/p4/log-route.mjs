// node: L1.E04
// input: { logKind, phaseNumber, vaultRoot, agentId, themeId, attemptNumber }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { logKind, phaseNumber, vaultRoot, agentId, themeId, attemptNumber } = input;

  if (!logKind || typeof logKind !== 'string') {
    return { ok: false, error: 'logKind is required and must be a string' };
  }

  if (phaseNumber === undefined || typeof phaseNumber !== 'number') {
    return { ok: false, error: 'phaseNumber is required and must be a number' };
  }

  if (!vaultRoot || typeof vaultRoot !== 'string') {
    return { ok: false, error: 'vaultRoot is required and must be a string' };
  }

  if (!agentId || typeof agentId !== 'string') {
    return { ok: false, error: 'agentId is required and must be a string' };
  }

  if (!themeId || typeof themeId !== 'string') {
    return { ok: false, error: 'themeId is required and must be a string' };
  }

  if (attemptNumber === undefined || typeof attemptNumber !== 'number') {
    return { ok: false, error: 'attemptNumber is required and must be a number' };
  }

  // Build path: <vault-root>/logs/phase-<N>/<kind>/<theme-id>/
  const directoryPath = `${vaultRoot}/logs/phase-${phaseNumber}/${logKind}/${themeId}`;

  // Filename: <kind>-agent-<id>-attempt-<n>.md
  const filename = `${logKind}-agent-${agentId}-attempt-${attemptNumber}.md`;
  const fullPath = `${directoryPath}/${filename}`;

  // Effects to create directory and note the path
  const effects = [
    {
      kind: 'write-file',
      path: `${directoryPath}/.gitkeep`,
      content: ''
    }
  ];

  return {
    ok: true,
    logKind,
    phaseNumber,
    themeId,
    agentId,
    attemptNumber,
    directoryPath,
    filename,
    fullPath,
    effects,
    trace: {
      node: 'L1.E04',
      steps: [
        `Routing ${logKind} log for theme ${themeId}`,
        `Path structure: ${directoryPath}`,
        `File: ${filename}`,
        'Directory created on demand for first log write',
        'Multiple agents create separate numbered files'
      ]
    }
  };
}
