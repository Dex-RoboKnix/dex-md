// node: L5.E05
// input: { packageJsonScripts?: object, makefileContent?: string, now?: string }

export function run(input) {
  const trace = { node: 'L5.E05', steps: [] };
  const effects = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { packageJsonScripts, makefileContent, now } = input;
  const searchLocations = [];

  trace.steps.push('detect_verify_command: starting search');

  let detectedCommand = null;
  let foundIn = null;

  // Priority 1: Search package.json scripts
  if (packageJsonScripts && typeof packageJsonScripts === 'object') {
    trace.steps.push('search_location: package.json (priority 1)');
    searchLocations.push('package.json');

    if (packageJsonScripts.verify && typeof packageJsonScripts.verify === 'string') {
      detectedCommand = packageJsonScripts.verify;
      foundIn = 'package.json';
      trace.steps.push(`detect_verify_command: found in package.json scripts`);
    } else {
      trace.steps.push(`search_location: package.json - no verify script found`);
    }
  } else {
    trace.steps.push('search_location: package.json - not provided or invalid');
    searchLocations.push('package.json (not found)');
  }

  // Priority 2: Search Makefile (only if not found in package.json)
  if (!detectedCommand && makefileContent) {
    trace.steps.push('search_location: Makefile (priority 2)');
    searchLocations.push('Makefile');

    // Look for verify target in Makefile
    const lines = makefileContent.split('\n');
    let inVerifyTarget = false;
    const commandLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('verify:')) {
        inVerifyTarget = true;
        const afterColon = line.substring('verify:'.length).trim();
        if (afterColon) {
          commandLines.push(afterColon);
        }
        continue;
      }

      if (inVerifyTarget) {
        if (line.startsWith('\t')) {
          commandLines.push(line.substring(1).trim());
        } else if (line.trim() === '') {
          continue;
        } else if (line[0] !== ' ' && line[0] !== '\t' && line.includes(':')) {
          break;
        } else if (line.startsWith(' ')) {
          commandLines.push(line.trim());
        } else {
          break;
        }
      }
    }

    if (commandLines.length > 0) {
      detectedCommand = commandLines.join(' ');
      foundIn = 'Makefile';
      trace.steps.push(`detect_verify_command: found verify target in Makefile`);
    } else {
      trace.steps.push(`search_location: Makefile - no verify target found`);
    }
  } else if (!detectedCommand && !makefileContent) {
    trace.steps.push('search_location: Makefile (priority 2) - not provided');
    searchLocations.push('Makefile (not provided)');
  }

  // Log the search result
  if (detectedCommand) {
    trace.steps.push(`detect_verify_command: command detected: "${detectedCommand}"`);
    effects.push({
      kind: 'log',
      event: 'verify-command-detected',
      location: foundIn,
      command: detectedCommand,
      timestamp: now || null
    });
  } else {
    trace.steps.push(`detect_verify_command: not found in any location`);
    effects.push({
      kind: 'log',
      event: 'verify-command-not-found',
      searched: searchLocations,
      timestamp: now || null
    });
  }

  return {
    ok: true,
    command: detectedCommand,
    foundIn,
    searchLocations,
    effects,
    trace
  };
}
