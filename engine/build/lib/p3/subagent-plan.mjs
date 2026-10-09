// node: L2.E02
// input: { pattern: 's10-adversarial-review' | 'custom-pattern' }

const READ_ONLY_TOOLS = [
  'Read',
  'Grep',
  'Glob',
  'WebFetch',
  'WebSearch'
];

const DISABLED_TOOLS = [
  'Edit',
  'Write',
  'Bash',
  'PowerShell',
  'Agent',
  'Artifact',
  'ArtifactComments',
  'ArtifactData',
  'NotebookEdit'
];

export function run(input) {
  const steps = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Input must be an object' };
  }

  if (typeof input.pattern !== 'string') {
    return { ok: false, error: 'Input.pattern must be a string' };
  }

  steps.push(`Planning subagent for pattern: ${input.pattern}`);

  if (input.pattern !== 's10-adversarial-review') {
    return { ok: false, error: 'Pattern must be s10-adversarial-review (other patterns not yet supported)' };
  }

  steps.push('Using S10 adversarial-review pattern');

  // Generate subagent configuration
  const config = {
    model: 'claude-opus',
    background: false,
    tools: READ_ONLY_TOOLS,
    disabledTools: DISABLED_TOOLS,
    instructions: 'Read-only code review focused on correctness and logic errors'
  };

  steps.push('Config generated with read-only tools only');
  steps.push('background: false for inline findings');
  steps.push(`Disabled tools: ${DISABLED_TOOLS.join(', ')}`);

  const filePath = '.claude/agents/dex-reviewer.md';

  const frontmatter = `---
model: ${config.model}
background: ${config.background}
tools:
  - Read
  - Grep
disabledTools:
${DISABLED_TOOLS.map(t => `  - ${t}`).join('\n')}
---`;

  const body = `# Dex Code Reviewer

Read-only adversarial review agent following S10 best-practices pattern.

## Role
Perform adversarial code review focusing on:
- Correctness bugs
- Logic errors
- Type mismatches
- Missing error handling

## Tools Available
- Read: For reading source files
- Grep: For searching code patterns

## Tools Disabled
All write-capable tools are disabled to enforce read-only mode:
${DISABLED_TOOLS.map(t => `- ${t}`).join('\n')}

## Guidelines
- Never modify files or create new files
- Focus on finding actual bugs and logic errors
- Report findings with specific file locations and line numbers
- Provide actionable recommendations
`;

  const content = frontmatter + '\n\n' + body;

  return {
    ok: true,
    file: filePath,
    config,
    content,
    readOnlyTools: READ_ONLY_TOOLS,
    disabledTools: DISABLED_TOOLS,
    backgroundMode: false,
    trace: {
      node: 'L2.E02',
      steps
    }
  };
}
