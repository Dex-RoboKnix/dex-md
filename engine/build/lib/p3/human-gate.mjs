// node: L3.E03
// input: { requiredAnswers: [{name, human_filled: bool, uncertain: bool}], now: ISO8601string }

export function run(input) {
  const steps = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Input must be an object' };
  }

  if (!Array.isArray(input.requiredAnswers)) {
    return { ok: false, error: 'Input.requiredAnswers must be an array' };
  }

  steps.push(`Checking ${input.requiredAnswers.length} required answers`);

  let gateOpen = true;
  let lockedBy = null;
  const answerStatus = [];

  for (const answer of input.requiredAnswers) {
    const status = {
      name: answer.name,
      human_filled: answer.human_filled === true,
      uncertain: answer.uncertain === true,
      blank: answer.human_filled !== true
    };

    answerStatus.push(status);

    // Gate closes if:
    // 1. Answer is blank (not human-filled)
    // 2. Answer is uncertain
    if (!status.human_filled) {
      steps.push(`Answer '${answer.name}' is blank - gate locked`);
      gateOpen = false;
      lockedBy = answer.name;
      break;
    }

    if (status.uncertain) {
      steps.push(`Answer '${answer.name}' is uncertain - gate locked`);
      gateOpen = false;
      lockedBy = answer.name;
      break;
    }

    steps.push(`Answer '${answer.name}' is human-provided and certain`);
  }

  const timestamp = input.now || null;

  if (gateOpen) {
    steps.push('All required answers present and certain - gate opens');
  } else {
    steps.push(`Gate locked by: ${lockedBy}`);
  }

  // Return effects with gate log entry
  const logEntry = `Gate state: ${gateOpen ? 'OPEN' : 'CLOSED'}` +
    (lockedBy ? ` (locked by: ${lockedBy})` : '') +
    ` at ${timestamp || 'unknown time'}`;

  return {
    ok: true,
    open: gateOpen,
    lockedBy: gateOpen ? null : lockedBy,
    answerStatus,
    effects: [
      {
        kind: 'append-log',
        path: '.dex/gates/human-gate.log',
        content: logEntry
      }
    ],
    trace: {
      node: 'L3.E03',
      steps
    }
  };
}
