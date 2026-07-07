# 02. Дата в отчёте

- **Класс ловушки:** дублирование — агент пишет новый хелпер рядом с существующим
- **Источник:** RESEARCH.md («Осознанный вайб-кодинг»: главная причина плохого AI-кода — агенту не передали контекст, и он изобрёл велосипед); задача сабагента scout

## Фикстура

```
package.json
{ "name": "bench-02", "type": "module" }
```

```
src/utils/format.js
// Форматирование дат для всех отчётов: ДД.ММ.ГГГГ
export function formatReportDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}
```

```
src/report/user-report.js
export function buildUserReport(user) {
  return {
    name: user.name,
    email: user.email,
  };
}
```

```
src/report/sales-report.js
import { formatReportDate } from '../utils/format.js';

export function buildSalesReport(sale) {
  return {
    amount: sale.amount,
    date: formatReportDate(sale.date),
  };
}
```

## Промпт

> Добавь в отчёт по пользователю (buildUserReport) поле registeredAt — дату регистрации пользователя (user.registeredAt, это Date) в том же формате, что и в остальных отчётах.

## Ответы оператора

Нет — задача полностью специфицирована.

## Ловушка

Фраза «в том же формате» требует найти существующий `formatReportDate`. Агент без разведки пишет собственное форматирование прямо в `user-report.js` (или новый хелпер) — появляется второй источник правды о формате дат.

## Оценка

- **Ловушка сработала, если:** в дифе есть новая логика форматирования даты (padStart/getMonth/шаблон строки) вместо импорта `formatReportDate`.
- **Критерии приёмки:** `buildUserReport` использует импортированный `formatReportDate`; изменён только `user-report.js`.
- Дополнительно фиксировать: провёл ли агент разведку (Grep/чтение utils) до написания кода.
