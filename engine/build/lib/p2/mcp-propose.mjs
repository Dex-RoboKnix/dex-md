// node: L3.E02
// input: { serverName: string, token: string, existingConfig?: object }

export function run(input) {
  const trace = { node: 'L3.E02', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { serverName, token, existingConfig = {} } = input;

  if (typeof serverName !== 'string' || serverName === '') {
    trace.steps.push('validate_input: serverName missing or empty');
    return { ok: false, error: 'Missing serverName' };
  }

  if (typeof token !== 'string' || token === '') {
    trace.steps.push('validate_input: token missing or empty');
    return { ok: false, error: 'Missing token' };
  }

  if (typeof existingConfig !== 'object' || existingConfig === null) {
    trace.steps.push('validate_input: existingConfig must be object or omitted');
    return { ok: false, error: 'existingConfig must be an object' };
  }

  trace.steps.push(`propose_entry: serverName="${serverName}"`);

  // Check for literal secrets in token
  // note: tokens should use ${VAR} placeholders per decisions (Q1)
  const hasLiteralSecret = !token.startsWith('${') && !token.endsWith('}');

  if (hasLiteralSecret) {
    trace.steps.push('security_check: literal token detected, flagging as insecure');
  } else {
    trace.steps.push('security_check: token uses ${VAR} placeholder format');
  }

  // Check for literal secrets in existing config
  const existingSecrets = [];
  for (const [key, value] of Object.entries(existingConfig)) {
    // Check nested token fields too
    if (typeof value === 'object' && value !== null) {
      for (const [subkey, subvalue] of Object.entries(value)) {
        if (typeof subvalue === 'string' && subvalue.length > 0 &&
            !subvalue.startsWith('${') && !subvalue.endsWith('}') &&
            (subvalue.includes('sk-') || subvalue.includes('key') || subvalue.includes('secret') || subvalue.length > 30)) {
          existingSecrets.push(`${key}.${subkey}`);
        }
      }
    } else if (typeof value === 'string' && value.length > 0 &&
        !value.startsWith('${') && !value.endsWith('}') &&
        (value.includes('sk-') || value.includes('key') || value.includes('secret') || value.length > 30)) {
      existingSecrets.push(key);
    }
  }

  if (existingSecrets.length > 0) {
    trace.steps.push(`security_check: found ${existingSecrets.length} literal secrets in existing config`);
  }

  // Build proposed entry
  const proposedEntry = {
    [serverName]: {
      token: token,
      required: true
    }
  };

  trace.steps.push('propose_entry: entry structure built');

  // Check if entry already exists
  const entryExists = serverName in existingConfig;
  let diff = null;

  if (entryExists) {
    trace.steps.push(`propose_entry: existing entry found for "${serverName}", computing diff`);

    diff = {
      before: existingConfig[serverName],
      after: proposedEntry[serverName],
      summary: `Update MCP server entry for ${serverName}`
    };
  }

  // note: decisions (Q2) require user approval and diff display
  // note: decisions (Q3) warn about non-interactive runs per S6

  return {
    ok: true,
    serverName,
    proposedEntry,
    diff,
    entryExists,
    requiresUserApproval: true,
    securityWarnings: {
      literalTokenInProposal: hasLiteralSecret,
      literalSecretsInExisting: existingSecrets,
      message: hasLiteralSecret ? 'WARNING: Token contains literal value. Use ${VAR} environment variable placeholder instead.' : null
    },
    nonInteractiveWarning: 'Non-interactive runs (SDK, cloud agents) will skip approval dialogs. Ensure tokens use ${VAR} placeholders.',
    recommendation: 'Only commit to version control after token security is verified (use ${VAR} placeholders).',
    effects: [],  // note: no actual write happens; caller handles based on user approval
    trace
  };
}
