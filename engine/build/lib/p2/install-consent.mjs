// node: L3.E03
// input: { actionId: string, actionName: string, consentGiven: boolean, now?: string }

export function run(input) {
  const trace = { node: 'L3.E03', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { actionId, actionName, consentGiven, now = null } = input;

  if (typeof actionId !== 'string' || actionId === '') {
    trace.steps.push('validate_input: actionId missing or empty');
    return { ok: false, error: 'Missing actionId' };
  }

  if (typeof actionName !== 'string' || actionName === '') {
    trace.steps.push('validate_input: actionName missing or empty');
    return { ok: false, error: 'Missing actionName' };
  }

  if (typeof consentGiven !== 'boolean') {
    trace.steps.push('validate_input: consentGiven must be boolean');
    return { ok: false, error: 'consentGiven must be a boolean' };
  }

  if (now !== null && typeof now !== 'string') {
    trace.steps.push('validate_input: now must be ISO 8601 string or null');
    return { ok: false, error: 'now must be ISO 8601 string or null' };
  }

  trace.steps.push(`track_consent: actionId="${actionId}", actionName="${actionName}", consent=${consentGiven}`);

  // note: each action requires its own consent; decisions (Q1) enforces per-action, not whole-run
  // note: re-runs require fresh consent per decisions (Q2)
  // note: audit entry records the decision per decisions (Q3)

  const auditEntry = {
    event: consentGiven ? 'consent-granted' : 'consent-denied',
    actionId,
    actionName,
    consentGiven,
    at: now
  };

  trace.steps.push(`track_consent: audit entry created (event=${auditEntry.event})`);

  // Return the effects that must be recorded
  const effects = [];

  // note: caller must append this audit entry to RUNLOG
  effects.push({
    kind: 'append-log',
    path: 'RUNLOG',
    content: JSON.stringify(auditEntry)
  });

  trace.steps.push('track_consent: effects prepared for RUNLOG');

  return {
    ok: true,
    actionId,
    actionName,
    consentGiven,
    audit: auditEntry,
    effects,
    perActionEnforcement: true,
    trace
  };
}
