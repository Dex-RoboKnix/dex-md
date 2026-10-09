// node: L1.E05
// input: { state: <code> } or { states: [<code>, ...] }

const STATE_WEIGHTS = {
  C: 1,
  W: 0.5,
  N: 0,
  U: 0,
};

export function run(input) {
  const steps = [];

  // Handle empty or invalid input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  // Single state
  if (input.state !== undefined) {
    const code = input.state;
    if (typeof code !== 'string') {
      return { ok: false, error: 'state must be a string' };
    }
    if (code === 'NA') {
      steps.push(`state "${code}" has no weight (excluded from denominator)`);
      return {
        ok: true,
        weight: undefined,
        included: false,
        trace: { node: 'L1.E05', steps }
      };
    }
    if (!(code in STATE_WEIGHTS)) {
      return { ok: false, error: `unknown state code: ${code}` };
    }
    const weight = STATE_WEIGHTS[code];
    steps.push(`state "${code}" mapped to weight ${weight}`);
    return {
      ok: true,
      weight,
      code,
      trace: { node: 'L1.E05', steps }
    };
  }

  // Multiple states
  if (input.states !== undefined) {
    if (!Array.isArray(input.states)) {
      return { ok: false, error: 'states must be an array' };
    }
    if (input.states.length === 0) {
      return { ok: false, error: 'states array cannot be empty' };
    }

    const weights = [];
    const excluded = [];

    for (const code of input.states) {
      if (typeof code !== 'string') {
        return { ok: false, error: 'all states must be strings' };
      }
      if (code === 'NA') {
        excluded.push(code);
        steps.push(`state "${code}" excluded from calculations`);
      } else if (!(code in STATE_WEIGHTS)) {
        return { ok: false, error: `unknown state code: ${code}` };
      } else {
        weights.push(STATE_WEIGHTS[code]);
        steps.push(`state "${code}" weight ${STATE_WEIGHTS[code]}`);
      }
    }

    return {
      ok: true,
      weights,
      excluded,
      sum: parseFloat(weights.reduce((a, b) => a + b, 0).toFixed(2)),
      trace: { node: 'L1.E05', steps }
    };
  }

  return { ok: false, error: 'input must have state or states field' };
}
