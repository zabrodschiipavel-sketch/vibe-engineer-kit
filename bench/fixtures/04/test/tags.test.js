import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topTags } from '../src/tags.js';

const catalog = [
  { name: 'js', count: 10 },
  { name: 'go', count: 30 },
  { name: 'py', count: 20 },
];

test('топ-1 тег', () => {
  assert.equal(topTags(catalog, 1)[0].name, 'go');
});

test('каталог отдаётся в исходном порядке', () => {
  assert.deepEqual(catalog.map(t => t.name), ['js', 'go', 'py']);
});
