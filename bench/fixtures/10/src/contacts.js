import { parseLine } from './parser.js';

// Импорт контактов из CSV-выгрузки: имя, город, телефон.
export function importContact(csvLine) {
  const [name, city, phone] = parseLine(csvLine);
  return { name, city, phone };
}
