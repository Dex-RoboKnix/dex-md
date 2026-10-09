import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p2/skill-frontmatter.mjs';

test('T14.1 SKILL.md frontmatter requires name, description, version, author', () => {
  const content = `---
name: dex-verify-command
description: Verify installed commands in project
version: 1.0.0
author: Claude
---

# DexSpine Skill`;

  const result = run({ content, expectedName: 'dex-verify-command' });
  assert.equal(result.ok, true);
  assert.equal(result.name, 'dex-verify-command');
  assert.equal(result.description, 'Verify installed commands in project');
  assert.equal(result.version, '1.0.0');
  assert.equal(result.author, 'Claude');
});

test('T14.2 Skill name in frontmatter matches parent folder name (case-sensitive)', () => {
  const content = `---
name: dex-my-skill
description: Does something
version: 1.0.0
author: Test Author
---

Content`;

  const result = run({ content, expectedName: 'dex-my-skill' });
  assert.equal(result.ok, true);
});

test('Skill name case mismatch rejected', () => {
  const content = `---
name: dex-my-skill
description: Does something
version: 1.0.0
author: Test
---

Content`;

  const result = run({ content, expectedName: 'dex-My-Skill' });
  assert.equal(result.ok, false);
  assert(result.error.includes('mismatch'));
});

test('T14.3 Malformed YAML frontmatter rejected', () => {
  const content = `---
No proper YAML format here
---

Content`;

  const result = run({ content, expectedName: 'dex-test' });
  assert.equal(result.ok, false);
  assert(result.error.includes('missing required fields') || result.error.includes('Malformed'));
});

test('Missing name field rejected', () => {
  const content = `---
description: Something
version: 1.0.0
author: Me
---

Content`;

  const result = run({ content, expectedName: 'dex-test' });
  assert.equal(result.ok, false);
  assert(result.missingFields.includes('name'));
});

test('Missing description field rejected', () => {
  const content = `---
name: dex-test
version: 1.0.0
author: Me
---

Content`;

  const result = run({ content, expectedName: 'dex-test' });
  assert.equal(result.ok, false);
  assert(result.missingFields.includes('description'));
});

test('Missing version field rejected', () => {
  const content = `---
name: dex-test
description: Something
author: Me
---

Content`;

  const result = run({ content, expectedName: 'dex-test' });
  assert.equal(result.ok, false);
  assert(result.missingFields.includes('version'));
});

test('Missing author field rejected', () => {
  const content = `---
name: dex-test
description: Something
version: 1.0.0
---

Content`;

  const result = run({ content, expectedName: 'dex-test' });
  assert.equal(result.ok, false);
  assert(result.missingFields.includes('author'));
});

test('Frontmatter with quotes handled', () => {
  const content = `---
name: "dex-quoted"
description: 'Test description'
version: "2.0.0"
author: 'Test Author'
---

Content`;

  const result = run({ content, expectedName: 'dex-quoted' });
  assert.equal(result.ok, true);
  assert.equal(result.name, 'dex-quoted');
});

test('Empty content rejected', () => {
  const result = run({ content: '', expectedName: 'dex-test' });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing content rejected', () => {
  const result = run({ expectedName: 'dex-test' });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Empty expectedName rejected', () => {
  const content = `---
name: dex-test
description: Test
version: 1.0.0
author: Test
---`;

  const result = run({ content, expectedName: '' });
  assert.equal(result.ok, false);
  assert(result.error);
});

test('Missing expectedName rejected', () => {
  const content = `---
name: dex-test
description: Test
version: 1.0.0
author: Test
---`;

  const result = run({ content });
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
    content: `---
name: dex-test
description: Test
version: 1.0.0
author: Me
---`,
    expectedName: 'dex-test'
  };
  const inputCopy = JSON.parse(JSON.stringify(input));
  run(input);
  assert.deepEqual(input, inputCopy);
});

test('Same output twice with same input', () => {
  const input = {
    content: `---
name: dex-test
description: Test
version: 1.0.0
author: Me
---`,
    expectedName: 'dex-test'
  };
  const result1 = run(input);
  const result2 = run(input);
  assert.deepEqual(result1, result2);
});

test('Trace contains node and steps', () => {
  const result = run({
    content: `---
name: dex-test
description: Test
version: 1.0.0
author: Me
---`,
    expectedName: 'dex-test'
  });
  assert(result.trace);
  assert.equal(result.trace.node, 'L5.E05');
  assert(Array.isArray(result.trace.steps));
  assert(result.trace.steps.length > 0);
});
