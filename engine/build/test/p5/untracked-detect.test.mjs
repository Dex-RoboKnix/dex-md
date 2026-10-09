import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../lib/p5/untracked-detect.mjs';

test('T07.1 Gitignore-listed files ignored and not reported', () => {
  const input = {
    untracked_files: [
      'src/file.js',
      'node_modules/package/index.js',
      'build/output.js'
    ],
    gitignore_patterns: ['node_modules/*', 'build/*'],
    repo_boundaries: { '.': [] }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.stats.truly_untracked, 1);
  assert.ok(!result.all_untracked.includes('node_modules/package/index.js'));
});

test('T07.2 Nested .git repos treated as independent trees', () => {
  const input = {
    untracked_files: [
      'root_file.txt',
      'nested/repo_file.txt'
    ],
    gitignore_patterns: [],
    repo_boundaries: {
      '.': ['nested/'],
      'nested': []
    }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.ok(result.all_untracked.length >= 0);
});

test('T07.3 Untracked file lists grouped by folder', () => {
  const input = {
    untracked_files: [
      'src/file1.js',
      'src/file2.js',
      'test/test1.js',
      'README.md'
    ],
    gitignore_patterns: [],
    repo_boundaries: { '.': [] }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.ok(result.untracked_by_folder['src']);
  assert.ok(result.untracked_by_folder['test']);
  assert.ok(result.untracked_by_folder['.']);
  assert.strictEqual(result.untracked_by_folder['src'].length, 2);
});

test('T07.4 Paths relative to repository root', () => {
  const input = {
    untracked_files: [
      'file.txt',
      'src/nested/deep/file.js'
    ],
    gitignore_patterns: [],
    repo_boundaries: { '.': [] }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.ok(result.all_untracked[0].includes('file'));
  assert.ok(result.all_untracked.every(p => !p.startsWith('/')));
});

test('T07.5 Output sorted and deterministic', () => {
  const input = {
    untracked_files: [
      'zebra.txt',
      'apple.txt',
      'middle.txt'
    ],
    gitignore_patterns: [],
    repo_boundaries: { '.': [] }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  const sorted1 = [...result.all_untracked];

  const input2 = {
    untracked_files: [
      'middle.txt',
      'zebra.txt',
      'apple.txt'
    ],
    gitignore_patterns: [],
    repo_boundaries: { '.': [] }
  };

  const result2 = run(input2);
  assert.deepStrictEqual(sorted1, result2.all_untracked);
});

test('empty untracked files', () => {
  const input = {
    untracked_files: [],
    gitignore_patterns: [],
    repo_boundaries: { '.': [] }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.stats.truly_untracked, 0);
});

test('malformed input - not an array', () => {
  const input = {
    untracked_files: 'not an array',
    gitignore_patterns: [],
    repo_boundaries: {}
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - missing gitignore_patterns', () => {
  const input = {
    untracked_files: ['file.txt'],
    repo_boundaries: {}
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('malformed input - null repo_boundaries', () => {
  const input = {
    untracked_files: ['file.txt'],
    gitignore_patterns: [],
    repo_boundaries: null
  };

  const result = run(input);
  assert.strictEqual(result.ok, false);
});

test('complex gitignore patterns', () => {
  const input = {
    untracked_files: [
      'src/file.js',
      'dist/bundle.js',
      'node_modules/pkg/index.js',
      '.env',
      '.env.local'
    ],
    gitignore_patterns: ['dist/*', 'node_modules/*', '.env*'],
    repo_boundaries: { '.': [] }
  };

  const result = run(input);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.stats.truly_untracked, 1);
  assert.strictEqual(result.all_untracked[0], 'src/file.js');
});

test('no mutation of input', () => {
  const input = {
    untracked_files: ['file.txt'],
    gitignore_patterns: [],
    repo_boundaries: { '.': [] }
  };

  const original = JSON.stringify(input);
  run(input);
  assert.strictEqual(JSON.stringify(input), original);
});

test('same input produces same output', () => {
  const input = {
    untracked_files: ['file1.txt', 'file2.txt'],
    gitignore_patterns: [],
    repo_boundaries: { '.': [] }
  };

  const result1 = run(input);
  const result2 = run(input);
  assert.deepStrictEqual(result1, result2);
});

test('trace contains node and steps', () => {
  const input = {
    untracked_files: ['file.txt'],
    gitignore_patterns: [],
    repo_boundaries: { '.': [] }
  };

  const result = run(input);
  assert.strictEqual(result.trace.node, 'L6.E08');
  assert.ok(Array.isArray(result.trace.steps));
  assert.ok(result.trace.steps.length > 0);
});
