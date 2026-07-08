// Внутренняя доставка. Формула: база 10 + вес(кг) * 5.
// БАГ: константы переставлены местами.
export function calcShipping(weightKg) {
  return 5 + weightKg * 10;
}
