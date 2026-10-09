// node: L4.E06
// input: { run_date: string, start_time: string, end_time: string, models_used: string[], agent_count: number, task_count: number, phase_number: number, git_commit_at_start: string, events?: Array }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const required = ['run_date', 'start_time', 'end_time', 'models_used', 'agent_count', 'task_count', 'phase_number', 'git_commit_at_start'];
  for (const field of required) {
    if (!(field in input)) {
      return { ok: false, error: `input.${field} is required` };
    }
  }

  if (!Array.isArray(input.models_used) || input.models_used.length === 0) {
    return { ok: false, error: 'input.models_used must be a non-empty array' };
  }

  const manifest = {
    run_date: input.run_date,
    start_time: input.start_time,
    end_time: input.end_time,
    models_used: input.models_used,
    agent_count: input.agent_count,
    task_count: input.task_count,
    phase_number: input.phase_number,
    git_commit_at_start: input.git_commit_at_start,
    events: Array.isArray(input.events) ? input.events : []
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  const effects = [
    {
      kind: 'write-file',
      path: `out/p${input.phase_number}.manifest.json`,
      content: manifestJson
    }
  ];

  const steps = [
    { action: 'create-manifest', fields: required.length },
    { action: 'serialize-json', length: manifestJson.length }
  ];

  return {
    ok: true,
    manifest,
    effects,
    trace: {
      node: 'L4.E06',
      steps
    }
  };
}
