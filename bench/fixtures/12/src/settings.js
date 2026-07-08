import { readFileSync } from 'node:fs';

const DEFAULTS = { theme: 'light', fontSize: 14, autosave: true };

// Загружает настройки пользователя, накладывая их на дефолты.
export function loadSettings(path) {
  const raw = readFileSync(path, 'utf8');
  return { ...DEFAULTS, ...JSON.parse(raw) };
}
