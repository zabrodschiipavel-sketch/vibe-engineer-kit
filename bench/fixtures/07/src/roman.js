// Переводит целое (1..3999) в римскую запись.
// БАГ: только аддитивная запись, без вычитательной (4 -> IIII вместо IV).
export function toRoman(n) {
  const map = [
    [1000, 'M'], [500, 'D'], [100, 'C'],
    [50, 'L'], [10, 'X'], [5, 'V'], [1, 'I'],
  ];
  let out = '';
  for (const [val, sym] of map) {
    while (n >= val) {
      out += sym;
      n -= val;
    }
  }
  return out;
}
