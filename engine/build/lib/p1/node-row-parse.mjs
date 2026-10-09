// node: L4.E08
// input: {point: string, answer: string, tag: string, state: string, sources: string|string[], verified: string, next: string|string[]}

export function run(input) {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Input must be an object with spine node table row fields' };
  }

  const { point, answer, tag, state, sources = '', verified = '', next = '', now } = input;

  // type check
  if (typeof point !== 'string' || typeof answer !== 'string' || typeof tag !== 'string' ||
      typeof state !== 'string') {
    return { ok: false, error: 'point, answer, tag, state must be strings' };
  }

  if (point === '') {
    return { ok: false, error: 'point must not be empty' };
  }

  // acceptance 3: validate state codes
  const validStateCodes = ['C', 'W', 'N', 'NA', 'U'];
  if (!validStateCodes.includes(state)) {
    return { ok: false, error: `Invalid state code '${state}'; must be one of: ${validStateCodes.join(', ')}` };
  }

  // acceptance 1: parse with camelCase field names
  // acceptance 2: arrays for multi-value columns
  const sourcesArray = sources === '' ? [] : (Array.isArray(sources) ? sources : [sources]);
  const nextArray = next === '' ? [] : (Array.isArray(next) ? next : [next]);

  // Track which columns were missing or defaulted
  const missingColumns = [];
  if (answer === '') missingColumns.push('answer');
  if (tag === '') missingColumns.push('tag');
  if (sources === '') missingColumns.push('sources');
  if (verified === '') missingColumns.push('verified');
  if (next === '') missingColumns.push('next');

  const parsed = {
    point,
    answer: answer || null,
    tag: tag || null,
    state,
    sources: sourcesArray,
    verified: verified || null,
    next: nextArray
  };

  // acceptance 3: log when columns are missing (audit for auditability)
  const audit = missingColumns.length > 0 ? {
    event: 'node-row-parsed-with-defaults',
    at: now || null,
    point,
    missingColumns,
    defaultedCount: missingColumns.length
  } : undefined;

  return {
    ok: true,
    parsed,
    audit,
    trace: {
      node: 'L4.E08',
      steps: [
        `parsed Point=${point}`,
        `mapped to camelCase field names`,
        `validated state code: ${state}`,
        `converted multi-value columns to arrays`,
        `sources.length=${sourcesArray.length}, next.length=${nextArray.length}`,
        missingColumns.length > 0 ? `missing columns: ${missingColumns.join(', ')}` : 'all columns present'
      ]
    }
  };
}
