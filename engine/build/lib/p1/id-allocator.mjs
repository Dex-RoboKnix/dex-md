// node: L4.E08
// input: {existingIds: number[]} array of existing IDs

export function run(input) {
  // note: input must be an object with existingIds array
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Input must be an object with existingIds field' };
  }

  const { existingIds, now } = input;

  if (!Array.isArray(existingIds)) {
    return { ok: false, error: 'existingIds must be an array' };
  }

  // note: accept empty array (starts at 0)
  // type check: all elements must be non-negative integers
  for (const id of existingIds) {
    if (typeof id !== 'number' || id < 0 || !Number.isInteger(id)) {
      return { ok: false, error: 'All existingIds must be non-negative integers' };
    }
  }

  // acceptance 1: find maximum existing ID
  const maxId = existingIds.length === 0 ? 0 : Math.max(...existingIds); // note: IDs start at 001, so an empty list allocates 1

  // acceptance 2: next ID is max + 1
  const nextId = maxId + 1;

  // acceptance 3: reject overflow at 999
  if (nextId > 999) {
    return { ok: false, error: `Overflow error: next ID ${nextId} exceeds maximum 999` };
  }

  // acceptance 4: audit log records allocation with timestamp
  const audit = {
    event: 'id-allocated',
    at: now || null,
    nextId,
    maxPrevious: maxId
  };

  return {
    ok: true,
    nextId,
    audit,
    trace: {
      node: 'L4.E08',
      steps: [
        `found maximum existing ID: ${maxId}`,
        `calculated next ID: ${nextId}`,
        `overflow check: ${nextId} <= 999 passes`
      ]
    }
  };
}
