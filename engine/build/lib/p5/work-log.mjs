// node: L4.E07
// input: { entries: [ { agent_name, timestamp, theme, file_path, commit_hash } ], now: ISO8601 }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { entries } = input;

  if (!Array.isArray(entries)) {
    return { ok: false, error: 'entries must be an array' };
  }

  if (entries.length === 0) {
    return { ok: false, error: 'entries array cannot be empty' };
  }

  // Validate each entry
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (!entry || typeof entry !== 'object') {
      return { ok: false, error: `entry ${i} must be an object` };
    }

    const { agent_name, timestamp, theme, file_path, commit_hash } = entry;

    if (typeof agent_name !== 'string' || agent_name.length === 0) {
      return { ok: false, error: `entry ${i}: agent_name must be a non-empty string` };
    }
    if (typeof timestamp !== 'string' || timestamp.length === 0) {
      return { ok: false, error: `entry ${i}: timestamp must be a non-empty string` };
    }
    if (typeof theme !== 'string' || theme.length === 0) {
      return { ok: false, error: `entry ${i}: theme must be a non-empty string` };
    }
    if (typeof file_path !== 'string' || file_path.length === 0) {
      return { ok: false, error: `entry ${i}: file_path must be a non-empty string` };
    }
    if (typeof commit_hash !== 'string' || commit_hash.length === 0) {
      return { ok: false, error: `entry ${i}: commit_hash must be a non-empty string` };
    }
  }

  // Deduplicate by timestamp and theme
  const seen = new Set();
  const deduped = [];
  for (const entry of entries) {
    const key = `${entry.timestamp}|${entry.theme}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(entry);
    }
  }

  // Sort by theme then date
  const sorted = deduped.slice().sort((a, b) => {
    const themeComp = a.theme.localeCompare(b.theme);
    return themeComp !== 0 ? themeComp : a.timestamp.localeCompare(b.timestamp);
  });

  const result = {
    ok: true,
    work_log: sorted,
    deduped_count: deduped.length,
    total_entries: entries.length,
    trace: {
      node: 'L4.E07',
      steps: [
        `validated ${entries.length} work log entries`,
        `deduplicated to ${deduped.length} entries by timestamp and theme`,
        `sorted by theme (${sorted.length} entries) then date`,
        'enables deterministic replay of theme progression'
      ]
    }
  };

  return result;
}
