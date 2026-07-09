#!/usr/bin/env node
// Статическая оценка налога на контекст конфигурации сета (метрика context_tax_tokens, METRICS.md §2).
//
// Использование:
//   node bench/tools/context-tax.mjs [путь-к-каталогу-конфигурации]
//   (по умолчанию — project-template; для кандидата: bench/candidates/<имя>)
//
// Что считает:
//   ПОСТОЯННЫЙ налог (платится в каждой сессии, всегда):
//     - CLAUDE.md целиком;
//     - frontmatter скиллов (name + description — грузятся в системный промпт для автотриггера);
//     - frontmatter сабагентов (description — грузится в описание Agent tool).
//   ПО ВЫЗОВУ (платится только при срабатывании):
//     - тела SKILL.md (после frontmatter);
//     - тела сабагентов (системный промпт агента в его собственном контексте).
//
// Токены оцениваются по числу символов. Для кириллицы токенизатор Claude заметно плотнее
// расходует токены, чем для английского: берём вилку 2.2–3.0 символа/токен и показываем
// диапазон. Это ОЦЕНКА для сравнения конфигураций между собой; авторитетный замер —
// `/context` в живой пустой сессии (METRICS.md, context_tax_tokens).

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const CHARS_PER_TOKEN_MIN = 2.2; // пессимистично (плотная кириллица)
const CHARS_PER_TOKEN_MAX = 3.0; // оптимистично (кириллица + код/markdown)

const root = resolve(process.argv[2] ?? join(import.meta.dirname, '..', '..', 'project-template'));
if (!existsSync(root)) {
  console.error(`Каталог конфигурации не найден: ${root}`);
  process.exit(1);
}

const tokens = (chars) => ({
  chars,
  tokens_min: Math.round(chars / CHARS_PER_TOKEN_MAX),
  tokens_max: Math.round(chars / CHARS_PER_TOKEN_MIN),
});

// Разбор frontmatter: возвращает [frontmatterChars, bodyChars]
function splitFrontmatter(text) {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!m) return [0, text.length];
  return [m[0].length, text.length - m[0].length];
}

const alwaysOn = []; // { name, chars }
const onInvoke = []; // { name, chars }

const claudeMd = join(root, 'CLAUDE.md');
if (existsSync(claudeMd)) {
  alwaysOn.push({ name: 'CLAUDE.md (целиком)', chars: readFileSync(claudeMd, 'utf8').length });
}

const skillsDir = join(root, '.claude', 'skills');
if (existsSync(skillsDir)) {
  for (const entry of readdirSync(skillsDir)) {
    const skillFile = join(skillsDir, entry, 'SKILL.md');
    if (!existsSync(skillFile)) continue;
    const [fm, body] = splitFrontmatter(readFileSync(skillFile, 'utf8'));
    alwaysOn.push({ name: `skill:${entry} (frontmatter)`, chars: fm });
    onInvoke.push({ name: `skill:${entry} (тело)`, chars: body });
  }
}

const agentsDir = join(root, '.claude', 'agents');
if (existsSync(agentsDir)) {
  for (const entry of readdirSync(agentsDir)) {
    const agentFile = join(agentsDir, entry);
    if (!statSync(agentFile).isFile() || !entry.endsWith('.md')) continue;
    const [fm, body] = splitFrontmatter(readFileSync(agentFile, 'utf8'));
    alwaysOn.push({ name: `agent:${entry} (frontmatter)`, chars: fm });
    onInvoke.push({ name: `agent:${entry} (тело)`, chars: body });
  }
}

const sum = (items) => items.reduce((a, i) => a + i.chars, 0);
const fmtRange = (chars) => {
  const t = tokens(chars);
  return `~${t.tokens_min}–${t.tokens_max} ток.`;
};

const pad = (s, n) => String(s).padEnd(n);
console.log(`Конфигурация: ${relative(process.cwd(), root) || root}\n`);
console.log('ПОСТОЯННЫЙ налог (в каждой сессии):');
for (const i of alwaysOn) console.log(`  ${pad(i.name, 42)} ${pad(i.chars + ' симв.', 12)} ${fmtRange(i.chars)}`);
const aChars = sum(alwaysOn);
console.log(`  ${pad('ИТОГО постоянный', 42)} ${pad(aChars + ' симв.', 12)} ${fmtRange(aChars)}\n`);
console.log('ПО ВЫЗОВУ (только при срабатывании скилла/агента):');
for (const i of onInvoke) console.log(`  ${pad(i.name, 42)} ${pad(i.chars + ' симв.', 12)} ${fmtRange(i.chars)}`);
const iChars = sum(onInvoke);
console.log(`  ${pad('ИТОГО по вызову', 42)} ${pad(iChars + ' симв.', 12)} ${fmtRange(iChars)}\n`);
console.log('Оценка по символам (вилка 2.2–3.0 симв./токен для кириллицы).');
console.log('Авторитетный замер — /context в пустой сессии конфигурации (METRICS.md, context_tax_tokens).');

// Машиночитаемый итог — последней строкой, для скриптов
console.log('\nJSON: ' + JSON.stringify({
  config: relative(process.cwd(), root) || root,
  always_on: { ...tokens(aChars), items: alwaysOn.length },
  on_invoke: { ...tokens(iChars), items: onInvoke.length },
}));
