// node: L6.E05
// input: { codeComments: [{file, line, comment}], spec: string }

export function run(input) {
  const steps = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Input must be an object' };
  }

  if (!Array.isArray(input.codeComments)) {
    return { ok: false, error: 'Input.codeComments must be an array' };
  }

  if (typeof input.spec !== 'string' && input.spec !== undefined) {
    return { ok: false, error: 'Input.spec must be a string or undefined' };
  }

  steps.push(`Analyzing ${input.codeComments.length} code comments`);

  // Note: we analyze explicit comments only, not inferred from structure
  const discrepancies = [];

  for (const comment of input.codeComments) {
    if (!comment.file || !comment.comment) {
      continue;
    }

    // Extract potential behaviour descriptions from comments
    // Look for patterns like "TODO:", "FIXME:", "BUG:", "NOTE:", "IMPLEMENTS:", "DOES NOT:"
    const text = comment.comment;

    // Check if comment is marked as unimplemented/incomplete
    const isUnimplemented = /TODO|FIXME|NOT YET|FUTURE|UNIMPLEMENTED/i.test(text);

    if (isUnimplemented) {
      steps.push(`Found unimplemented behaviour at ${comment.file}:${comment.line}`);

      discrepancies.push({
        file: comment.file,
        line: comment.line,
        behaviour: text,
        implemented: false,
        severity: 'discrepancy'
      });
    }
  }

  steps.push(`Found ${discrepancies.length} discrepancy(ies)`);

  return {
    ok: true,
    analysisType: 'explicit-comments-only',
    discrepancies,
    commentCount: input.codeComments.length,
    discrepancyCount: discrepancies.length,
    trace: {
      node: 'L6.E05',
      steps
    }
  };
}
