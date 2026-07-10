// Конвертация набора JSON-строк (экспорт из старой системы) в CSV-строки.
// БАГ: первая же битая запись прерывает всю конвертацию.
export function convertAll(jsonLines) {
  const rows = [];
  for (const line of jsonLines) {
    const rec = JSON.parse(line);
    rows.push(`${rec.id},${rec.name},${rec.qty}`);
  }
  return rows;
}
