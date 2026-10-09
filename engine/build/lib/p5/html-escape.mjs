// node: L5.E05
// input: { text: string }

const htmlEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&apos;',
  '"': '&quot;'
};

export function run(input) {
  if (!input || typeof input !== 'object' || typeof input.text !== 'string') {
    return { ok: false, error: 'input.text must be a string' };
  }

  const text = input.text;
  const steps = [];

  // Escape characters in order: & first to avoid double-escaping
  let escaped = text;
  let escapeCount = 0;

  for (const [char, entity] of Object.entries(htmlEntities)) {
    const regex = new RegExp(char.replace(/[&<>"']/g, '\\$&'), 'g');
    const count = (escaped.match(regex) || []).length;
    escaped = escaped.replace(regex, entity);
    if (count > 0) {
      steps.push({ character: char, entity, count });
      escapeCount += count;
    }
  }

  return {
    ok: true,
    escaped,
    escapeCount,
    trace: {
      node: 'L5.E05',
      steps
    }
  };
}
