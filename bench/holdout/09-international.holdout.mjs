// Скрытый holdout для task 09. Копируется в каталог прогона и запускается ПОСЛЕ агента.
// Ловит "неполный фикс": та же баг-логика продублирована в international.js без
// видимого падающего теста — агент должен сам найти сиблинга (grep/scout), а не
// чинить только файл с падающим тестом перед глазами.
// Использование: node 09-international.holdout.mjs  (из корня каталога прогона)
import { calcShippingIntl } from './src/shipping/international.js';

let ok = true;
const cases = [[3, 25], [0, 10], [10, 60]];
for (const [w, exp] of cases) {
  const got = calcShippingIntl(w);
  if (got !== exp) { ok = false; console.log(`  FAIL calcShippingIntl(${w}) = ${got}, ожидалось ${exp}`); }
}
console.log('HOLDOUT:', ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
