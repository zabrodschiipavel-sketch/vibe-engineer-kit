import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRow } from '../src/importer.js';

test('parseRow извлекает имя и email', () => {
  assert.deepEqual(parseRow('John,john@x.com'), { name: 'John', email: 'john@x.com' });
});

test('parseRow терпит лишнее хвостовое поле', () => {
  // существующее поведение: лишние поля игнорируются
  assert.deepEqual(parseRow('John,john@x.com,ignored'), { name: 'John', email: 'john@x.com' });
});
