// node: L5.E04
// input: { claudemdLines: number, dexSections?: Array<{layer: string, content: string}> }

export function run(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid input' };
  }

  const { claudemdLines = 0, dexSections = [] } = input;

  if (typeof claudemdLines !== 'number' || claudemdLines < 0) {
    return { ok: false, error: 'claudemdLines must be non-negative number' };
  }

  if (!Array.isArray(dexSections)) {
    return { ok: false, error: 'dexSections must be array' };
  }

  // Check if splitting is needed (>200 lines)
  const needsSplit = claudemdLines > 200;

  if (!needsSplit) {
    return {
      ok: true,
      needsSplit: false,
      reason: `CLAUDE.md is ${claudemdLines} lines; no split needed`,
      trace: {
        node: 'L5.E04',
        steps: [{ type: 'check-size', lines: claudemdLines, exceeds: false }]
      }
    };
  }

  // Propose split
  const proposedFiles = [];
  const steps = [
    { type: 'check-size', lines: claudemdLines, exceeds: true }
  ];

  for (const section of dexSections) {
    const { layer, content } = section;

    if (!layer || typeof layer !== 'string') {
      return { ok: false, error: 'dex section missing layer' };
    }

    if (!content || typeof content !== 'string') {
      return { ok: false, error: 'dex section missing content' };
    }

    proposedFiles.push({
      path: `.claude/rules/dex-${layer.toLowerCase()}.md`,
      frontmatter: {
        paths: `dex-${layer}/**`,
        scoped: true,
        layer
      },
      content,
      size: content.length
    });

    steps.push({ type: 'section-split', layer, size: content.length });
  }

  const diff = {
    before: `CLAUDE.md (${claudemdLines} lines)`,
    after: proposedFiles.map(f => f.path).join(', '),
    requiresApproval: true
  };

  const effects = proposedFiles.map(f => ({
    kind: 'write-file',
    path: f.path,
    content: `---\npaths: "${f.frontmatter.paths}"\nlayer: ${f.frontmatter.layer}\n---\n\n${f.content}`
  }));

  return {
    ok: true,
    needsSplit: true,
    proposedFiles,
    diff,
    requiresApproval: true,
    effects,
    trace: {
      node: 'L5.E04',
      steps
    }
  };
}
