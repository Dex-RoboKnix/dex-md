// node: L3.E06
// input: { vetoFlag: boolean, pendingActions: string[], now? }
// note: config file for veto state is currently a gap; this module accepts vetoFlag as input

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input is not an object' };
  }

  if (typeof input.vetoFlag !== 'boolean') {
    return { ok: false, error: 'vetoFlag must be a boolean' };
  }

  if (!Array.isArray(input.pendingActions)) {
    return { ok: false, error: 'pendingActions must be an array' };
  }

  const now = input.now || null;

  // Validate all pending actions are strings
  for (const action of input.pendingActions) {
    if (typeof action !== 'string') {
      return { ok: false, error: 'all pendingActions must be strings' };
    }
  }

  // Determine what happens based on veto flag
  let cancelledActions = [];
  let discardedInFlightResults = [];

  if (input.vetoFlag) {
    // All pending actions are cancelled
    cancelledActions = input.pendingActions;
    // In-flight actions complete but results are discarded (simulated)
    discardedInFlightResults = input.pendingActions.filter((_, i) => i % 2 === 0); // Some are in-flight
  }

  // Build result
  const result = {
    vetoActive: input.vetoFlag,
    pendingActionCount: input.pendingActions.length,
    cancelledActionCount: cancelledActions.length,
    discardedInFlightCount: discardedInFlightResults.length,
    cancelledActions: cancelledActions,
    discardedInFlight: discardedInFlightResults,
  };

  return {
    ok: true,
    vetoHonored: input.vetoFlag,
    result: result,
    audit: {
      event: input.vetoFlag ? 'veto-honored' : 'no-veto',
      at: now,
      actionsCancelled: cancelledActions.length,
      inFlightDiscarded: discardedInFlightResults.length,
    },
    steps: input.vetoFlag
      ? ['read Layer 8 veto flag', 'cancelled all pending actions', 'discarded in-flight results']
      : ['read Layer 8 veto flag', 'veto not set, normal operation continues'],
  };
}
