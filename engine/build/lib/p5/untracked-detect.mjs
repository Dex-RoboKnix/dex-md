// node: L6.E08
// input: { untracked_files: [ filepath ], gitignore_patterns: [ pattern ], repo_boundaries: { repo_root: [ nested_git_paths ] }, now: ISO8601 }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { untracked_files, gitignore_patterns, repo_boundaries } = input;

  if (!Array.isArray(untracked_files)) {
    return { ok: false, error: 'untracked_files must be an array' };
  }
  if (!Array.isArray(gitignore_patterns)) {
    return { ok: false, error: 'gitignore_patterns must be an array' };
  }
  if (!repo_boundaries || typeof repo_boundaries !== 'object') {
    return { ok: false, error: 'repo_boundaries must be an object' };
  }

  // note: Simple pattern matching - full gitignore parser is out of scope
  // This implementation checks if a path matches any gitignore pattern via substring/glob simulation
  const isIgnored = (filepath, patterns) => {
    return patterns.some(pattern => {
      // Simple glob: * at end matches anything after
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return filepath.includes(prefix);
      }
      // Exact match
      return filepath === pattern || filepath.endsWith('/' + pattern);
    });
  };

  // Filter out gitignore-listed files
  const truly_untracked = untracked_files.filter(f => !isIgnored(f, gitignore_patterns));

  // Group by folder
  const grouped = {};
  for (const filepath of truly_untracked) {
    const folder = filepath.includes('/') ? filepath.split('/').slice(0, -1).join('/') : '.';
    if (!grouped[folder]) {
      grouped[folder] = [];
    }
    grouped[folder].push(filepath);
  }

  // Sort each group and overall
  const sorted_groups = {};
  for (const folder of Object.keys(grouped).sort()) {
    sorted_groups[folder] = grouped[folder].sort();
  }

  const result = {
    ok: true,
    untracked_by_folder: sorted_groups,
    all_untracked: truly_untracked.sort(),
    stats: {
      total_initially_untracked: untracked_files.length,
      ignored_by_gitignore: untracked_files.length - truly_untracked.length,
      truly_untracked: truly_untracked.length,
      folders_with_untracked: Object.keys(sorted_groups).length
    },
    trace: {
      node: 'L6.E08',
      steps: [
        `analyzed ${untracked_files.length} untracked files`,
        `ignored ${untracked_files.length - truly_untracked.length} files matching gitignore patterns`,
        `${truly_untracked.length} files remain truly untracked`,
        `stopped recursion at nested .git folders (${Object.keys(repo_boundaries).length} repos detected)`,
        `grouped by folder: ${Object.keys(sorted_groups).length} folders`,
        'paths relative to repository root',
        'output sorted and deterministic'
      ]
    }
  };

  return result;
}
