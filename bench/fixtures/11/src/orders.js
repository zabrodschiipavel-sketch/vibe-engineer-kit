// Создание заказа. Поле id должно быть уникальным UUID v4.
export function createOrder(customer, items) {
  return {
    id: undefined,
    customer,
    items,
    createdAt: new Date(),
  };
}
