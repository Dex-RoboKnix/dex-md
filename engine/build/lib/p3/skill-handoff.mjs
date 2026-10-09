// node: L5.E03
// input: { contract: {fieldname: typeName, ...}, output: object }

export function run(input) {
  const steps = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Input must be an object' };
  }

  if (!input.contract || typeof input.contract !== 'object') {
    return { ok: false, error: 'Input.contract must be an object' };
  }

  if (!input.output || typeof input.output !== 'object') {
    return { ok: false, error: 'Input.output must be an object' };
  }

  steps.push('Validating output against contract');

  const contract = input.contract;
  const output = input.output;
  const matched = [];
  const missing = [];
  const typeMismatches = [];

  // Check each contract field
  for (const [fieldName, expectedType] of Object.entries(contract)) {
    steps.push(`Checking field '${fieldName}' (type: ${expectedType})`);

    if (!(fieldName in output)) {
      missing.push(fieldName);
      steps.push(`  Missing: '${fieldName}'`);
      continue;
    }

    // Simple type checking
    const actualValue = output[fieldName];
    const actualType = Array.isArray(actualValue) ? 'array' : typeof actualValue;

    if (expectedType === 'array' && !Array.isArray(actualValue)) {
      typeMismatches.push({ field: fieldName, expected: expectedType, actual: actualType });
      steps.push(`  Type mismatch: expected ${expectedType}, got ${actualType}`);
      continue;
    }

    if (expectedType !== 'array' && actualType !== expectedType) {
      typeMismatches.push({ field: fieldName, expected: expectedType, actual: actualType });
      steps.push(`  Type mismatch: expected ${expectedType}, got ${actualType}`);
      continue;
    }

    matched.push(fieldName);
    steps.push(`  OK: '${fieldName}' matches`);
  }

  // If there are type mismatches, fail validation
  if (typeMismatches.length > 0) {
    steps.push(`Validation failed: ${typeMismatches.length} type mismatch(es)`);
    return {
      ok: false,
      error: `Type mismatches: ${typeMismatches.map(m => m.field).join(', ')}`,
      matched,
      missing,
      typeMismatches,
      trace: {
        node: 'L5.E03',
        steps
      }
    };
  }

  // Extra fields in output are ignored per spec
  steps.push('Extra fields in output ignored');

  return {
    ok: true,
    matched,
    missing,
    extraFields: Object.keys(output).filter(k => !(k in contract)),
    validated: missing.length === 0 && typeMismatches.length === 0,
    trace: {
      node: 'L5.E03',
      steps
    }
  };
}
