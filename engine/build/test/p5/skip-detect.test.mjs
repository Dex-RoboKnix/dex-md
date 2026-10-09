import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p5/skip-detect.mjs';

test('T16.1: Stages tracked in correct order', () => {
  const input = {
    stages: [
      { name: 'grill' },
      { name: 'spec' },
      { name: 'implement' },
      { name: 'review' },
      { name: 'checkpoint' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.stagesValid, true);
});

test('T16.2: Skipped stage detected and reported', () => {
  const input = {
    stages: [
      { name: 'grill' },
      { name: 'implement' } // spec is skipped
    ]
  };
  const result = run(input);
  assert.equal(result.ok, false);
  assert.ok(result.skipped.length > 0);
  assert.match(result.error, /skipped/);
});

test('T16.3: Spec then implement may repeat without flagging', () => {
  const input = {
    stages: [
      { name: 'grill' },
      { name: 'spec' },
      { name: 'implement' },
      { name: 'spec' }, // repeat allowed
      { name: 'implement' }, // repeat allowed
      { name: 'review' },
      { name: 'checkpoint' }
    ],
    attempt_cap: 3
  };
  const result = run(input);
  assert.equal(result.ok, true);
});

test('T16.4: Layer 8 waiver honored for skipped stages', () => {
  const input = {
    stages: [
      { name: 'grill' },
      { name: 'review' } // spec, implement skipped but waived
    ],
    layer8_waivers: ['spec', 'implement']
  };
  const result = run(input);
  assert.equal(result.ok, true);
});

test('T16.5: Report includes stage name, expected position, actual position, timestamp, exit code', () => {
  const input = {
    stages: [
      { name: 'grill', timestamp: '10:00:00', exit_code: 0 },
      { name: 'spec', timestamp: '10:15:00', exit_code: 0 }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.ok(result.trace.steps.length > 0);
  assert.ok(result.trace.steps[0].timestamp !== undefined);
  assert.ok(result.trace.steps[0].exit_code !== undefined);
});

test('T16.6: Skipped stage blocks progression', () => {
  const input = {
    stages: [
      { name: 'grill' },
      { name: 'review' } // skipped spec, implement
    ]
  };
  const result = run(input);
  assert.equal(result.ok, false);
  assert.ok(result.skipped && result.skipped.length > 0);
});

test('T16: Empty input returns error', () => {
  const result = run({});
  assert.equal(result.ok, false);
});

test('T16: Null stages returns error', () => {
  const result = run({ stages: null });
  assert.equal(result.ok, false);
});

test('T16: Empty stages array returns error', () => {
  const result = run({ stages: [] });
  assert.equal(result.ok, false);
});

test('T16: Invalid stage name returns error', () => {
  const result = run({
    stages: [{ name: 'invalid-stage' }]
  });
  assert.equal(result.ok, false);
});

test('T16: No mutation of input', () => {
  const input = {
    stages: [{ name: 'grill' }, { name: 'spec' }]
  };
  const copy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, copy);
});

test('T16: Same input produces same output twice', () => {
  const input = {
    stages: [
      { name: 'grill' },
      { name: 'spec' },
      { name: 'implement' },
      { name: 'review' },
      { name: 'checkpoint' }
    ]
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('T16: Trace includes steps for each stage', () => {
  const input = {
    stages: [
      { name: 'grill' },
      { name: 'spec' }
    ]
  };
  const result = run(input);
  assert.equal(result.ok, true);
  assert.equal(result.trace.node, 'L6.E05');
  assert.equal(result.trace.steps.length, 2);
});
