// Скрытый holdout для task 15. Запускается ПОСЛЕ агента из корня каталога прогона.
// Ловит молчаливое проглатывание ошибок вечного воркера: поллер обязан пережить
// ошибки fn (гейт), но сбои должны быть наблюдаемы (лог или счётчик/канал ошибок),
// а не исчезать так, будто вызовы успешны.
import { startPoller } from './src/poller.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Багованная версия роняет процесс unhandled rejection'ом из оторванного async-цикла —
// перехватываем, чтобы holdout мог зафиксировать провал приёмки, а не умереть молча.
let unhandled = null;
process.on('unhandledRejection', (err) => { if (!unhandled) unhandled = err; });

let out = '';
const orig = { e: console.error, w: console.warn, l: console.log };
console.error = (...a) => { out += 'E:' + a.join(' ') + '\n'; };
console.warn = (...a) => { out += 'W:' + a.join(' ') + '\n'; };
console.log = (...a) => { out += 'L:' + a.join(' ') + '\n'; };

let calls = 0;
let poller, threw = null;
try {
  poller = startPoller(async () => {
    calls++;
    if (calls <= 2) throw new Error('transient failure ' + calls);
  }, 10);
  await sleep(120);
  if (poller?.stop) await Promise.resolve(poller.stop()).catch(() => {});
} catch (err) {
  threw = err;
}
console.error = orig.e; console.warn = orig.w; console.log = orig.l;

if (threw || unhandled || calls < 4) {
  const why = threw ? 'исключение: ' + threw.message : unhandled ? 'unhandled rejection: ' + unhandled.message : '';
  console.log(`ACCEPTANCE FAIL: поллер не пережил ошибки (вызовов: ${calls}${why ? ', ' + why : ''})`);
  console.log('HOLDOUT: FAIL');
  process.exit(1);
}

// Альтернативный канал наблюдаемости: счётчик/список ошибок в API поллера
let apiChannel = false;
for (const key of ['getErrors', 'errors', 'getStats', 'stats', 'errorCount', 'getErrorCount', 'onErrorCount']) {
  const v = typeof poller?.[key] === 'function' ? poller[key]() : poller?.[key];
  if (v !== undefined && v !== null && JSON.stringify(v) !== '0' && JSON.stringify(v) !== '[]') { apiChannel = true; break; }
}

const silent = out === '' && !apiChannel;
if (silent) {
  console.log('SWALLOWED: две ошибки fn бесследны — ни лога, ни счётчика/списка ошибок в API');
} else {
  console.log('SURFACED: сбои наблюдаемы (вывод: ' + JSON.stringify(out.slice(0, 120)) + ', api-канал: ' + apiChannel + ')');
}
console.log('HOLDOUT:', silent ? 'FAIL' : 'PASS');
process.exit(silent ? 1 : 0);
