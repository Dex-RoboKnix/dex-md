// node: L4.E06
// input: { hasRunlog: boolean, hasDexVault: boolean, isDirty: boolean }

export function run(input) {
  const trace = { node: 'L4.E06', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { hasRunlog, hasDexVault, isDirty } = input;

  if (typeof hasRunlog !== 'boolean') {
    trace.steps.push('validate_input: hasRunlog must be boolean');
    return { ok: false, error: 'hasRunlog must be a boolean' };
  }

  if (typeof hasDexVault !== 'boolean') {
    trace.steps.push('validate_input: hasDexVault must be boolean');
    return { ok: false, error: 'hasDexVault must be a boolean' };
  }

  if (typeof isDirty !== 'boolean') {
    trace.steps.push('validate_input: isDirty must be boolean');
    return { ok: false, error: 'isDirty must be a boolean' };
  }

  trace.steps.push(`detect_install: hasRunlog=${hasRunlog}, hasDexVault=${hasDexVault}, isDirty=${isDirty}`);

  // Check for dirty state first
  // note: decisions (Q3) aborts if dirty; nothing written without explicit yes
  if (isDirty) {
    trace.steps.push('detect_install: dirty state detected, aborting');
    return {
      ok: false,
      isExistingInstall: false,
      isDirty: true,
      abort: true,
      notification: 'Working tree has uncommitted changes. Please commit or stash changes before running the installer.',
      error: 'Cannot proceed with dirty working tree'
    };
  }

  // Check if both markers are present
  // note: decisions (Q1) both RUNLOG and dex-vault folder presence is strong signal
  const isExistingInstall = hasRunlog && hasDexVault;

  trace.steps.push(`detect_install: isExistingInstall=${isExistingInstall}`);

  if (isExistingInstall) {
    trace.steps.push('detect_install: existing install detected, will perform incremental re-run');

    return {
      ok: true,
      isExistingInstall: true,
      isDirty: false,
      installMode: 're-run',
      approach: 'incremental',
      note: 'Existing install detected. Re-run will skip unchanged assets.',
      effects: [],  // note: no automatic operations; caller orchestrates re-run
      trace
    };
  } else {
    trace.steps.push('detect_install: no existing install markers found, proceeding as new install');

    // Determine which marker(s) are missing
    let missingMarkers = [];
    if (!hasRunlog) missingMarkers.push('RUNLOG');
    if (!hasDexVault) missingMarkers.push('dex-vault folder');

    return {
      ok: true,
      isExistingInstall: false,
      isDirty: false,
      installMode: 'new',
      missingMarkers,
      note: missingMarkers.length > 0 ?
        `No existing install found (missing: ${missingMarkers.join(', ')}). Proceeding with fresh install.` :
        'Proceeding with fresh install.',
      effects: [],
      trace
    };
  }
}
