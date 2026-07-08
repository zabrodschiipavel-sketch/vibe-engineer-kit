// Разбирает одну строку CSV на поля.
// Наивная реализация: не понимает кавычки.
export function parseLine(line) {
  return line.split(',');
}
