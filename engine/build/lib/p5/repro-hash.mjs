// node: L5.E05
// input: { phase: number, models_used: string[], agent_count: number, task_count: number, git_commit_at_start: string }

import { createHash } from 'node:crypto';

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const required = ['phase', 'models_used', 'agent_count', 'task_count', 'git_commit_at_start'];
  for (const field of required) {
    if (!(field in input)) {
      return { ok: false, error: `input.${field} is required` };
    }
  }

  if (typeof input.phase !== 'number' || input.phase <= 0) {
    return { ok: false, error: 'input.phase must be a positive number' };
  }

  if (!Array.isArray(input.models_used) || input.models_used.length === 0) {
    return { ok: false, error: 'input.models_used must be a non-empty array' };
  }

  if (typeof input.agent_count !== 'number' || input.agent_count < 0) {
    return { ok: false, error: 'input.agent_count must be a non-negative number' };
  }

  if (typeof input.task_count !== 'number' || input.task_count < 0) {
    return { ok: false, error: 'input.task_count must be a non-negative number' };
  }

  if (typeof input.git_commit_at_start !== 'string' || !input.git_commit_at_start.trim()) {
    return { ok: false, error: 'input.git_commit_at_start must be a non-empty string' };
  }

  // Build canonical string from inputs (sorted models for consistency)
  const models = [...input.models_used].sort().join(',');
  const canonicalStr = `phase:${input.phase}|models:${models}|agents:${input.agent_count}|tasks:${input.task_count}|commit:${input.git_commit_at_start}`;

  // Compute SHA256 hash
  const hash = createHash('sha256').update(canonicalStr).digest('hex').substring(0, 16);

  const steps = [
    { action: 'canonicalize-input', length: canonicalStr.length },
    { action: 'compute-hash', algorithm: 'sha256', length: 16 }
  ];

  return {
    ok: true,
    reproHash: hash,
    canonicalString: canonicalStr,
    trace: {
      node: 'L5.E05',
      steps
    }
  };
}
