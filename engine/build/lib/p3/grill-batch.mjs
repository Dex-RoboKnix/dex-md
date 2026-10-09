// node: L5.E03
// input: { questions: Array<{options: Array}> }

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid input' };
  }

  const { questions } = input;

  if (!Array.isArray(questions)) {
    return { ok: false, error: 'questions must be array' };
  }

  if (questions.length === 0) {
    return { ok: false, error: 'Grill must have at least 1 question' };
  }

  if (questions.length > 3) {
    return { ok: false, error: 'Grill must have at most 3 questions' };
  }

  const steps = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (!q || typeof q !== 'object' || !Array.isArray(q.options)) {
      return { ok: false, error: `Question ${i} has invalid structure` };
    }

    const optCount = q.options.length;

    if (optCount < 2) {
      return { ok: false, error: `Question ${i} has ${optCount} option(s); requires 2-4 options` };
    }

    if (optCount > 4) {
      return { ok: false, error: `Question ${i} has ${optCount} options; requires 2-4 options` };
    }

    steps.push({ index: i, optionCount: optCount });
  }

  return {
    ok: true,
    validationPassed: true,
    trace: {
      node: 'L5.E03',
      steps
    }
  };
}
