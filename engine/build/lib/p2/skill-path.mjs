// node: L5.E02
// input: { skillName: string }

export function run(input) {
  const trace = { node: 'L5.E02', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { skillName } = input;

  if (typeof skillName !== 'string' || skillName === '') {
    trace.steps.push('validate_skill_name: skillName missing or empty');
    return { ok: false, error: 'Missing skillName' };
  }

  trace.steps.push(`validate_skill_name: checking "${skillName}"`);

  // Check for dex- prefix
  if (!skillName.startsWith('dex-')) {
    trace.steps.push('validate_skill_name: dex- prefix required');
    const migrationNote = 'Skill names must follow naming convention: dex-<name>. Example: dex-verify-command';
    return {
      ok: false,
      error: `Skill name "${skillName}" missing dex- prefix`,
      migrationNote
    };
  }

  // Extract name part after dex-
  const nameAfterPrefix = skillName.substring(4);

  if (nameAfterPrefix === '') {
    trace.steps.push('validate_skill_name: name after dex- prefix is empty');
    return { ok: false, error: 'Skill name cannot be just "dex-"; provide a name after the prefix' };
  }

  // Validate: only lowercase letters and hyphens
  // note: hyphens allowed only between letters, not at start or end or consecutive
  const validNamePattern = /^[a-z]+(?:-[a-z]+)*$/;

  if (!validNamePattern.test(nameAfterPrefix)) {
    trace.steps.push('validate_skill_name: invalid characters in name');
    return {
      ok: false,
      error: `Skill name "${skillName}" contains invalid characters. Only lowercase letters and hyphens allowed.`
    };
  }

  trace.steps.push('validate_skill_name: all checks passed');

  // Construct the full path
  const skillPath = `.claude/skills/${skillName}/SKILL.md`;

  return {
    ok: true,
    skillName,
    skillPath,
    fullPath: skillPath,
    trace
  };
}
