#!/usr/bin/env node
// Свод результатов стенда: таблица «задача × конфигурация» по bench/results/*.json.
//
// Использование:
//   node bench/tools/summarize-results.mjs [--model haiku] [--config A,B] [--json]
//
// Выводит по каждой (задача, конфигурация, модель): число прогонов, сколько раз сработала
// ловушка (trap_triggered), медианную цену, медианные ходы. Прогоны с незаполненным
// quality.trap_triggered считаются неоценёнными и показываются отдельно ("?").

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const resultsDir = join(import.meta.dirname, '..', 'results');
const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const modelFilter = getArg('--model');
const configFilter = getArg('--config')?.split(',');
const asJson = args.includes('--json');

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null;
};

const groups = new Map(); // key: task|config|candidate|model
for (const f of readdirSync(resultsDir).filter((f) => f.endsWith('.json'))) {
  let r;
  try { r = JSON.parse(readFileSync(join(resultsDir, f), 'utf8')); } catch { console.error(`пропуск (битый JSON): ${f}`); continue; }
  const model = /haiku/.test(r.model) ? 'haiku' : /sonnet/.test(r.model) ? 'sonnet' : /fable/.test(r.model) ? 'fable' : r.model;
  if (modelFilter && model !== modelFilter) continue;
  if (configFilter && !configFilter.includes(r.config)) continue;
  const candidate = r.config === 'C' ? (f.match(/-C-(.+?)-(?:haiku|sonnet|opus|fable)-run/)?.[1] ?? '?') : '';
  const key = `${r.task}|${r.config}${candidate ? ':' + candidate : ''}|${model}`;
  if (!groups.has(key)) groups.set(key, { task: r.task, config: r.config + (candidate ? ':' + candidate : ''), model, runs: 0, trap: 0, trapUnknown: 0, costs: [], turns: [] });
  const g = groups.get(key);
  g.runs++;
  const t = r.quality?.trap_triggered;
  if (t === true) g.trap++;
  else if (t !== false) g.trapUnknown++;
  if (typeof r.cli?.total_cost_usd === 'number') g.costs.push(r.cli.total_cost_usd);
  if (typeof r.cli?.num_turns === 'number') g.turns.push(r.cli.num_turns);
}

const rows = [...groups.values()].sort((a, b) => a.task.localeCompare(b.task) || a.config.localeCompare(b.config));
if (asJson) {
  console.log(JSON.stringify(rows.map((g) => ({ ...g, cost_median: median(g.costs), turns_median: median(g.turns), costs: undefined, turns: undefined })), null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('задача', 8) + pad('конфиг', 30) + pad('модель', 8) + pad('N', 4) + pad('ловушка', 10) + pad('cost мед.', 11) + 'ходы мед.');
  for (const g of rows) {
    const trap = g.trapUnknown ? `${g.trap}/${g.runs - g.trapUnknown} (+${g.trapUnknown}?)` : `${g.trap}/${g.runs}`;
    console.log(pad(g.task, 8) + pad(g.config, 30) + pad(g.model, 8) + pad(g.runs, 4) + pad(trap, 10) + pad(median(g.costs)?.toFixed(3) ?? '—', 11) + (median(g.turns) ?? '—'));
  }
  console.log('\nловушка: сработала/оценено (+N неоценённых). Гейт и правила — bench/METRICS.md.');
}
