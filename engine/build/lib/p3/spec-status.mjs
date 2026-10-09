// node: L5.E03
// input: { state: 'DRAFT'|'FINAL', action: 'finalise'|'amend'|'read'|'write', reviewPass?: boolean, amendment?: any, actor?: string, reason?: string, now?: string }

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid input' };
  }

  const { state, action, reviewPass, amendment, actor = 'system', reason = '', now } = input;

  if (!['DRAFT', 'FINAL'].includes(state)) {
    return { ok: false, error: 'state must be DRAFT or FINAL' };
  }

  if (!['finalise', 'amend', 'read', 'write'].includes(action)) {
    return { ok: false, error: 'action must be finalise, amend, read, or write' };
  }

  const steps = [];
  let newState = state;
  let allowed = true;
  const transitions = [];

  if (state === 'DRAFT' && action === 'finalise') {
    if (reviewPass === true) {
      newState = 'FINAL';
      transitions.push({
        from: 'DRAFT',
        to: 'FINAL',
        via: 'finalise',
        requiresReview: true,
        reviewPassed: true
      });
      steps.push({ type: 'state-transition', from: 'DRAFT', to: 'FINAL' });
    } else {
      allowed = false;
      return {
        ok: false,
        error: 'Cannot finalise without dex-review PASS'
      };
    }
  } else if (state === 'FINAL' && action === 'amend') {
    // Amend only reverts to DRAFT if there are actual changes
    if (amendment && typeof amendment === 'object' && Object.keys(amendment).length > 0) {
      newState = 'DRAFT';
      transitions.push({
        from: 'FINAL',
        to: 'DRAFT',
        via: 'amend',
        hasChanges: true
      });
      steps.push({ type: 'state-transition', from: 'FINAL', to: 'DRAFT' });
    } else {
      // No actual changes; remain FINAL
      newState = 'FINAL';
      steps.push({ type: 'amend-no-changes', remainsInState: 'FINAL' });
    }
  } else if (state === 'FINAL' && action === 'read') {
    // Read is allowed on FINAL
    steps.push({ type: 'read-operation', allowed: true });
  } else if (state === 'FINAL' && action === 'write') {
    // Write is blocked on FINAL (except amend)
    allowed = false;
    return {
      ok: false,
      error: 'FINAL spec blocks write operations; use amend to modify'
    };
  } else if (state === 'DRAFT' && action === 'write') {
    // Write is allowed on DRAFT
    steps.push({ type: 'write-operation', allowed: true });
  } else if (state === 'DRAFT' && action === 'read') {
    // Read is allowed on DRAFT
    steps.push({ type: 'read-operation', allowed: true });
  }

  // Create audit record for state transitions
  const audit = {
    event: `state-${action}`,
    state,
    action,
    newState,
    actor,
    at: now || null,
    reason
  };

  return {
    ok: allowed,
    state: newState,
    stateChanged: newState !== state,
    transitions,
    audit,
    trace: {
      node: 'L5.E03',
      steps
    }
  };
}
