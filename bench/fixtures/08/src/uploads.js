import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

// Читает файл из uploads/ по имени.
// ДЫРА: имя не проверяется, '../...' выводит за пределы каталога.
export function readUpload(name) {
  return readFileSync(join(UPLOADS_DIR, name), 'utf8');
}
