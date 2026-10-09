// node: L4.E08
// input: {humanWords: string, issueLink: string, vaultPath: string}

export function run(input) {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Input must be an object with humanWords, issueLink, vaultPath fields' };
  }

  const { humanWords, issueLink, vaultPath } = input;

  // type check
  if (typeof humanWords !== 'string' || typeof issueLink !== 'string' || typeof vaultPath !== 'string') {
    return { ok: false, error: 'humanWords, issueLink, and vaultPath must be strings' };
  }

  if (humanWords === '' || issueLink === '' || vaultPath === '') {
    return { ok: false, error: 'humanWords, issueLink, and vaultPath must not be empty' };
  }

  // acceptance 1: blockquote format for human words
  const blockquote = `> ${humanWords.split('\n').join('\n> ')}`;

  // acceptance 2: fenced block protects special characters
  const fencedBlock = `\`\`\`\n${humanWords}\n\`\`\``;

  // acceptance 2 & 3: GitHub issue link and vault path as source reference
  const sourceReference = `**Source:** [${issueLink}](${issueLink}) | Vault: \`${vaultPath}\``;

  const entry = `${blockquote}\n\n${fencedBlock}\n\n${sourceReference}`;

  return {
    ok: true,
    entry,
    blockquote,
    fencedBlock,
    sourceReference,
    trace: {
      node: 'L4.E08',
      steps: [
        'formatted human words in blockquote',
        'preserved exact text in fenced code block',
        'appended GitHub issue link and vault path as source reference'
      ]
    }
  };
}
