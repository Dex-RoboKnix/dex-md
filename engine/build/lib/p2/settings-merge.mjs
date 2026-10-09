// node: L5.E04
// input: { existing: object, dexEntries: object }

export function run(input) {
  const trace = { node: 'L5.E04', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { existing = {}, dexEntries = {} } = input;

  if (typeof existing !== 'object' || existing === null) {
    trace.steps.push('validate_input: existing must be object or omitted');
    return { ok: false, error: 'existing must be an object' };
  }

  if (typeof dexEntries !== 'object' || dexEntries === null) {
    trace.steps.push('validate_input: dexEntries must be object or omitted');
    return { ok: false, error: 'dexEntries must be an object' };
  }

  trace.steps.push(`merge_settings: preparing merge of ${Object.keys(dexEntries).length} dex entries`);

  // Create a deep copy for merging
  const merged = JSON.parse(JSON.stringify(existing));
  const conflicts = [];
  const conflictingKeys = [];

  // Merge dex entries, detecting conflicts
  for (const [key, value] of Object.entries(dexEntries)) {
    if (key in merged && typeof merged[key] === 'object' && typeof value === 'object') {
      // Nested merge with conflict detection
      for (const [subkey, subvalue] of Object.entries(value)) {
        if (subkey in merged[key] && merged[key][subkey] !== subvalue) {
          conflicts.push({
            key: `${key}.${subkey}`,
            existing: merged[key][subkey],
            proposed: subvalue
          });
          conflictingKeys.push(`${key}.${subkey}`);
        }
        // Always merge the value (with conflict flag for user awareness)
        merged[key][subkey] = subvalue;
      }
    } else if (key in merged && merged[key] !== value) {
      conflicts.push({
        key,
        existing: merged[key],
        proposed: value
      });
      conflictingKeys.push(key);
      merged[key] = value;  // Still merge despite conflict
    } else {
      merged[key] = value;
    }
  }

  trace.steps.push(`merge_settings: detected ${conflicts.length} conflicts`);

  if (conflicts.length > 0) {
    trace.steps.push(`merge_settings: conflicting keys: ${conflictingKeys.join(', ')}`);
  }

  // Add schema reference
  if (!merged.$schema) {
    merged.$schema = 'https://claude.ai/schemas/claude-settings.json';
    trace.steps.push('merge_settings: added $schema reference');
  }

  // Add verify allow rule
  if (!merged.verify) {
    merged.verify = { allow: true };
    trace.steps.push('merge_settings: added verify allow rule');
  }

  // Compute diff
  const diff = {
    before: existing,
    after: merged,
    conflicts: conflicts,
    summary: `Merge dex entries with ${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''}`
  };

  trace.steps.push('merge_settings: diff computed');

  return {
    ok: true,
    merged,
    existing,
    dexEntries,
    conflicts,
    conflictingKeys,
    diff,
    requiresUserApproval: true,
    schemaAdded: !existing.$schema,
    verifyRuleAdded: !existing.verify,
    conflictWarnings: conflicts.map(c =>
      `WARNING: Key "${c.key}" already exists with value "${JSON.stringify(c.existing)}", proposed replacement: "${JSON.stringify(c.proposed)}"`
    ),
    effects: [],  // note: no actual file writes; caller handles based on user approval
    trace
  };
}
