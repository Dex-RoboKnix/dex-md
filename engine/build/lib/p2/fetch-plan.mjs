// node: L1.E03
// input: { repo: string, ref: string, destination: string, folderState: 'blank' | 'blank-with-context' | 'in-flight' }

export function run(input) {
  const trace = { node: 'L1.E03', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { repo, ref, destination, folderState } = input;

  // Validate required fields
  if (typeof repo !== 'string' || repo === '') {
    return { ok: false, error: 'Missing repo: provide repository URL' };
  }

  if (typeof ref !== 'string' || ref === '') {
    return { ok: false, error: 'Missing ref: provide version or commit SHA' };
  }

  if (typeof destination !== 'string' || destination === '') {
    return { ok: false, error: 'Missing destination: provide absolute path' };
  }

  if (!['blank', 'blank-with-context', 'in-flight'].includes(folderState)) {
    return { ok: false, error: 'Invalid folderState: must be blank, blank-with-context, or in-flight' };
  }

  trace.steps.push(`render_plan: repo=${repo}`);
  trace.steps.push(`render_plan: ref=${ref}`);
  trace.steps.push(`render_plan: destination=${destination}`);
  trace.steps.push(`render_plan: folderState=${folderState}`);

  // Build the plan
  const plan = {
    repo,
    ref,
    destination,
    folderState,
  };

  // Map folder state to user-friendly description
  const stateDescription = {
    'blank': 'folder is empty (will initialize)',
    'blank-with-context': 'folder contains untracked files (no .git or .scratch)',
    'in-flight': 'folder has .git or .scratch (project in progress)'
  };

  const displayState = stateDescription[folderState];
  trace.steps.push(`render_plan: state description="${displayState}"`);

  return {
    ok: true,
    plan,
    display: {
      repo,
      ref,
      destination,
      folderState: displayState
    },
    trace
  };
}
