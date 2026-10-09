// node: L1.E05
// input: { tag: <string> } or { tags: [<string>, ...] }

const VALID_TAGS = ['DOCUMENT', 'CITED', 'MODEL', 'UNSURE'];

export function run(input) {
  const steps = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  // Single tag
  if (input.tag !== undefined) {
    const tag = input.tag;

    if (typeof tag !== 'string') {
      return { ok: false, error: 'tag must be a string' };
    }

    if (tag === '') {
      return { ok: false, error: 'tag cannot be empty string' };
    }

    if (!VALID_TAGS.includes(tag)) {
      steps.push(`tag "${tag}" not in allowed list`);
      return {
        ok: false,
        error: `tag must be one of: ${VALID_TAGS.join(', ')}`,
        found: tag,
        trace: { node: 'L1.E05', steps }
      };
    }

    steps.push(`tag "${tag}" validated`);
    return {
      ok: true,
      tag,
      valid: true,
      trace: { node: 'L1.E05', steps }
    };
  }

  // Multiple tags
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags)) {
      return { ok: false, error: 'tags must be an array' };
    }

    if (input.tags.length === 0) {
      return { ok: false, error: 'tags array cannot be empty' };
    }

    const validTags = [];
    const invalidTags = [];

    for (const tag of input.tags) {
      if (typeof tag !== 'string') {
        return { ok: false, error: 'all tags must be strings' };
      }

      if (tag === '') {
        invalidTags.push('');
      } else if (!VALID_TAGS.includes(tag)) {
        invalidTags.push(tag);
      } else {
        validTags.push(tag);
        steps.push(`tag "${tag}" validated`);
      }
    }

    if (invalidTags.length > 0) {
      steps.push(`invalid tags found: ${invalidTags.join(', ')}`);
      return {
        ok: false,
        error: `invalid tags. Must be one of: ${VALID_TAGS.join(', ')}`,
        invalid: invalidTags,
        trace: { node: 'L1.E05', steps }
      };
    }

    return {
      ok: true,
      tags: validTags,
      valid: true,
      count: validTags.length,
      trace: { node: 'L1.E05', steps }
    };
  }

  return { ok: false, error: 'input must have tag or tags field' };
}
