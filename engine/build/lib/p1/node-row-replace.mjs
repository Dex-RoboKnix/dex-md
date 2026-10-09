// node: L4.E08
// input: {table: Array<{point: string, ...}>, pointToReplace: string, replacementRow: object}

export function run(input) {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Input must be an object with table, pointToReplace, replacementRow fields' };
  }

  const { table, pointToReplace, replacementRow, now } = input;

  // type check
  if (!Array.isArray(table) || typeof pointToReplace !== 'string' ||
      typeof replacementRow !== 'object' || replacementRow === null || Array.isArray(replacementRow)) {
    return { ok: false, error: 'table must be array, pointToReplace must be string, replacementRow must be object' };
  }

  if (pointToReplace === '') {
    return { ok: false, error: 'pointToReplace must not be empty' };
  }

  // acceptance 1: lookup by exact Point column value, case-sensitive
  let foundIndex = -1;
  let foundCount = 0;
  for (let i = 0; i < table.length; i++) {
    if (table[i].point === pointToReplace) {
      foundIndex = i;
      foundCount++;
    }
  }

  // acceptance 2: fail on ambiguous matches
  if (foundCount > 1) {
    return {
      ok: false,
      error: `Ambiguous match: ${foundCount} rows match Point=${pointToReplace}`,
      matchCount: foundCount
    };
  }

  if (foundCount === 0) {
    return {
      ok: false,
      error: `No row found with Point=${pointToReplace}`
    };
  }

  // acceptance 3: backup includes original, replacement, timestamp, user
  const originalRow = table[foundIndex];
  const backup = {
    original: JSON.parse(JSON.stringify(originalRow)),
    replacement: JSON.parse(JSON.stringify(replacementRow)),
    timestamp: now || null,
    user: 'system'
  };

  // Create audit record for the replacement
  const audit = {
    event: 'row-replaced',
    at: now || null,
    point: pointToReplace,
    originalData: JSON.stringify(originalRow),
    replacementData: JSON.stringify(replacementRow)
  };

  // perform replacement (immutable approach: create new table)
  const newTable = [
    ...table.slice(0, foundIndex),
    replacementRow,
    ...table.slice(foundIndex + 1)
  ];

  return {
    ok: true,
    table: newTable,
    replacedRow: originalRow,
    backup,
    audit,
    trace: {
      node: 'L4.E08',
      steps: [
        `lookup by Point=${pointToReplace}, case-sensitive`,
        `found 1 match at index ${foundIndex}`,
        `created backup with timestamp and user`,
        `replaced row in table`
      ]
    }
  };
}
