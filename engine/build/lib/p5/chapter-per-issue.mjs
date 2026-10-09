// node: L4.E08
// input: { issue: { number, title, body }, now: ISO8601 }

const MAX_WORDS = 10;
const MAX_CHARS = 60;
const MISSING_BODY_PLACEHOLDER = '[NEEDS BODY DESCRIPTION]';

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { issue } = input;

  if (!issue || typeof issue !== 'object') {
    return { ok: false, error: 'issue is required' };
  }

  const { number, title, body } = issue;

  if (!Number.isInteger(number) || number <= 0) {
    return { ok: false, error: 'issue number must be a positive integer' };
  }
  if (typeof title !== 'string' || title.length === 0) {
    return { ok: false, error: 'issue title must be a non-empty string' };
  }

  // Enforce title constraints
  const words = title.trim().split(/\s+/);
  if (words.length > MAX_WORDS) {
    return { ok: false, error: `chapter title exceeds ${MAX_WORDS} words (got ${words.length})` };
  }
  if (title.length > MAX_CHARS) {
    return { ok: false, error: `chapter title exceeds ${MAX_CHARS} characters (got ${title.length})` };
  }

  // Handle missing body
  const chapter_body = body && typeof body === 'string' && body.trim().length > 0
    ? body
    : MISSING_BODY_PLACEHOLDER;

  const result = {
    ok: true,
    chapter_stub: {
      issue_number: number,
      title: title,
      body: chapter_body,
      missing_body_description: !body || typeof body !== 'string' || body.trim().length === 0,
      word_count: words.length,
      char_count: title.length,
      requires_human_signoff: true,
      github_issue_reference: `#${number}`
    },
    trace: {
      node: 'L4.E08',
      steps: [
        `validated issue number: ${number}`,
        `validated title length: ${words.length} words, ${title.length} characters`,
        chapter_body === MISSING_BODY_PLACEHOLDER ? 'added missing body placeholder' : 'body description present',
        'requires explicit human git commit sign-off'
      ]
    }
  };

  return result;
}
