// node: L3.E05
// input: { answer: string, check_tag?: boolean }

const SIMULATED_TAG = '[SIMULATED]';

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  if (typeof input.answer !== 'string') {
    return { ok: false, error: 'input.answer must be a string' };
  }

  const answer = input.answer;
  const checkTag = input.check_tag !== false; // default to true

  // If check_tag is enabled and answer already has tag, validate it
  if (checkTag && answer.startsWith(SIMULATED_TAG)) {
    return {
      ok: true,
      taggedAnswer: answer,
      tagAlreadyPresent: true,
      trace: {
        node: 'L3.E05',
        steps: [{ action: 'tag-already-present' }]
      }
    };
  }

  const taggedAnswer = `${SIMULATED_TAG} ${answer}`;
  const steps = [{ action: 'prepend-tag', tag: SIMULATED_TAG }];

  return {
    ok: true,
    taggedAnswer,
    tagAlreadyPresent: false,
    trace: {
      node: 'L3.E05',
      steps
    }
  };
}
