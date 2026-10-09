// node: L2.E07
// input: { team: [{ name, role }], definitions: { roles: [name, ...] } }

const DEFINED_ROLES = ['tester', 'devops', 'architect', 'security', 'pm'];

export function run(input) {
  const steps = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Input must be an object' };
  }

  if (!Array.isArray(input.team)) {
    return { ok: false, error: 'Input.team must be an array' };
  }

  if (input.team.length === 0) {
    return { ok: false, error: 'Team roster cannot be empty' };
  }

  const roles = input.definitions?.roles || DEFINED_ROLES;
  steps.push(`Validating against ${roles.length} defined roles`);

  // Check required roles present
  const rolesInTeam = new Set(input.team.map(p => p.role));
  const hasTeester = rolesInTeam.has('tester');
  const hasDevops = rolesInTeam.has('devops');

  if (!hasTeester || !hasDevops) {
    steps.push('Validation failed: missing required roles');
    return {
      ok: false,
      error: `Missing required roles: ${!hasTeester ? 'tester' : ''} ${!hasDevops ? 'devops' : ''}`.trim()
    };
  }
  steps.push('Required roles (tester, devops) present');

  // Validate all roles
  for (const person of input.team) {
    if (!roles.includes(person.role)) {
      steps.push(`Invalid role '${person.role}' for ${person.name}`);
      return { ok: false, error: `Role '${person.role}' not in defined set` };
    }
  }
  steps.push('All roles validated against vocabulary');

  // Check duplicates
  const seen = new Set();
  for (const person of input.team) {
    if (seen.has(person.name)) {
      steps.push(`Duplicate person ${person.name}`);
      return { ok: false, error: `Duplicate person: ${person.name}` };
    }
    seen.add(person.name);
  }
  steps.push('No duplicates found');

  // Check each person has one role (note: we assume input enforces this, but check anyway)
  const roleAssignments = {};
  for (const person of input.team) {
    if (roleAssignments[person.name]) {
      return { ok: false, error: `${person.name} assigned multiple roles` };
    }
    roleAssignments[person.name] = person.role;
  }
  steps.push('Each person assigned one role');

  const rationale = input.team.map(p => ({
    person: p.name,
    role: p.role,
    reason: p.reason || 'Selected for expertise in ' + p.role
  }));

  return {
    ok: true,
    validated: true,
    roster: input.team,
    rationale,
    trace: {
      node: 'L2.E07',
      steps
    }
  };
}
