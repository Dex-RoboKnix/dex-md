// node: L3.E05
// input: { gitignoreContent?: string, isTracked?: { claudeLocal?: boolean, settingsLocal?: boolean }, now?: string }

export function run(input) {
  const trace = { node: 'L3.E05', steps: [] };
  const effects = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { gitignoreContent, isTracked = {}, now } = input;

  trace.steps.push('propose_gitignore_lines: starting');

  // Files to propose for .gitignore
  const proposedLines = [
    'CLAUDE.local.md',
    '.claude/settings.local.json'
  ];

  trace.steps.push(`propose_gitignore_lines: proposing ${proposedLines.length} lines`);

  // Check if files are already tracked in git history
  const trackedFiles = [];
  if (isTracked.claudeLocal) {
    trackedFiles.push('CLAUDE.local.md');
    trace.steps.push('check_tracked: CLAUDE.local.md is tracked in git history');
  }

  if (isTracked.settingsLocal) {
    trackedFiles.push('.claude/settings.local.json');
    trace.steps.push('check_tracked: .claude/settings.local.json is tracked in git history');
  }

  // If any files are tracked, log warning with git rm --cached command
  if (trackedFiles.length > 0) {
    const gitRmCommands = trackedFiles.map(file => `git rm --cached "${file}"`).join('\n');
    effects.push({
      kind: 'log',
      event: 'gitignore-files-already-tracked',
      files: trackedFiles,
      gitRmCommand: gitRmCommands,
      message: `Files are already tracked in git history. To remove them from version control (but keep local copies), run:\n${gitRmCommands}`,
      at: now || null
    });
    trace.steps.push('warn_tracked_files: logged git rm commands');
  }

  // Check if .gitignore exists
  const gitignoreExists = !!gitignoreContent;
  trace.steps.push(`check_gitignore: exists=${gitignoreExists}`);

  let gitignorePlan;
  if (!gitignoreExists) {
    gitignorePlan = {
      action: 'create',
      content: proposedLines.join('\n'),
      reason: '.gitignore does not exist; will be created with dex-proposed lines'
    };
    trace.steps.push('gitignore_plan: will create new .gitignore');
  } else {
    // Check if lines already in .gitignore
    const missingLines = proposedLines.filter(line =>
      !gitignoreContent.includes(line)
    );

    if (missingLines.length === 0) {
      gitignorePlan = {
        action: 'skip',
        reason: 'All proposed lines already in .gitignore'
      };
      trace.steps.push('gitignore_plan: all lines already present, skipping');
    } else {
      gitignorePlan = {
        action: 'append',
        content: missingLines.join('\n'),
        reason: `${missingLines.length} lines missing from .gitignore`
      };
      trace.steps.push(`gitignore_plan: will append ${missingLines.length} missing lines`);
    }
  }

  // Log the plan
  effects.push({
    kind: 'log',
    event: 'gitignore-proposal',
    proposedLines,
    gitignorePlan,
    at: now || null
  });

  return {
    ok: true,
    proposedLines,
    trackedFiles,
    gitignorePlan,
    effects,
    trace
  };
}
