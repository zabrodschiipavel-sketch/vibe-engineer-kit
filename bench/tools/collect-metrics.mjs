#!/usr/bin/env node
// Автосбор метрик прогона из транскрипта сессии Claude Code (JSONL).
// Использование: node collect-metrics.mjs <путь-к-session.jsonl>
// Выводит JSON для секции "auto" записи результата (см. bench/METRICS.md).

import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('Использование: node collect-metrics.mjs <путь-к-session.jsonl>');
  process.exit(1);
}

const lines = readFileSync(path.replace(/^~/, process.env.HOME ?? process.env.USERPROFILE ?? '~'), 'utf8')
  .split('\n')
  .filter(Boolean);

const entries = [];
for (const line of lines) {
  try { entries.push(JSON.parse(line)); } catch { /* служебные/битые строки пропускаем */ }
}

const usage = { tokens_in: 0, tokens_out: 0, tokens_cache_read: 0, tokens_cache_create: 0 };
const toolCalls = {};
let turns = 0;
let humanMessages = 0;
let tFirst = null;
let tLast = null;

for (const e of entries) {
  if (e.timestamp) {
    const t = Date.parse(e.timestamp);
    if (!Number.isNaN(t)) {
      if (tFirst === null || t < tFirst) tFirst = t;
      if (tLast === null || t > tLast) tLast = t;
    }
  }

  const msg = e.message;
  if (!msg) continue;

  if (e.type === 'assistant') {
    turns += 1;
    const u = msg.usage;
    if (u) {
      usage.tokens_in += u.input_tokens ?? 0;
      usage.tokens_out += u.output_tokens ?? 0;
      usage.tokens_cache_read += u.cache_read_input_tokens ?? 0;
      usage.tokens_cache_create += u.cache_creation_input_tokens ?? 0;
    }
    if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block?.type === 'tool_use') {
          toolCalls[block.name] = (toolCalls[block.name] ?? 0) + 1;
        }
      }
    }
  }

  if (e.type === 'user') {
    // Сообщение человека = текст без tool_result (результаты инструментов приходят как user-записи)
    const c = msg.content;
    const isToolResult = Array.isArray(c) && c.some(b => b?.type === 'tool_result');
    if (!isToolResult && (typeof c === 'string' || Array.isArray(c))) humanMessages += 1;
  }
}

const result = {
  ...usage,
  wall_time_s: tFirst !== null && tLast !== null ? Math.round((tLast - tFirst) / 1000) : null,
  turns,
  tool_calls_total: Object.values(toolCalls).reduce((a, b) => a + b, 0),
  tool_calls_by_type: Object.fromEntries(Object.entries(toolCalls).sort((a, b) => b[1] - a[1])),
  human_messages: Math.max(0, humanMessages - 1), // минус стартовый промпт
};

console.log(JSON.stringify(result, null, 2));
