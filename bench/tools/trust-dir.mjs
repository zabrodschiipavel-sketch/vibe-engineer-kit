#!/usr/bin/env node
// Регистрирует каталог как доверенный в ~/.claude.json (hasTrustDialogAccepted: true).
// Без этого headless-claude в untrusted-каталоге игнорирует настройки проекта.
// Использование: node trust-dir.mjs "<абсолютный путь к каталогу>"
//
// Почему Node, а не PowerShell: PS 5.1 ConvertFrom-Json падает на ~/.claude.json
// (вложенные пустые/спорные ключи) и может записать пустой файл, сломав CLI.
// Node.JSON.parse парсит его корректно. Перед записью делается бэкап.

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Использование: node trust-dir.mjs "<путь к каталогу>"');
  process.exit(1);
}

const cfgPath = join(homedir(), '.claude.json');
const key = dir.replace(/\\/g, '/'); // Claude Code хранит пути через прямой слэш

let cfg = {};
if (existsSync(cfgPath)) {
  const raw = readFileSync(cfgPath, 'utf8');
  cfg = JSON.parse(raw); // бросит, если файл битый — тогда лучше упасть, чем перезаписать
  copyFileSync(cfgPath, cfgPath + '.bench-bak'); // бэкап только после успешного парса
}

if (!cfg.projects || typeof cfg.projects !== 'object') cfg.projects = {};
if (!cfg.projects[key] || typeof cfg.projects[key] !== 'object') cfg.projects[key] = {};
cfg.projects[key].hasTrustDialogAccepted = true;

writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
console.log('trusted:', key);
