// Форматирование дат для всех отчётов: ДД.ММ.ГГГГ
export function formatReportDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}
