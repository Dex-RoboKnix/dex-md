// node: L2.E03
// input: { answer: string, followUp?: string, now?: string }

const VAGUE_WORDS = /\b(maybe|i think|sort of|kind of|seems|appears|probably|somewhat|possibly|might|could be|not sure|unsure|believe|guess)\b/i;

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid input' };
  }

  const { answer, followUp, now } = input;

  if (typeof answer !== 'string' || answer === '') {
    return { ok: false, error: 'answer must be non-empty string' };
  }

  if (followUp !== undefined && typeof followUp !== 'string') {
    return { ok: false, error: 'followUp must be string' };
  }

  const isVague = VAGUE_WORDS.test(answer);
  const steps = [];
  const audit = {
    event: 'vague-answer-detected',
    at: now || null,
    answerIsVague: isVague
  };

  if (!isVague) {
    return {
      ok: true,
      isVague: false,
      quality: 'clear',
      trace: {
        node: 'L2.E03',
        steps: [{ type: 'analysis', result: 'clear' }]
      },
      audit
    };
  }

  // Answer is vague; check if there's a follow-up
  steps.push({ type: 'vague-detected', allowed_followups: 1 });

  if (!followUp) {
    // No follow-up provided, mark as weak
    audit.event = 'weak-answer-marked';
    audit.reason = 'vague-no-followup';

    return {
      ok: true,
      isVague: true,
      quality: 'weak',
      followUpAllowed: true,
      audit,
      trace: {
        node: 'L2.E03',
        steps
      }
    };
  }

  // Follow-up provided; check if it resolves the vagueness
  const followUpVague = VAGUE_WORDS.test(followUp);
  steps.push({ type: 'followup-provided', resolves: !followUpVague });

  if (followUpVague) {
    // Follow-up is also vague; mark weak immediately
    audit.event = 'weak-answer-marked';
    audit.reason = 'vague-followup-also-vague';
    audit.followUpProvided = true;
    audit.followUpIsVague = true;

    return {
      ok: true,
      isVague: true,
      quality: 'weak',
      followUpUsed: true,
      followUpResolved: false,
      audit,
      trace: {
        node: 'L2.E03',
        steps
      }
    };
  }

  // Follow-up resolves the vagueness
  audit.event = 'answer-clarified';
  audit.followUpProvided = true;
  audit.followUpIsVague = false;

  return {
    ok: true,
    isVague: true,
    quality: 'clarified',
    followUpUsed: true,
    followUpResolved: true,
    audit,
    trace: {
      node: 'L2.E03',
      steps
    }
  };
}
