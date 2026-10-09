// node: L1.E04
// input: { content: <markdown-or-yaml>, path: <filepath> }

const VALID_PROVENANCE = ['PHC', 'OHC', 'AAC'];

// Simple YAML frontmatter parser
function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { frontmatter: null, body: content };
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  const yamlText = match[1];
  const body = match[2];

  // Simple YAML parser for provenance field
  const provMatch = yamlText.match(/^provenance:\s*(\S+)/m);

  return {
    frontmatter: {
      raw: yamlText,
      provenance: provMatch ? provMatch[1] : null
    },
    body
  };
}

export function run(input) {
  const steps = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { content, path, now } = input;

  if (typeof content !== 'string') {
    return { ok: false, error: 'content must be a string' };
  }

  if (content === '' || content === null || content === undefined) {
    return { ok: false, error: 'content cannot be empty' };
  }

  if (path && typeof path !== 'string') {
    return { ok: false, error: 'path must be a string' };
  }

  steps.push(`parsing frontmatter from ${path || 'content'}`);

  const { frontmatter, body } = parseFrontmatter(content);

  if (!frontmatter) {
    steps.push('no frontmatter found');
    const audit = {
      event: 'provenance-check-failed',
      at: now || null,
      reason: 'missing-frontmatter',
      path: path || 'unknown'
    };
    return {
      ok: false,
      error: 'frontmatter with --- delimiters required',
      path: path || undefined,
      audit,
      trace: { node: 'L1.E04', steps }
    };
  }

  if (!frontmatter.provenance) {
    steps.push('provenance field missing in frontmatter');
    const audit = {
      event: 'provenance-check-failed',
      at: now || null,
      reason: 'missing-provenance-field',
      path: path || 'unknown'
    };
    return {
      ok: false,
      error: 'provenance field required in frontmatter',
      path: path || undefined,
      audit,
      trace: { node: 'L1.E04', steps }
    };
  }

  if (!VALID_PROVENANCE.includes(frontmatter.provenance)) {
    steps.push(`invalid provenance value: ${frontmatter.provenance}`);
    const audit = {
      event: 'provenance-check-failed',
      at: now || null,
      reason: 'invalid-provenance-value',
      found: frontmatter.provenance,
      path: path || 'unknown'
    };
    return {
      ok: false,
      error: `provenance must be one of: ${VALID_PROVENANCE.join(', ')}`,
      found: frontmatter.provenance,
      path: path || undefined,
      audit,
      trace: { node: 'L1.E04', steps }
    };
  }

  steps.push(`provenance validated: ${frontmatter.provenance}`);

  return {
    ok: true,
    provenance: frontmatter.provenance,
    path: path || undefined,
    hasFrontmatter: true,
    trace: { node: 'L1.E04', steps }
  };
}
