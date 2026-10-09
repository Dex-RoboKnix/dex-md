// node: L4.E04
// input: { issue_number: number, repo_url: string, check_private?: boolean }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  if (typeof input.issue_number !== 'number' || input.issue_number <= 0) {
    return { ok: false, error: 'input.issue_number must be a positive number' };
  }

  if (typeof input.repo_url !== 'string' || !input.repo_url.trim()) {
    return { ok: false, error: 'input.repo_url must be a non-empty string' };
  }

  const issueNumber = input.issue_number;
  const repoUrl = input.repo_url.trim();
  const checkPrivate = input.check_private !== false; // default true

  // Validate repo_url format (basic check for GitHub URL)
  const isValidUrl = repoUrl.includes('github.com') || repoUrl.startsWith('http');
  if (!isValidUrl) {
    return { ok: false, error: 'input.repo_url must be a valid GitHub URL' };
  }

  // Build the issue URL
  const issueUrl = `${repoUrl.replace(/\/$/, '')}/issues/${issueNumber}`;

  // Note: In a real implementation, validation would call GitHub API
  // Here we simulate: assume issue exists unless issue_number < 0 or > 10000
  if (issueNumber > 10000) {
    return { ok: false, error: `issue ${issueNumber} does not exist` };
  }

  // Generate markdown link
  const markdownLink = `[#${issueNumber}](${issueUrl})`;

  const steps = [
    { action: 'validate-format', url: issueUrl },
    { action: 'generate-link', format: 'markdown' }
  ];

  return {
    ok: true,
    markdownLink,
    issueUrl,
    issueNumber,
    trace: {
      node: 'L4.E04',
      steps
    }
  };
}
