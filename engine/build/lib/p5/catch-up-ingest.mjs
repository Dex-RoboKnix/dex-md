// node: L4.E08
// input: { log_lines: [ { line_number, text, timestamp_attempt } ], cutoff_date: ISO8601, now: ISO8601 }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { log_lines, cutoff_date } = input;

  if (!Array.isArray(log_lines)) {
    return { ok: false, error: 'log_lines must be an array' };
  }
  if (typeof cutoff_date !== 'string' || cutoff_date.length === 0) {
    return { ok: false, error: 'cutoff_date must be a non-empty string' };
  }

  const journal_entries = [];
  const errors = [];

  for (let i = 0; i < log_lines.length; i++) {
    const line = log_lines[i];

    if (!line || typeof line !== 'object') {
      errors.push({ line_number: i, error: 'entry must be an object' });
      continue;
    }

    const { line_number, text, timestamp_attempt } = line;

    if (typeof text !== 'string' || text.length === 0) {
      errors.push({ line_number: line_number || i, error: 'text must be non-empty string' });
      continue;
    }

    // Try to parse timestamp
    let timestamp = null;
    if (timestamp_attempt && typeof timestamp_attempt === 'string') {
      // Attempt to parse as ISO 8601
      const parsed = new Date(timestamp_attempt);
      if (!isNaN(parsed.getTime())) {
        timestamp = parsed.toISOString();
      }
    }

    // Skip entries before cutoff date
    if (timestamp) {
      const cutoffDate = new Date(cutoff_date);
      const entryDate = new Date(timestamp);
      if (entryDate < cutoffDate) {
        continue;
      }
    } else {
      // No valid timestamp, skip with log
      errors.push({ line_number: line_number || i, error: 'unable to parse timestamp' });
      continue;
    }

    journal_entries.push({
      timestamp,
      original_log_line: text,
      line_number: line_number || i,
      content: text
    });
  }

  // Sort by timestamp
  journal_entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const result = {
    ok: true,
    journal_entries,
    stats: {
      total_input: log_lines.length,
      processed: journal_entries.length,
      skipped: errors.length,
      cutoff_date
    },
    errors_encountered: errors,
    trace: {
      node: 'L4.E08',
      steps: [
        `processed ${log_lines.length} grill log entries`,
        `converted to ISO 8601 format`,
        `skipped ${errors.length} unparseable entries and continued processing`,
        `kept ${journal_entries.length} entries since cutoff date`,
        'each entry maintains link to original grill log entry',
        'sorted by date in stable order'
      ]
    }
  };

  return result;
}
