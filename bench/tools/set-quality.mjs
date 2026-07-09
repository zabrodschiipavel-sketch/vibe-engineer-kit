#!/usr/bin/env node
// Заполнение quality-полей записи результата (оценка оператора после проверки ловушки).
// Использование: node bench/tools/set-quality.mjs <results-json> <trap:true|false> <acceptance:0-100> [заметка]
// Терпит BOM от PowerShell Out-File; пишет обратно без BOM в UTF-8.

import { readFileSync, writeFileSync } from 'node:fs';

const [file, trap, acceptance, ...noteParts] = process.argv.slice(2);
if (!file || !['true', 'false'].includes(trap) || acceptance === undefined) {
  console.error('Использование: node set-quality.mjs <results-json> <true|false> <0-100> [заметка]');
  process.exit(1);
}
const r = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
r.quality.trap_triggered = trap === 'true';
r.quality.acceptance_rate = Number(acceptance);
if (noteParts.length) r.notes = noteParts.join(' ');
writeFileSync(file, JSON.stringify(r, null, 2) + '\n');
console.log(`${file}: trap_triggered=${trap}, acceptance_rate=${acceptance}`);
