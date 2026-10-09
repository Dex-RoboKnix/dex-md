// node: L1.E01
// input: { files: string[] }

export function run(input) {
  const trace = { node: 'L1.E01', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object' || !Array.isArray(input.files)) {
    return { ok: false, error: 'Missing or invalid input: provide files array' };
  }

  const { files } = input;

  if (!Array.isArray(files)) {
    return { ok: false, error: 'files must be an array of strings' };
  }

  trace.steps.push(`classify_folder: examining ${files.length} items`);

  // Check for in-flight markers first (they override everything)
  const hasGitFolder = files.some(f => f === '.git' || f.startsWith('.git/'));
  const hasScratchFolder = files.some(f => f === '.scratch' || f.startsWith('.scratch/'));

  if (hasGitFolder) {
    trace.steps.push('classify_folder: found .git folder → in-flight');
    return {
      ok: true,
      classification: 'in-flight',
      reason: '.git folder present',
      trace
    };
  }

  if (hasScratchFolder) {
    trace.steps.push('classify_folder: found .scratch folder → in-flight');
    return {
      ok: true,
      classification: 'in-flight',
      reason: '.scratch folder present',
      trace
    };
  }

  // No in-flight markers. Check for content.
  // Dex content is: dex.md, dex-vault folder, lib/, test/, etc.
  const dexPatterns = ['dex.md', 'dex-vault', 'lib/', 'test/', 'RUNLOG'];
  const hasDexContent = files.some(f =>
    f === 'dex.md' ||
    f.startsWith('dex-vault') ||
    f.startsWith('lib/') ||
    f.startsWith('test/') ||
    f === 'RUNLOG'
  );

  // Non-dex files: anything not .git, .scratch, dex.md, or dex-vault
  const nonDexContent = files.filter(f =>
    !f.startsWith('.git') &&
    !f.startsWith('.scratch') &&
    f !== 'dex.md' &&
    !f.startsWith('dex-vault') &&
    !f.startsWith('lib/') &&
    !f.startsWith('test/') &&
    f !== 'RUNLOG' &&
    !f.startsWith('.claude/') &&
    f !== '.gitignore' &&
    f !== '.gitattributes'
  );

  trace.steps.push(`classify_folder: dexContent=${hasDexContent}, nonDexContent=${nonDexContent.length > 0}`);

  // Priority: if ANY non-dex content exists, it's blank-with-context
  if (nonDexContent.length > 0) {
    trace.steps.push('classify_folder: has non-dex files → blank-with-context');
    return {
      ok: true,
      classification: 'blank-with-context',
      reason: 'contains non-dex files (documents, exports, notes)',
      trace
    };
  }

  // Only dex content or empty → blank
  trace.steps.push('classify_folder: only dex content or empty → blank');
  return {
    ok: true,
    classification: 'blank',
    reason: 'only dex content or nothing else',
    trace
  };
}
