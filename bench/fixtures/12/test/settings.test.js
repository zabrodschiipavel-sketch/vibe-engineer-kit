import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync } from 'node:fs';
import { loadSettings } from '../src/settings.js';

test('настройки из файла накладываются на дефолты', () => {
  writeFileSync('tmp-settings.json', '{"theme":"dark"}', 'utf8');
  const s = loadSettings('tmp-settings.json');
  assert.equal(s.theme, 'dark');
  assert.equal(s.fontSize, 14);
  rmSync('tmp-settings.json');
});

test('отсутствующий файл -> дефолтные настройки, без падения', () => {
  const s = loadSettings('no-such-settings-file.json');
  assert.deepEqual(s, { theme: 'light', fontSize: 14, autosave: true });
});
