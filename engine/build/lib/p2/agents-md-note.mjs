// node: L1.E02
// input: { hasClaudeMd: boolean, hasClaudeLocalMd?: boolean, phase: string }

export function run(input) {
  const trace = { node: 'L1.E02', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { hasClaudeMd, hasClaudeLocalMd = false, phase } = input;

  if (typeof hasClaudeMd !== 'boolean') {
    trace.steps.push('validate_input: hasClaudeMd must be boolean');
    return { ok: false, error: 'hasClaudeMd must be a boolean' };
  }

  if (typeof hasClaudeLocalMd !== 'boolean') {
    trace.steps.push('validate_input: hasClaudeLocalMd must be boolean');
    return { ok: false, error: 'hasClaudeLocalMd must be a boolean' };
  }

  if (typeof phase !== 'string' || !['plan', 'complete'].includes(phase)) {
    trace.steps.push('validate_input: phase must be "plan" or "complete"');
    return { ok: false, error: 'phase must be "plan" or "complete"' };
  }

  trace.steps.push(`determine_note: hasClaudeMd=${hasClaudeMd}, hasClaudeLocalMd=${hasClaudeLocalMd}, phase=${phase}`);

  // Decision logic:
  // - Show note only if neither CLAUDE.md nor CLAUDE.local.md exists
  // - Show during both plan and complete phases
  const shouldShowNote = !hasClaudeMd && !hasClaudeLocalMd;

  trace.steps.push(`determine_note: shouldShowNote=${shouldShowNote}`);

  if (!shouldShowNote) {
    trace.steps.push('determine_note: CLAUDE.md or CLAUDE.local.md found, note suppressed');
    return {
      ok: true,
      shouldShowNote: false,
      noteText: null,
      phase,
      trace
    };
  }

  // note: CLAUDE.md and AGENTS.md are distinct; CLAUDE.md is newer standard per decisions (Q2)
  const noteText = `📖 This project has an AGENTS.md file. Please read it for project-specific guidelines on how agents should work with this codebase.`;

  trace.steps.push(`determine_note: note prepared for ${phase} phase`);

  return {
    ok: true,
    shouldShowNote: true,
    noteText,
    phase,
    showDuringPlan: true,
    showAfterComplete: true,
    trace
  };
}
