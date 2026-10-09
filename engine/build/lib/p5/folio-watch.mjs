// node: L4.E02
// input: { old_hashes: { filepath: hash }, new_hashes: { filepath: hash }, now: ISO8601 }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { old_hashes, new_hashes } = input;

  if (!old_hashes || typeof old_hashes !== 'object' || Array.isArray(old_hashes)) {
    return { ok: false, error: 'old_hashes must be an object' };
  }
  if (!new_hashes || typeof new_hashes !== 'object' || Array.isArray(new_hashes)) {
    return { ok: false, error: 'new_hashes must be an object' };
  }

  const changes = [];
  const deleted = [];
  const added = [];

  // Check for changes and deletions
  for (const filepath in old_hashes) {
    const old_hash = old_hashes[filepath];
    const new_hash = new_hashes[filepath];

    if (!new_hash) {
      deleted.push({
        filepath,
        old_hash,
        new_hash: null,
        status: 'DELETED',
        requires_reconciliation: true
      });
    } else if (old_hash !== new_hash) {
      changes.push({
        filepath,
        old_hash,
        new_hash,
        status: 'CHANGED'
      });
    }
  }

  // Check for new files
  for (const filepath in new_hashes) {
    if (!(filepath in old_hashes)) {
      added.push({
        filepath,
        old_hash: null,
        new_hash: new_hashes[filepath],
        status: 'NEW'
      });
    }
  }

  const report = [...changes, ...deleted, ...added];

  const result = {
    ok: true,
    report: report,
    summary: {
      changed: changes.length,
      deleted: deleted.length,
      new: added.length,
      total_changes: report.length,
      requires_reconciliation: deleted.length > 0
    },
    trace: {
      node: 'L4.E02',
      steps: [
        `compared file hashes: ${Object.keys(old_hashes).length} files in old build`,
        `detected ${changes.length} CHANGED, ${deleted.length} DELETED, ${added.length} NEW files`,
        deleted.length > 0 ? 'flagged deletions requiring manual reconciliation' : 'no deletions',
        'report provides filepath, old_hash, new_hash, and status for rapid human scanning'
      ]
    }
  };

  return result;
}
