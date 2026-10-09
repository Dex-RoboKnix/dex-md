// node: L3.E04
// input: { human_name: string, date: string (ISO 8601), commit_ref: string, reason?: string, amendment_of?: string }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  if (typeof input.human_name !== 'string' || !input.human_name.trim()) {
    return { ok: false, error: 'input.human_name must be a non-empty string' };
  }

  if (typeof input.date !== 'string' || !input.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return { ok: false, error: 'input.date must be ISO 8601 YYYY-MM-DD format' };
  }

  if (typeof input.commit_ref !== 'string' || !input.commit_ref.trim()) {
    return { ok: false, error: 'input.commit_ref must be a non-empty string' };
  }

  const record = {
    human_name: input.human_name.trim(),
    date: input.date,
    commit_ref: input.commit_ref.trim(),
    reason: input.reason || null,
    amendment_of: input.amendment_of || null,
    record_type: input.amendment_of ? 'amendment' : 'signoff',
    timestamp_recorded: new Date().toISOString()
  };

  const steps = [
    { action: 'create-record', type: record.record_type },
    { action: 'capture-commit-ref', ref: input.commit_ref }
  ];

  return {
    ok: true,
    record,
    trace: {
      node: 'L3.E04',
      steps
    }
  };
}
