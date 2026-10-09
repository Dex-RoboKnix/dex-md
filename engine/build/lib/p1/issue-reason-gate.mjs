// node: L3.E03
// input: { reason: <code>, text?: <string>, requester?: <string> }

const VALID_REASONS = [
  'BLOCKS_OUTCOME',
  'COVERAGE_DROPPED',
  'CONTRADICTION',
  'SAFETY_RISK'
];

export function run(input) {
  const steps = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { reason, text, requester, now } = input;

  // Validate reason
  if (typeof reason !== 'string') {
    return { ok: false, error: 'reason must be a string' };
  }

  if (reason === '') {
    return { ok: false, error: 'reason cannot be empty' };
  }

  steps.push(`checking reason code: ${reason}`);

  // Check if reason is in the hardcoded list
  if (!VALID_REASONS.includes(reason)) {
    steps.push(`invalid reason code: ${reason}`);
    return {
      ok: false,
      error: `Unasked issue rejected. Valid reason codes are: ${VALID_REASONS.join(', ')}`,
      supplied: reason,
      validReasons: VALID_REASONS,
      trace: { node: 'L3.E03', steps }
    };
  }

  steps.push(`reason code "${reason}" accepted`);

  // Log audit information
  const audit = {
    event: 'issue-reason-validated',
    at: now || null,
    reasonCode: reason,
    suppliedText: text || undefined,
    requester: requester || undefined,
    nextSteps: 'Issue resubmitted with valid reason code'
  };

  steps.push(`logged audit: ${reason} from ${requester || 'unknown'}`);

  return {
    ok: true,
    approved: true,
    reason: reason,
    audit: audit,
    trace: { node: 'L3.E03', steps }
  };
}
