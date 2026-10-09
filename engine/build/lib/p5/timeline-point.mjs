// node: L4.E07
// input: { point: { issue_number, title, date, commit_hash, entered_by, entered_at, modified_at, modified_by, source_issue_url }, now: ISO8601 }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { point, now } = input;

  if (!point || typeof point !== 'object') {
    return { ok: false, error: 'point is required' };
  }

  const { issue_number, title, date, commit_hash, entered_by, entered_at, modified_at, modified_by, source_issue_url } = point;

  // Validate core fields
  if (!Number.isInteger(issue_number) || issue_number <= 0) {
    return { ok: false, error: 'issue_number must be a positive integer' };
  }
  if (typeof title !== 'string' || title.length === 0) {
    return { ok: false, error: 'title must be a non-empty string' };
  }
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: 'date must be YYYY-MM-DD format' };
  }

  // commit_hash can be missing, but if present must be non-empty
  const hash_status = !commit_hash ? 'hash:missing' : undefined;
  if (commit_hash && typeof commit_hash !== 'string') {
    return { ok: false, error: 'commit_hash must be a string' };
  }

  // Validate audit fields
  if (typeof entered_by !== 'string' || entered_by.length === 0) {
    return { ok: false, error: 'entered_by must be a non-empty string' };
  }
  if (typeof entered_at !== 'string' || entered_at.length === 0) {
    return { ok: false, error: 'entered_at must be a non-empty string' };
  }
  if (typeof modified_at !== 'string' || modified_at.length === 0) {
    return { ok: false, error: 'modified_at must be a non-empty string' };
  }
  if (typeof modified_by !== 'string' || modified_by.length === 0) {
    return { ok: false, error: 'modified_by must be a non-empty string' };
  }
  if (typeof source_issue_url !== 'string' || source_issue_url.length === 0) {
    return { ok: false, error: 'source_issue_url must be a non-empty string' };
  }

  const result = {
    ok: true,
    // acceptance 4: a stable key so any list of points sorts by date, then issue number, the same way every time
    sortKey: `${date}#${String(issue_number).padStart(9, '0')}`,
    // acceptance 2: a point without a commit hash is not publishable until a human has checked it
    publishable: !hash_status,
    needsHumanVerification: !!hash_status,
    // acceptance 3: the audit trail of who entered and who last modified the point, with timestamps
    audit: { event: 'timeline-point-recorded', at: typeof now === 'string' ? now : null, issue_number, entered_by, entered_at, modified_by, modified_at },
    point: {
      issue_number,
      title,
      date,
      commit_hash: commit_hash || 'hash:missing',
      entered_by,
      entered_at,
      modified_at,
      modified_by,
      source_issue_url,
      hash_status
    },
    trace: {
      node: 'L4.E07',
      steps: [
        'validated core fields (issue_number, title, date, commit_hash)',
        'validated audit fields (entered_by, entered_at, modified_at, modified_by, source_issue_url)',
        hash_status ? 'flagged missing commit hash' : 'commit hash present'
      ]
    }
  };

  return result;
}
