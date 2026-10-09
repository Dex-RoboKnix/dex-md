// node: L1.E05
// input: {answered, weak, total} counts

export function run(input) {
  // note: reject invalid input shapes early, treat undefined/null/non-object as malformed
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Input must be an object with answered, weak, total fields' };
  }

  const { answered, weak, total, now } = input;

  // type check: all must be numbers and non-negative
  if (typeof answered !== 'number' || typeof weak !== 'number' || typeof total !== 'number') {
    return { ok: false, error: 'answered, weak, and total must be numbers' };
  }

  if (answered < 0 || weak < 0 || total < 0) {
    return { ok: false, error: 'answered, weak, and total must be non-negative' };
  }

  if (total === 0) {
    return { ok: false, error: 'total must be greater than zero' };
  }

  // acceptance 1: accept the object shape
  // acceptance 2: calculate percentage with weak at 0.5 weight
  const numerator = answered + 0.5 * weak;
  const percentage = (numerator / total) * 100;

  // acceptance 3: log counts for auditability
  const audit = {
    event: 'coverage-calculated',
    at: now || null,
    answered,
    weak,
    total
  };

  return {
    ok: true,
    percentage: Math.round(percentage * 100) / 100,
    numerator,
    denominator: total,
    audit,
    trace: {
      node: 'L1.E05',
      steps: [
        `counted answered=${answered}, weak=${weak}, total=${total}`,
        `calculated numerator=${numerator} (answered + 0.5*weak)`,
        `calculated percentage=${percentage.toFixed(2)}`
      ]
    }
  };
}
