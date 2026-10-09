// node: L4.E04
// input: { id: <string>, node: <node-format>, kind: <string>, action: <string>, skill: <skill-name>, status: <enum> }

const VALID_STATUS = ['pending', 'in-progress', 'done', 'blocked'];

function validateNodeFormat(node) {
  // Format: L#.E## (e.g., L1.E05, L4.E08)
  return /^L\d+\.E\d{2}$/.test(node);
}

export function run(input) {
  const steps = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { id, node, kind, action, skill, status, now } = input;

  // Validate id
  if (typeof id !== 'string' || id === '') {
    return { ok: false, error: 'id must be non-empty string' };
  }

  // Validate node format L#.E##
  if (typeof node !== 'string') {
    return { ok: false, error: 'node must be string' };
  }

  if (!validateNodeFormat(node)) {
    steps.push(`invalid node format: ${node}`);
    return {
      ok: false,
      error: 'node must be format L#.E## (e.g., L1.E05)',
      field: 'node',
      trace: { node: 'L4.E04', steps }
    };
  }

  // Validate kind
  if (typeof kind !== 'string' || kind === '') {
    return { ok: false, error: 'kind must be non-empty string' };
  }

  // Validate and truncate action
  if (typeof action !== 'string' || action === '') {
    return { ok: false, error: 'action must be non-empty string' };
  }

  const truncatedAction = action.length > 80 ? action.slice(0, 80) : action;

  // Validate skill (just check it's a string, name registry validation is TBD)
  if (typeof skill !== 'string' || skill === '') {
    return { ok: false, error: 'skill must be non-empty string' };
  }

  // Note: Skill registry validation is TBD per spec
  steps.push(`skill "${skill}" will be validated against registry at build time (TBD)`);

  // Validate status enum
  if (typeof status !== 'string') {
    return { ok: false, error: 'status must be string' };
  }

  if (!VALID_STATUS.includes(status)) {
    steps.push(`invalid status: ${status}`);
    return {
      ok: false,
      error: `status must be one of: ${VALID_STATUS.join(', ')}`,
      field: 'status',
      trace: { node: 'L4.E04', steps }
    };
  }

  steps.push(`action row validated: id=${id}, node=${node}, status=${status}`);

  // Handle done status with completion date
  let completionDate = null;
  let audit = undefined;
  if (status === 'done') {
    const completionTimestamp = now || new Date().toISOString();
    completionDate = completionTimestamp.split('T')[0];
    steps.push(`marking done with completion date: ${completionDate}`);
    // acceptance 4: record completion date in audit
    audit = {
      event: 'action-marked-done',
      at: completionTimestamp,
      id,
      node,
      completionDate
    };
  }

  return {
    ok: true,
    id,
    node,
    kind,
    action: truncatedAction,
    actionTruncated: action.length > 80,
    originalActionLength: action.length,
    skill,
    status,
    completionDate: completionDate,
    audit,
    trace: { node: 'L4.E04', steps }
  };
}
