// node: L1.E01
// input: { ref: string }

export function run(input) {
  const trace = { node: 'L1.E01', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { ref } = input;

  if (typeof ref !== 'string' || ref === '') {
    trace.steps.push('validate_ref: input missing or empty');
    return { ok: false, error: 'Missing ref: provide a semantic version (vX.Y.Z) or 40-character hex commit SHA' };
  }

  trace.steps.push(`validate_ref: checking "${ref}"`);

  // Check semantic version v0.0.0 format
  const semverPattern = /^v\d+\.\d+\.\d+$/;
  if (semverPattern.test(ref)) {
    trace.steps.push(`validate_ref: recognized semantic version`);
    return { ok: true, valid: true, ref, trace };
  }

  // Check 40-hex commit SHA format
  const shaPattern = /^[0-9a-f]{40}$/;
  if (shaPattern.test(ref)) {
    trace.steps.push(`validate_ref: recognized 40-hex commit SHA`);
    return { ok: true, valid: true, ref, trace };
  }

  // Rejected: provide guidance for correction
  trace.steps.push(`validate_ref: rejected (not semver or SHA)`);
  const guidance = ref.includes('.') || ref.match(/^\d/) ?
    'Expected format: vX.Y.Z (e.g., v1.2.3) or 40-character hex SHA' :
    'Branches and pre-release variants not allowed; use vX.Y.Z or 40-character hex SHA';

  return { ok: false, error: `Invalid ref "${ref}": ${guidance}` };
}
