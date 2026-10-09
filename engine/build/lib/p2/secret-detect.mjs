// node: L3.E05
// input: { files: string[] }

export function run(input) {
  const trace = { node: 'L3.E05', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object' || !Array.isArray(input.files)) {
    return { ok: false, error: 'Missing or invalid input: provide files array' };
  }

  const { files } = input;

  trace.steps.push(`detect_secrets: scanning ${files.length} files`);

  // Secret patterns to detect
  const patterns = [
    { regex: /^\.env$/, name: '.env' },
    { regex: /\.key$/, name: '*.key' },
    { regex: /\.pem$/, name: '*.pem' },
    { regex: /^id_rsa$/, name: 'id_rsa' },
    { regex: /^credentials\./, name: 'credentials.*' },
    { regex: /^secrets\./, name: 'secrets.*' }
  ];

  trace.steps.push(`detect_secrets: checking against ${patterns.length} gitignore-class patterns`);

  const detectedSecrets = [];

  for (const file of files) {
    for (const { regex, name } of patterns) {
      if (regex.test(file)) {
        detectedSecrets.push({
          file,
          pattern: name,
          status: 'list-only',
          contentHidden: true
        });
        trace.steps.push(`detect_secrets: found ${file} (matches ${name})`);
        break; // Don't match same file twice
      }
    }
  }

  trace.steps.push(`detect_secrets: detected ${detectedSecrets.length} secret files`);

  return {
    ok: true,
    secrets: detectedSecrets,
    secretPatterns: patterns.map(p => p.name),
    count: detectedSecrets.length,
    trace
  };
}
