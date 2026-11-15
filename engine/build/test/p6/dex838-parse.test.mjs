import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { run } from '../../lib/p6/dex838-parse.mjs';
import { readModule, sha256, sourceAt } from '../../tools/make-dex838.mjs';

test('a held-question line parses in strict mode, with scope, context and qualifiers', () => {
  const r = run({ line: 'dex(dex-loop, @issue:115,held:dex-loop-115)["Which slice first? dex(prove the cycle) dex[record the answer twice]"]' });
  assert.equal(r.ok, true);
  assert.equal(r.parsed.scope, 'dex-loop');
  assert.deepEqual(r.parsed.context, { issue: '115', held: 'dex-loop-115' });
  assert.deepEqual(r.parsed.qualifiers.softcode, ['prove the cycle']);
  assert.deepEqual(r.parsed.qualifiers.hardcode, ['record the answer twice']);
  assert.equal(r.trace.strict, true);
});

test('a node wire line, as the vault tool writes it, parses in strict mode', () => {
  const r = run({ line: 'dex(sample-matter, @layer:policy,phase:plan,point:5)["How would anyone know this is settled? (L3 Policy)"]' });
  assert.equal(r.ok, true);
  assert.equal(r.parsed.context.point, '5');
});

test('a context value may hold a colon (a URL)', () => {
  const r = run({ line: 'dex(dex-md, @source:https://example.org/a)["x"]' });
  assert.equal(r.ok, true);
  assert.equal(r.parsed.context.source, 'https://example.org/a');
});

test('strict mode refuses what lenient mode would repair; lenient mode is there when asked for', () => {
  for (const line of [
    'dex(a, @x:1,x:2)["dup key"]',
    'dex(a, @x:1,,y:2)["empty item"]',
    'dex(a, @x:1,@y:2)["stray sigil"]',
    'dex(a, @x:1)["dex[never closed"]',
  ]) {
    const r = run({ line });
    assert.equal(r.ok, false, line);
    assert.equal(typeof r.error, 'string');
  }
  assert.equal(run({ line: 'dex(a, @x:1)["dex[never closed"]', strict: false }).ok, true);
});

test('junk input returns ok:false and never throws', () => {
  for (const input of [undefined, null, 5, 'text', {}, { line: 7 }, { line: '' }, { line: 'not a wire' }, { line: 'dex(bad scope!, @x)["y"]' }]) {
    const r = run(input);
    assert.equal(r.ok, false, JSON.stringify(input));
  }
});

test('the module carries the dexspine-core parser unchanged: its copy matches the hash in its header', () => {
  const m = readModule();
  assert.ok(m, 'source header and markers present');
  assert.match(m.commit, /^[0-9a-f]{40}$/);
  assert.equal(sha256(m.copy), m.hash);
});

test('the copy matches the pinned dexspine-core commit (set DEXSPINE_CORE to a clone to check)', { skip: !process.env.DEXSPINE_CORE && 'DEXSPINE_CORE is not set' }, () => {
  const m = readModule();
  assert.equal(sha256(sourceAt(process.env.DEXSPINE_CORE, m.commit)), m.hash);
});
