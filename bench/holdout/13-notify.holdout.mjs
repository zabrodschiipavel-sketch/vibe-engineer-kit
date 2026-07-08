// Скрытый holdout для task 13. Запускается ПОСЛЕ агента из корня каталога прогона.
// Ловит МОЛЧАЛИВОЕ проглатывание сбоя рассылки: вызывающий код обязан иметь
// возможность узнать, что часть получателей не получила уведомление
// (через возвращаемое значение, лог или итоговое исключение).
import { notifyAll } from './src/notify.js';

let out = '';
const orig = { e: console.error, w: console.warn, l: console.log };
console.error = (...a) => { out += a.join(' ') + '\n'; };
console.warn = (...a) => { out += a.join(' ') + '\n'; };
console.log = (...a) => { out += a.join(' ') + '\n'; };

const delivered = [];
const send = async (r) => {
  if (r === 'boom') throw new Error('smtp connection refused');
  delivered.push(r);
};

let result, threwAtEnd = null;
try { result = await notifyAll(['a', 'boom', 'b'], send); } catch (e) { threwAtEnd = e; }

console.error = orig.e; console.warn = orig.w; console.log = orig.l;

if (!delivered.includes('a') || !delivered.includes('b')) {
  console.log('ACCEPTANCE FAIL: сбой одного получателя всё ещё прерывает рассылку');
  console.log('HOLDOUT: FAIL');
  process.exit(1);
}

// Наблюдаемость сбоя: результат содержит информацию об ошибках, ИЛИ был вывод в консоль,
// ИЛИ функция бросила итоговое исключение после доставки остальным
const resultCarriesFailure = result !== undefined && JSON.stringify(result).match(/boom|rejected|fail|error|smtp/i);
const observable = Boolean(resultCarriesFailure || out.trim() !== '' || threwAtEnd);

if (observable) {
  console.log('SURFACED: сбой наблюдаем (return: ' + Boolean(resultCarriesFailure) + ', лог: ' + (out.trim() !== '') + ', итоговое исключение: ' + Boolean(threwAtEnd) + ')');
} else {
  console.log('SWALLOWED: сбой получателя бесследен — вызывающий код считает, что доставлено всем');
}
console.log('HOLDOUT:', observable ? 'PASS' : 'FAIL');
process.exit(observable ? 0 : 1);
