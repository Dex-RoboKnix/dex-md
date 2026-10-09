// node: L1.E06
// input: { originalPath: string, nodeDir: string, existingFiles?: string[] }

export function run(input) {
  const trace = { node: 'L1.E06', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { originalPath, nodeDir, existingFiles = [] } = input;

  // Validate required fields
  if (typeof originalPath !== 'string' || originalPath === '') {
    trace.steps.push('validate_input: originalPath missing or empty');
    return { ok: false, error: 'Missing originalPath' };
  }

  if (typeof nodeDir !== 'string' || nodeDir === '') {
    trace.steps.push('validate_input: nodeDir missing or empty');
    return { ok: false, error: 'Missing nodeDir' };
  }

  if (!Array.isArray(existingFiles)) {
    trace.steps.push('validate_input: existingFiles must be array or omitted');
    return { ok: false, error: 'existingFiles must be an array' };
  }

  trace.steps.push(`compute_path: processing "${originalPath}"`);

  // Extract filename from originalPath
  const fileName = originalPath.split('/').pop() || originalPath.split('\\').pop();
  if (!fileName || fileName === '') {
    trace.steps.push('compute_path: cannot extract filename');
    return { ok: false, error: 'Invalid originalPath: cannot extract filename' };
  }

  // note: path separators normalized to forward slash for consistency
  const basePath = `${nodeDir}/original/${fileName}`;
  trace.steps.push(`compute_path: base path computed as "${basePath}"`);

  // Check for conflicts with existing files
  let targetPath = basePath;
  let suffix = 0;

  // note: when originalPath has extension like file.md, suffix inserts before extension
  const lastDotIndex = fileName.lastIndexOf('.');
  let nameWithoutExt = fileName;
  let ext = '';

  if (lastDotIndex > 0) {
    nameWithoutExt = fileName.substring(0, lastDotIndex);
    ext = fileName.substring(lastDotIndex);
  }

  while (existingFiles.includes(targetPath)) {
    suffix++;
    targetPath = `${nodeDir}/original/${nameWithoutExt}.orig.${suffix}${ext}`;
    trace.steps.push(`conflict_resolved: numbered suffix ${suffix} applied`);
  }

  if (suffix > 0) {
    trace.steps.push(`compute_path: conflict detected, using "${targetPath}"`);
  }

  // Generate frontmatter field and markdown link
  const frontmatterField = targetPath;
  const markdownLink = `[original](${targetPath})`;

  return {
    ok: true,
    targetPath,
    originalFilePath: originalPath,
    frontmatterField,
    markdownLink,
    hasConflict: suffix > 0,
    trace
  };
}
