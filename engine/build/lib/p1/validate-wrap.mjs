// node: L5.E02
// input: { errors: [<error>, ...], warnings: [<warning>, ...] }

export function run(input) {
  const steps = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { errors, warnings, now } = input;

  // Errors defaults to empty array
  let errorList = [];
  if (errors !== undefined) {
    if (!Array.isArray(errors)) {
      return { ok: false, error: 'errors must be an array' };
    }
    errorList = errors;
  }

  // Warnings defaults to empty array
  let warningList = [];
  if (warnings !== undefined) {
    if (!Array.isArray(warnings)) {
      return { ok: false, error: 'warnings must be an array' };
    }
    warningList = warnings;
  }

  steps.push(`processing ${errorList.length} errors and ${warningList.length} warnings`);

  // Determine if validation passed (zero errors)
  const ok = errorList.length === 0;

  if (ok) {
    steps.push('validation passed: no errors');
  } else {
    steps.push(`validation failed: ${errorList.length} error(s)`);
  }

  if (warningList.length > 0) {
    steps.push(`${warningList.length} warning(s) logged but do not block progress`);
  }

  // Determine outcome string
  let outcome = 'success';
  if (errorList.length > 0) {
    outcome = 'failed';
  } else if (warningList.length > 0) {
    outcome = 'passed_with_warnings';
  }

  // acceptance 3: log warnings (audit when present)
  const audit = warningList.length > 0 ? {
    event: 'validation-warnings-logged',
    at: now || null,
    warningCount: warningList.length,
    warnings: warningList
  } : undefined;

  return {
    ok: ok,
    errors: errorList,
    warnings: warningList,
    outcome: outcome,
    errorCount: errorList.length,
    warningCount: warningList.length,
    audit,
    trace: { node: 'L5.E02', steps }
  };
}
