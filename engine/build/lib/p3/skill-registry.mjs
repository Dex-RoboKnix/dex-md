// node: L5.E02
// input: { registered: [name, ...], installed: [{name, version, status}] }

export function run(input) {
  const steps = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Input must be an object' };
  }

  if (!Array.isArray(input.registered)) {
    return { ok: false, error: 'Input.registered must be an array' };
  }

  if (!Array.isArray(input.installed)) {
    return { ok: false, error: 'Input.installed must be an array' };
  }

  steps.push(`Registry has ${input.registered.length} registered skills`);
  steps.push(`${input.installed.length} skills installed`);

  // Validate exactly 5 registered skills
  if (input.registered.length !== 5) {
    return { ok: false, error: `Registry must have exactly 5 skills, found ${input.registered.length}` };
  }

  steps.push('Registered skill count validated: 5 skills');

  // Check installed against registered
  const installedNames = new Set(input.installed.map(s => s.name));
  const registeredSet = new Set(input.registered);

  const missing = [];
  const found = [];

  for (const registered of input.registered) {
    if (installedNames.has(registered)) {
      found.push(registered);
      steps.push(`Found: ${registered}`);
    } else {
      missing.push(registered);
      steps.push(`Missing: ${registered}`);
    }
  }

  const coverage = Math.round((found.length / input.registered.length) * 100);
  steps.push(`Coverage: ${coverage}%`);

  // Build registry with details
  const registry = input.registered.map(name => {
    const installed = input.installed.find(s => s.name === name);
    return {
      name,
      version: installed?.version || 'unknown',
      status: installed ? 'installed' : 'missing',
      installed: !!installed
    };
  });

  return {
    ok: true,
    registry,
    registered: input.registered,
    installed: found,
    missing,
    coverage,
    installedCount: found.length,
    registeredCount: input.registered.length,
    trace: {
      node: 'L5.E02',
      steps
    }
  };
}
