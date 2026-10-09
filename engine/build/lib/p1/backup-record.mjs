// node: L1.E06
// input: { backups: [{ original: <row-obj>, replacement: <row-obj>, timestamp: <iso> }, ...], checkpointDate: <iso-date> }

function rowToMarkdownRow(row) {
  if (!row || typeof row !== 'object') return '';

  // Simple conversion of row object to markdown table row
  const cells = Object.entries(row)
    .map(([, val]) => {
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) return val.join('; ');
      return String(val);
    })
    .map(cell => cell.replace(/\|/g, '\\|'));

  return `| ${cells.join(' | ')} |`;
}

function rowToMarkdownHeader(row) {
  if (!row || typeof row !== 'object') return '';

  const keys = Object.keys(row);
  const headers = keys.map(k => k);
  const separators = keys.map(() => '---');

  return `| ${headers.join(' | ')} |\n| ${separators.join(' | ')} |`;
}

export function run(input) {
  const steps = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { backups, checkpointDate } = input;

  if (!Array.isArray(backups)) {
    return { ok: false, error: 'backups must be an array' };
  }

  if (backups.length === 0) {
    return { ok: false, error: 'backups array cannot be empty' };
  }

  if (typeof checkpointDate !== 'string') {
    return { ok: false, error: 'checkpointDate must be ISO 8601 YYYY-MM-DD format' };
  }

  // Validate checkpoint date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkpointDate)) {
    return { ok: false, error: 'checkpointDate must be ISO 8601 YYYY-MM-DD format' };
  }

  steps.push(`rendering ${backups.length} backup records`);

  // Build markdown tables for each backup
  const markdownLines = [];
  markdownLines.push('```markdown');

  // Sort by timestamp
  const sorted = [...backups].sort((a, b) => {
    const aTime = new Date(a.timestamp || '').getTime();
    const bTime = new Date(b.timestamp || '').getTime();
    return aTime - bTime;
  });

  let currentTableData = null;

  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];

    if (!record.original || typeof record.original !== 'object') {
      return { ok: false, error: 'each backup must have original row' };
    }

    if (!record.replacement || typeof record.replacement !== 'object') {
      return { ok: false, error: 'each backup must have replacement row' };
    }

    if (typeof record.timestamp !== 'string') {
      return { ok: false, error: 'each backup must have timestamp' };
    }

    if (i === 0) {
      currentTableData = record.original;
      markdownLines.push('## Original Rows');
      markdownLines.push('');
      markdownLines.push(rowToMarkdownHeader(record.original));
    }

    markdownLines.push(rowToMarkdownRow(record.original));
    steps.push(`added original row for timestamp ${record.timestamp}`);
  }

  markdownLines.push('');
  markdownLines.push('## Replacement Rows');
  markdownLines.push('');

  if (sorted.length > 0) {
    markdownLines.push(rowToMarkdownHeader(sorted[0].replacement));
  }

  for (const record of sorted) {
    markdownLines.push(rowToMarkdownRow(record.replacement));
    steps.push(`added replacement row`);
  }

  markdownLines.push('```');

  const filename = `backup-${checkpointDate}.md`;
  const markdown = markdownLines.join('\n');

  steps.push(`organized backup file: ${filename}`);

  // Return effects array with write-file operation
  const effects = [
    {
      kind: 'write-file',
      path: `backups/${filename}`,
      content: markdown
    }
  ];

  return {
    ok: true,
    filename,
    recordCount: backups.length,
    checkpointDate,
    effects,
    trace: { node: 'L1.E06', steps }
  };
}
