// node: L5.E03
// input: { questions: Array<{text: string}> }

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid input' };
  }

  const { questions } = input;

  if (!Array.isArray(questions)) {
    return { ok: false, error: 'questions must be array' };
  }

  const steps = [];
  const dependencies = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (!q || typeof q !== 'object' || typeof q.text !== 'string') {
      return { ok: false, error: `Question ${i} has invalid structure` };
    }

    const text = q.text.toLowerCase();
    let dependentOn = null;

    // Check for explicit references: "based on Q1", "based on your answer to Q1", etc.
    const explicitMatch = text.match(/based on (?:your answer to |question |q)(\d+)/i);
    if (explicitMatch) {
      dependentOn = parseInt(explicitMatch[1], 10) - 1;
    }

    // Check for "depending on your answer" or similar
    if (!dependentOn && /depending on your answer|depending on your response/.test(text)) {
      if (i > 0) {
        dependentOn = i - 1;
      }
    }

    // Check for "similar to the previous answer"
    if (!dependentOn && /similar to (?:the )?previous answer|similar to previous|like your last answer/.test(text)) {
      if (i > 0) {
        dependentOn = i - 1;
      }
    }

    if (dependentOn !== null) {
      dependencies.push({
        questionIndex: i,
        dependsOn: dependentOn,
        referenced: dependentOn
      });
      steps.push({ index: i, type: 'dependency-detected', dependsOn: dependentOn });
    } else {
      steps.push({ index: i, type: 'independent' });
    }
  }

  return {
    ok: true,
    dependencies,
    independentCount: questions.length - dependencies.length,
    trace: {
      node: 'L5.E03',
      steps
    }
  };
}
