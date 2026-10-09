import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/mcp-propose.mjs';

test('T17.1 MCP tokens required to use ${VAR} placeholders with no literals', () => {
  const result = run({
    serverName: 'claude',
    token: '${CLAUDE_API_KEY}'
  });

  assert.equal(result.ok, true);
  assert.equal(result.securityWarnings.literalTokenInProposal, false);
  assert(result.proposedEntry.claude);
  assert.equal(result.proposedEntry.claude.token, '${CLAUDE_API_KEY}');
});

test('Literal token flagged with warning', () => {
  const result = run({
    serverName: 'claude',
    token: 'sk-1234567890abcdef1234567890abcdef'
  });

  assert.equal(result.ok, true);
  assert.equal(result.securityWarnings.literalTokenInProposal, true);
  assert(result.securityWarnings.message);
  assert(result.securityWarnings.message.includes('WARNING'));
});

test('T17.2 Literal secrets in existing .mcp.json flagged', () => {
  const existingConfig = {
    'some-service': {
      token: 'sk-secretskeyhere1234567890abcdef'
    }
  };

  const result = run({
    serverName: 'new-service',
    token: '${NEW_API_KEY}',
    existingConfig
  });

  assert.equal(result.ok, true);
  assert(result.securityWarnings.literalSecretsInExisting.length > 0);
});

test('T17.3 Diff shown when entry already exists', () => {
  const existingConfig = {
    'claude': {
      token: '${OLD_KEY}'
    }
  };

  const result = run({
    serverName: 'claude',
    token: '${NEW_KEY}',
    existingConfig
  });

  assert.equal(result.ok, true);
  assert.equal(result.entryExists, true);
  assert(result.diff);
  assert.deepEqual(result.diff.before, { token: '${OLD_KEY}' });
  assert.deepEqual(result.diff.after, { token: '${NEW_KEY}', required: true });
});

test('No diff when entry does not exist', () => {
  const result = run({
    serverName: 'new-service',
    token: '${API_KEY}'
  });

  assert.equal(result.ok, true);
  assert.equal(result.entryExists, false);
  assert.equal(result.diff, null);
});

test('T17.4 User warned about non-interactive runs', () => {
  const result = run({
    serverName: 'service',
    token: '${TOKEN}'
  });

  assert.equal(result.ok, true);
  assert(typeof result.nonInteractiveWarning === 'string');
  assert(result.nonInteractiveWarning.toLowerCase().includes('non-interactive') || result.nonInteractiveWarning.toLowerCase().includes('sdk'));
});

test('T17.5 Recommendation for committing only approved servers', () => {
  const result = run({
    serverName: 'service',
    token: '${TOKEN}'
  });

  assert.equal(result.ok, true);
  assert(result.recommendation);
  assert(result.recommendation.includes('commit'));
});

test('T17.6 No entry written without approval', () => {
  const result = run({
    serverName: 'service',
    token: '${TOKEN}'
  });

  assert.equal(result.ok, true);
  assert.equal(result.requiresUserApproval, true);
  // note: no actual file writes; effects array is empty
  assert(Array.isArray(result.effects));
  assert.equal(result.effects.length, 0);
});

test('Empty serverName rejected', () => {
  const result = run({
    serverName: '',
    token: '${TOKEN}'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing serverName rejected', () => {
  const result = run({
    token: '${TOKEN}'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Empty token rejected', () => {
  const result = run({
    serverName: 'service',
    token: ''
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing token rejected', () => {
  const result = run({
    serverName: 'service'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Non-object existingConfig rejected', () => {
  const result = run({
    serverName: 'service',
    token: '${TOKEN}',
    existingConfig: 'not-an-object'
  });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Null input rejected', () => {
  const result = run(null);
  assert.equal(result.ok, false);
  assert(result.error);
});

test('No mutation of input', () => {
  const input = {
    serverName: 'service',
    token: '${TOKEN}',
    existingConfig: { other: { token: '${OTHER}' } }
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    serverName: 'service',
    token: '${TOKEN}'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    serverName: 'service',
    token: '${TOKEN}'
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L3.E02');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
