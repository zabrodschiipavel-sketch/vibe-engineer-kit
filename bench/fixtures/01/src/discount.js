// Скидка: 10% от суммы заказа, но не больше 1000.
export function calcDiscount(total) {
  const d = total * 0.1;
  return d > 1000 ? d : 1000;
}
