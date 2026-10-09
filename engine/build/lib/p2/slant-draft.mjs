// node: L1.E04
// input: { folderContents: string[], location: string, name?: string }

export function run(input) {
  const trace = { node: 'L1.E04', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { folderContents, location, name = 'Project' } = input;

  if (!Array.isArray(folderContents)) {
    trace.steps.push('validate_input: folderContents must be array');
    return { ok: false, error: 'folderContents must be an array' };
  }

  if (typeof location !== 'string' || location === '') {
    trace.steps.push('validate_input: location missing or empty');
    return { ok: false, error: 'Missing location' };
  }

  if (typeof name !== 'string') {
    trace.steps.push('validate_input: name must be string or omitted');
    return { ok: false, error: 'name must be a string' };
  }

  trace.steps.push(`draft_slant: analyzing ${folderContents.length} items in "${location}"`);

  // note: agent drafts 5 takeaways from folder analysis
  // note: takeaways should reflect project identity and direction

  // Analyze content patterns
  const hasTests = folderContents.some(f => f.includes('test') || f.includes('spec'));
  const hasConfig = folderContents.some(f => f.includes('.json') || f.includes('.yaml') || f.includes('.config'));
  const hasDocs = folderContents.some(f => f.includes('.md') || f.includes('doc'));
  const hasSource = folderContents.some(f => f.includes('.js') || f.includes('.ts') || f.includes('.py') || f.includes('src'));
  const isMono = folderContents.some(f => f.includes('package') || f.includes('pnpm') || f.includes('workspace'));

  trace.steps.push('draft_slant: analyzing project characteristics');

  // Draft 5 takeaways (exactly 5 per acceptance item 1)
  const takeaways = [
    `${hasTests ? 'Well-tested' : 'Test-focused'} codebase at ${location}`,
    `${hasConfig ? 'Configuration-driven' : 'Runtime-configured'} setup with clear defaults`,
    `${hasDocs ? 'Documentation-first' : 'Self-documenting'} approach to clarity`,
    `${isMono ? 'Monorepo workspace' : 'Single-package'} structure for organization`,
    `${hasSource ? 'Source-included' : 'Build-artifact'} distribution model`
  ];

  trace.steps.push(`draft_slant: ${takeaways.length} takeaways drafted`);

  // Draft 'what this is' statement (single sentence, clarity and concision)
  const whatThisIs = `${name} is a ${hasSource && hasTests ? 'thoroughly-tested' : 'focused'} project that ${
    hasConfig ? 'uses configuration' : 'embraces convention'
  } for its operational model.`;

  // Draft outcome wanted
  const outcomeWanted = `Enable clear project setup and maintenance through organized structure and documented best practices.`;

  trace.steps.push('draft_slant: "what this is" and outcome drafted');

  return {
    ok: true,
    draft: {
      name,
      location,
      takeaways,
      whatThisIs,
      outcomeWanted
    },
    takeawayCount: takeaways.length,
    requiresHumanReview: true,
    instructions: 'Agent has drafted the slant. Please review the takeaways, "what this is" statement, and outcome wanted. Edit as needed and confirm to proceed.',
    trace
  };
}
