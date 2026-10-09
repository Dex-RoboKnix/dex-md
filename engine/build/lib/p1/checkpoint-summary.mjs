// node: L4.E08
// input: { checkpoint: { journal?: [], source?: [], claim?: [], nodeChange?: [], action?: [] } }

export function run(input) {
  const steps = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { checkpoint } = input;

  if (!checkpoint || typeof checkpoint !== 'object') {
    return { ok: false, error: 'checkpoint must be an object' };
  }

  steps.push('counting checkpoint items by section');

  // Initialize counts
  let journalCount = 0;
  let sourceCount = 0;
  let claimCount = 0;
  let nodeChangeCount = 0;
  let actionCount = 0;

  // Count journal items
  if (checkpoint.journal !== undefined) {
    if (!Array.isArray(checkpoint.journal)) {
      return { ok: false, error: 'journal must be an array' };
    }
    journalCount = checkpoint.journal.length;
    steps.push(`journal: ${journalCount} items`);
  }

  // Count source items
  if (checkpoint.source !== undefined) {
    if (!Array.isArray(checkpoint.source)) {
      return { ok: false, error: 'source must be an array' };
    }
    sourceCount = checkpoint.source.length;
    steps.push(`source: ${sourceCount} items`);
  }

  // Count claim items
  if (checkpoint.claim !== undefined) {
    if (!Array.isArray(checkpoint.claim)) {
      return { ok: false, error: 'claim must be an array' };
    }
    claimCount = checkpoint.claim.length;
    steps.push(`claim: ${claimCount} items`);
  }

  // Count node-change items
  if (checkpoint.nodeChange !== undefined) {
    if (!Array.isArray(checkpoint.nodeChange)) {
      return { ok: false, error: 'nodeChange must be an array' };
    }
    nodeChangeCount = checkpoint.nodeChange.length;
    steps.push(`nodeChange: ${nodeChangeCount} items`);
  }

  // Count action items
  if (checkpoint.action !== undefined) {
    if (!Array.isArray(checkpoint.action)) {
      return { ok: false, error: 'action must be an array' };
    }
    actionCount = checkpoint.action.length;
    steps.push(`action: ${actionCount} items`);
  }

  const totalCount = journalCount + sourceCount + claimCount + nodeChangeCount + actionCount;
  steps.push(`total: ${totalCount} items`);

  return {
    ok: true,
    journalCount,
    sourceCount,
    claimCount,
    nodeChangeCount,
    actionCount,
    totalCount,
    trace: { node: 'L4.E08', steps }
  };
}
