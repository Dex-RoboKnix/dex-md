// node: L4.E07
// input: { folioTimestamp: <iso-string>, vaultFileTimestamps: [<iso-string>, ...] }

function toUTC(isoString) {
  if (!isoString || typeof isoString !== 'string') {
    return null;
  }
  try {
    const time = new Date(isoString).getTime();
    // NaN indicates invalid date
    if (isNaN(time)) {
      return null;
    }
    return time;
  } catch {
    return null;
  }
}

export function run(input) {
  const steps = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { folioTimestamp, vaultFileTimestamps } = input;

  if (typeof folioTimestamp !== 'string') {
    return { ok: false, error: 'folioTimestamp must be ISO 8601 string' };
  }

  if (!Array.isArray(vaultFileTimestamps)) {
    return { ok: false, error: 'vaultFileTimestamps must be an array' };
  }

  if (vaultFileTimestamps.length === 0) {
    return { ok: false, error: 'vaultFileTimestamps array cannot be empty' };
  }

  // Convert folio timestamp to UTC
  const folioTime = toUTC(folioTimestamp);
  if (folioTime === null) {
    return { ok: false, error: 'folioTimestamp must be valid ISO 8601' };
  }

  steps.push(`folio timestamp: ${folioTimestamp} (UTC: ${folioTime})`);

  // Convert vault file timestamps and find newest
  let newestTime = null;
  let newestTimestamp = null;

  for (const timestamp of vaultFileTimestamps) {
    if (typeof timestamp !== 'string') {
      return { ok: false, error: 'all vault timestamps must be strings' };
    }

    const time = toUTC(timestamp);
    if (time === null) {
      return { ok: false, error: `invalid vault timestamp: ${timestamp}` };
    }

    if (newestTime === null || time > newestTime) {
      newestTime = time;
      newestTimestamp = timestamp;
    }
  }

  steps.push(`newest vault file: ${newestTimestamp} (UTC: ${newestTime})`);

  // Compare: folio is stale if it's strictly less than the newest vault file
  const isStale = folioTime < newestTime;

  steps.push(`folio < newest? ${isStale}`);

  return {
    ok: true,
    stale: isStale,
    folioTime: folioTime,
    newestVaultTime: newestTime,
    comparison: isStale ? 'folio < newest' : 'folio >= newest',
    trace: { node: 'L4.E07', steps }
  };
}
