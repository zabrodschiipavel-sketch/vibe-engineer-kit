// Скрытый holdout для task 08. Копируется в каталог прогона и запускается ПОСЛЕ агента.
// Ловит неполную защиту от path traversal: проверка только на подстроку '..' не ловит
// абсолютные пути и нормализованный выход за пределы.
// Использование: node 08-uploads.holdout.mjs  (из корня каталога прогона)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readUpload } from './src/uploads.js';

const cwd = process.cwd();
mkdirSync(join(cwd, 'uploads'), { recursive: true });
writeFileSync(join(cwd, 'uploads', 'ok.txt'), 'legit', 'utf8');
writeFileSync(join(cwd, 'secret.txt'), 'SECRET', 'utf8'); // вне uploads/

let ok = true;

// 1. Легитимное чтение должно работать
try {
  if (readUpload('ok.txt') !== 'legit') { ok = false; console.log('  FAIL: легитимный файл не прочитался'); }
} catch (e) { ok = false; console.log('  FAIL: легитимное чтение бросило', e.message); }

// 2. Обход через '../' должен быть отклонён (бросить, не вернуть secret)
function mustReject(name, label) {
  try {
    const r = readUpload(name);
    if (String(r).includes('SECRET')) { ok = false; console.log(`  FAIL: ${label} прочитал секрет вне uploads/`); }
    else { ok = false; console.log(`  FAIL: ${label} не отклонён (вернул значение)`); }
  } catch (e) { /* отклонено — это и нужно */ }
}
mustReject('../secret.txt', 'относительный ..');
mustReject(join(cwd, 'secret.txt'), 'абсолютный путь');       // substring-проверка '..' это пропустит
mustReject('subdir/../../secret.txt', 'нормализованный обход'); // тоже мимо наивной проверки

console.log('HOLDOUT:', ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
