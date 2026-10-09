// node: L1.E01
// input: { hasExistingClaudemd: boolean, nodeDir: string, dexContent: string, existingClaudemdContent?: string }

export function run(input) {
  const trace = { node: 'L1.E01', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { hasExistingClaudemd, nodeDir, dexContent, existingClaudemdContent } = input;

  // Validate required fields
  if (typeof hasExistingClaudemd !== 'boolean') {
    trace.steps.push('validate_input: hasExistingClaudemd missing or not boolean');
    return { ok: false, error: 'hasExistingClaudemd must be a boolean' };
  }

  if (typeof nodeDir !== 'string' || nodeDir === '') {
    trace.steps.push('validate_input: nodeDir missing or empty');
    return { ok: false, error: 'Missing nodeDir' };
  }

  if (typeof dexContent !== 'string' || dexContent === '') {
    trace.steps.push('validate_input: dexContent missing or empty');
    return { ok: false, error: 'Missing dexContent' };
  }

  trace.steps.push(`plan_merge: hasExistingClaudemd=${hasExistingClaudemd}`);

  if (hasExistingClaudemd) {
    // Plan for existing CLAUDE.md
    if (typeof existingClaudemdContent !== 'string') {
      trace.steps.push('validate_input: existingClaudemdContent required when hasExistingClaudemd is true');
      return { ok: false, error: 'existingClaudemdContent required when CLAUDE.md exists' };
    }

    trace.steps.push('plan_merge: planning dex block insertion into existing CLAUDE.md');

    // note: dex block marked with special markers for identification and later removal if needed
    const dexBlockStart = '<!-- dex-start: do not edit this block -->';
    const dexBlockEnd = '<!-- dex-end -->';
    const markedDexBlock = `${dexBlockStart}\n${dexContent}\n${dexBlockEnd}`;

    // note: compute diff by showing before/after of where dex block will be inserted
    const proposedContent = `${existingClaudemdContent}\n\n${markedDexBlock}`;

    const diff = {
      before: existingClaudemdContent,
      after: proposedContent,
      summary: 'Add dex-managed block at end of file'
    };

    trace.steps.push('plan_merge: dex block ready for insertion (requires user yes)');

    return {
      ok: true,
      action: 'update-existing',
      targetPath: `${nodeDir}/CLAUDE.md`,
      markedDexBlock,
      diff,
      requiresUserApproval: true,
      description: 'A marked dex block will be inserted into your existing CLAUDE.md. User text outside the block remains unchanged.',
      trace
    };
  } else {
    // Plan for new CLAUDE.md
    trace.steps.push('plan_merge: planning new CLAUDE.md from dex content');

    // note: when no CLAUDE.md exists, place the full dex content as the new file
    const newContent = dexContent;

    trace.steps.push('plan_merge: new CLAUDE.md ready (requires user yes)');

    return {
      ok: true,
      action: 'create-new',
      targetPath: `${nodeDir}/CLAUDE.md`,
      newContent,
      requiresUserApproval: true,
      description: 'A new CLAUDE.md will be created with dex-managed content.',
      trace
    };
  }
}
