// node: L1.E01
// input: { folderState: 'blank' | 'blank-with-context' | 'stuck' | 'in-flight', parentFolder: string, existingFolders?: string[], human?: { choice: 'parent' | 'dex-vault', yes: boolean }, previousChoice?: 'parent' | 'dex-vault', now?: string }

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Missing or invalid input object' };
  }
  const { folderState, parentFolder, existingFolders, human, previousChoice, now } = input;
  if (!['blank', 'blank-with-context', 'stuck', 'in-flight'].includes(folderState)) {
    return { ok: false, error: 'Invalid folderState: must be blank, blank-with-context, stuck, or in-flight' };
  }
  if (typeof parentFolder !== 'string' || parentFolder === '') {
    return { ok: false, error: 'Missing parentFolder: provide the parent folder path' };
  }
  if (existingFolders !== undefined && (!Array.isArray(existingFolders) || existingFolders.some((f) => typeof f !== 'string'))) {
    return { ok: false, error: 'existingFolders must be an array of folder names' };
  }
  if (previousChoice !== undefined && !['parent', 'dex-vault'].includes(previousChoice)) {
    return { ok: false, error: "previousChoice must be 'parent' or 'dex-vault'" };
  }
  if (human !== undefined) {
    if (!human || typeof human !== 'object' || !['parent', 'dex-vault'].includes(human.choice)) {
      return { ok: false, error: "human.choice must be 'parent' or 'dex-vault'" };
    }
    if (human.yes !== true) {
      return { ok: false, error: 'The human choice needs an explicit yes' };
    }
  }

  const trace = { node: 'L1.E01', steps: [`folderState=${folderState}`] };
  const location = (c) => (c === 'parent' ? parentFolder : `${parentFolder}/dex-vault`);

  // acceptance 1 and 2: the agent's recommendation
  const recommended = folderState === 'blank' || folderState === 'blank-with-context' ? 'parent' : 'dex-vault';
  trace.steps.push(`recommended=${recommended}`);

  // acceptance 4: a legacy mof folder is never used as the vault; say so with a migration note
  let legacy = null;
  if (existingFolders && existingFolders.includes('mof')) {
    legacy = {
      rejected: 'mof',
      migrationNote: 'A legacy mof folder was found. It is not used as the vault. Copy it into dex-vault (copy, never move), keep the original untouched, then run the vault check.',
    };
    trace.steps.push('legacy mof folder rejected with a migration note');
  }

  // acceptance 3: the final choice is the human's; a previous choice is honoured on a re-run
  let choice = recommended;
  let decidedBy = 'agent-recommendation';
  if (human) {
    choice = human.choice;
    decidedBy = 'human';
    trace.steps.push(`human chose ${choice}`);
  } else if (previousChoice) {
    choice = previousChoice;
    decidedBy = 'previous-choice-honoured';
    trace.steps.push(`previous choice ${choice} honoured`);
  }

  const audit = {
    event: decidedBy === 'human' ? 'vault-location-chosen' : 'vault-location-recommended',
    at: now || null,
    folderState,
    recommended: location(recommended),
    choice: location(choice),
    decidedBy,
  };
  // The location is only final once the human has chosen; until then it is a recommendation.
  return {
    ok: true,
    recommendation: location(recommended),
    choice: location(choice),
    final: decidedBy !== 'agent-recommendation',
    decidedBy,
    folderState,
    legacy,
    audit,
    effects: decidedBy === 'human' ? [{ kind: 'append-log', path: 'RUNLOG.md', content: `vault location chosen by the human: ${location(choice)}` }] : [],
    trace,
  };
}
