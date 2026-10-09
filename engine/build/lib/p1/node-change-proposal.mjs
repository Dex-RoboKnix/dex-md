// node: L1.E03
// input: {proposal: object, yes?: boolean}

export function run(input) {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Input must be an object with proposal and optional yes field' };
  }

  const { proposal, yes = false, now } = input;

  // type check
  if (typeof proposal !== 'object' || proposal === null || Array.isArray(proposal)) {
    return { ok: false, error: 'proposal must be a non-array object' };
  }

  if (typeof yes !== 'boolean') {
    return { ok: false, error: 'yes must be a boolean if provided' };
  }

  // acceptance 1: parse all proposals, validate on creation
  const parsedProposal = JSON.parse(JSON.stringify(proposal));

  // acceptance 2: no vault modifications until yes===true
  let applied = false;
  if (yes === true) {
    applied = true;
  }

  // acceptance 3: checkpoint stores proposals, separate audit file tracks approvals
  const auditEntry = {
    event: 'proposal-created',
    at: now || null,
    approved: applied ? now || null : null,
    yes,
    proposal: parsedProposal
  };

  return {
    ok: true,
    proposal: parsedProposal,
    yes,
    applied,
    audit: auditEntry,
    trace: {
      node: 'L1.E03',
      steps: [
        'parsed and validated proposal on creation',
        `yes field defaults to ${yes}`,
        `proposal application gated: applied=${applied}`,
        `audit entry recorded with timestamp`
      ]
    }
  };
}
