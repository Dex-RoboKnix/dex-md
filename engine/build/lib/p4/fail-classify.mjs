// node: L6.E08
// input: { taskId, failureEvidence: { type, symptoms, context }, now? }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input is not an object' };
  }

  if (!input.taskId) {
    return { ok: false, error: 'taskId is required' };
  }

  if (!input.failureEvidence || typeof input.failureEvidence !== 'object') {
    return { ok: false, error: 'failureEvidence is required' };
  }

  const evidence = input.failureEvidence;
  const now = input.now || null;

  // Determine failure classification based on evidence
  let classification = null;
  const validClassifications = ['spec-gap', 'impl-bug', 'test-gap', 'environment'];

  // Simple classification logic based on failure type
  if (evidence.type === 'spec-gap') {
    classification = 'spec-gap';
  } else if (evidence.type === 'impl-bug') {
    classification = 'impl-bug';
  } else if (evidence.type === 'test-gap') {
    classification = 'test-gap';
  } else if (evidence.type === 'environment') {
    classification = 'environment';
  } else if (evidence.type && typeof evidence.type === 'string') {
    // Try to infer from type string
    if (evidence.type.includes('spec') || evidence.type.includes('requirement')) {
      classification = 'spec-gap';
    } else if (evidence.type.includes('impl') || evidence.type.includes('code')) {
      classification = 'impl-bug';
    } else if (evidence.type.includes('test') || evidence.type.includes('assertion')) {
      classification = 'test-gap';
    } else if (evidence.type.includes('env') || evidence.type.includes('infrastructure')) {
      classification = 'environment';
    } else {
      return { ok: false, error: `unable to classify failure type: ${evidence.type}` };
    }
  } else {
    return { ok: false, error: 'failureEvidence.type is required' };
  }

  // Build the classification result
  const result = {
    classification: classification,
    taskId: input.taskId,
    at: now,
    evidence: {
      type: evidence.type,
      symptoms: evidence.symptoms || null,
      context: evidence.context || null,
    },
  };

  return {
    ok: true,
    classification: classification,
    audit: {
      event: 'failure-classified',
      at: now,
      taskId: input.taskId,
      classification: classification,
    },
    result: result,
    steps: ['analyzed failure evidence', 'determined root cause', 'recorded classification'],
  };
}
