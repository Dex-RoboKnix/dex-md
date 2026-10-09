// node: L5.E05
// input: { content: string, expectedName: string }

export function run(input) {
  const trace = { node: 'L5.E05', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { content, expectedName } = input;

  if (typeof content !== 'string' || content === '') {
    trace.steps.push('validate_input: content missing or empty');
    return { ok: false, error: 'Missing content' };
  }

  if (typeof expectedName !== 'string' || expectedName === '') {
    trace.steps.push('validate_input: expectedName missing or empty');
    return { ok: false, error: 'Missing expectedName' };
  }

  trace.steps.push('parse_frontmatter: extracting YAML frontmatter');

  // Extract YAML frontmatter (between --- markers)
  const frontmatterPattern = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterPattern);

  if (!match) {
    trace.steps.push('parse_frontmatter: no YAML frontmatter found');
    return { ok: false, error: 'Malformed YAML frontmatter: expected --- delimiters' };
  }

  const frontmatterText = match[1];
  trace.steps.push('parse_frontmatter: frontmatter extracted');

  // Parse YAML-like key: value pairs
  // note: simplified YAML parser for name, description, version, author fields
  const requiredFields = ['name', 'description', 'version', 'author'];
  const frontmatter = {};
  const missingFields = [];

  for (const line of frontmatterText.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // note: remove quotes if present
      const cleanValue = value.replace(/^['"]|['"]$/g, '');
      frontmatter[key] = cleanValue;
    }
  }

  trace.steps.push(`parse_frontmatter: parsed ${Object.keys(frontmatter).length} fields`);

  // Check required fields
  for (const field of requiredFields) {
    if (!frontmatter[field] || frontmatter[field] === '') {
      trace.steps.push(`validate_field: ${field} missing or empty`);
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    trace.steps.push(`validate_frontmatter: missing fields: ${missingFields.join(', ')}`);
    return {
      ok: false,
      error: `SKILL.md frontmatter missing required fields: ${missingFields.join(', ')}`,
      missingFields
    };
  }

  // Check if name matches expectedName (case-sensitive)
  if (frontmatter.name !== expectedName) {
    trace.steps.push(`validate_frontmatter: name mismatch (frontmatter="${frontmatter.name}", expected="${expectedName}")`);
    return {
      ok: false,
      error: `Skill name mismatch: frontmatter has "${frontmatter.name}" but folder is "${expectedName}" (case-sensitive)`
    };
  }

  trace.steps.push('validate_frontmatter: all checks passed');

  return {
    ok: true,
    name: frontmatter.name,
    description: frontmatter.description,
    version: frontmatter.version,
    author: frontmatter.author,
    frontmatter,
    allFieldsValid: true,
    trace
  };
}
