// node: L5.E05
// input: { task_id, attempts, outcome, time_elapsed_minutes, run_manifest_hash, artifact_url, notes, now: ISO8601 }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { task_id, attempts, outcome, time_elapsed_minutes, run_manifest_hash, artifact_url, notes } = input;

  // Validate required fields
  if (typeof task_id !== 'string' || task_id.length === 0) {
    return { ok: false, error: 'task_id must be a non-empty string' };
  }
  if (!Number.isInteger(attempts) || attempts <= 0) {
    return { ok: false, error: 'attempts must be a positive integer' };
  }

  const valid_outcomes = ['pass', 'fail', 'abandoned', 'escalated-and-resolved'];
  if (!valid_outcomes.includes(outcome)) {
    return { ok: false, error: `outcome must be one of: ${valid_outcomes.join(', ')}` };
  }

  if (typeof time_elapsed_minutes !== 'number' || time_elapsed_minutes < 0) {
    return { ok: false, error: 'time_elapsed_minutes must be a non-negative number' };
  }
  if (typeof run_manifest_hash !== 'string' || run_manifest_hash.length === 0) {
    return { ok: false, error: 'run_manifest_hash must be a non-empty string' };
  }
  if (typeof artifact_url !== 'string' || artifact_url.length === 0) {
    return { ok: false, error: 'artifact_url must be a non-empty string' };
  }

  // note: notes field is optional but included if present
  const notes_text = notes && typeof notes === 'string' ? notes : '';

  const row = {
    task_id,
    attempts,
    outcome,
    time_elapsed_minutes: Math.round(time_elapsed_minutes * 10) / 10,
    run_manifest_hash,
    artifact_url,
    notes: notes_text
  };

  const result = {
    ok: true,
    case_row: row,
    validation: {
      task_id_valid: !!task_id,
      attempts_valid: attempts > 0,
      outcome_valid: valid_outcomes.includes(outcome),
      time_elapsed_valid: time_elapsed_minutes >= 0,
      manifest_hash_valid: !!run_manifest_hash,
      artifact_url_valid: !!artifact_url,
      all_required_fields_present: true
    },
    trace: {
      node: 'L5.E05',
      steps: [
        `validated task_id: ${task_id}`,
        `validated attempts: ${attempts}`,
        `validated outcome: ${outcome}`,
        `recorded elapsed time: ${row.time_elapsed_minutes} minutes`,
        `traced to manifest: ${run_manifest_hash.slice(0, 8)}...`,
        `artifact URL: ${artifact_url}`,
        'case row enables trend analysis and repeatability debugging'
      ]
    }
  };

  return result;
}
