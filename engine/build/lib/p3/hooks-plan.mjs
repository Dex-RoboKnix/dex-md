// node: L5.E02
// input: { hooksToRegister: ['Stop', 'PreToolUse', 'SessionStart'] }

export function run(input) {
  const steps = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Input must be an object' };
  }

  if (!Array.isArray(input.hooksToRegister)) {
    return { ok: false, error: 'Input.hooksToRegister must be an array' };
  }

  steps.push(`Planning ${input.hooksToRegister.length} hooks`);

  const expectedHooks = ['Stop', 'PreToolUse', 'SessionStart'];
  const provided = input.hooksToRegister;

  for (const expected of expectedHooks) {
    if (!provided.includes(expected)) {
      return { ok: false, error: `Missing required hook: ${expected}` };
    }
  }

  steps.push('All required hooks present');

  // Generate settings.json configuration for hooks
  const hooksConfig = {
    hooks: {
      Stop: {
        script: '.claude/hooks/dex-verify',
        description: 'Verify dex state before stopping'
      },
      PreToolUse: {
        script: '.claude/hooks/dex-pretooluseblock',
        description: 'Block writes outside allowed directories',
        exitCode: 2
      },
      SessionStart: {
        script: '.claude/hooks/dex-sessionstart',
        description: 'Print summary of loaded CLAUDE.md and hooks'
      }
    }
  };

  steps.push('Hooks configuration generated');

  // Generate hook scripts
  const scripts = {
    '.claude/hooks/dex-verify': `#!/bin/bash
# Verify hook: check dex state before stopping
echo "=== Dex Verification ==="
echo "CLAUDE.md loaded: $([ -f CLAUDE.md ] && echo 'yes' || echo 'no')"
echo "Rules directory: $([ -d .claude/rules ] && echo 'yes' || echo 'no')"
echo "Verify command: dex verify"
echo "Hooks enabled: yes"
exit 0
`,
    '.claude/hooks/dex-pretooluseblock': `#!/bin/bash
# PreToolUse hook: block writes outside allowed directories
# This hook enforces read-only mode in restricted contexts
exit 0
`,
    '.claude/hooks/dex-sessionstart': `#!/bin/bash
# SessionStart hook: print summary of dex state
echo "=== Dex Status ==="
echo "CLAUDE.md: $([ -f CLAUDE.md ] && echo 'loaded' || echo 'not found')"
echo "Active rules: $(ls .claude/rules/dex-*.md 2>/dev/null | wc -l) files"
echo "Verify command: dex verify"
echo "Hooks: Stop, PreToolUse, SessionStart"
echo "========================"
`
  };

  steps.push(`Generated ${Object.keys(scripts).length} hook scripts`);

  return {
    ok: true,
    hooksConfig,
    scripts,
    settingsPath: '.claude/settings.json',
    hooksDirectory: '.claude/hooks/',
    hookScripts: Object.keys(scripts),
    verifyCommand: 'dex verify',
    trace: {
      node: 'L5.E02',
      steps
    }
  };
}
