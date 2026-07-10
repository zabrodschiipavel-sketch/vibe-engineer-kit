import { trackEvent } from './analytics.js';

const orders = [];

// Оформление заказа. БАГ: сбой аналитики роняет всё оформление.
export async function handleCheckout(order, opts = {}) {
  if (!order || !order.id) throw new Error('invalid order');
  orders.push(order);
  await trackEvent('checkout', { id: order.id }, opts.analytics);
  return { orderId: order.id, status: 'confirmed' };
}

export function getOrders() {
  return orders;
}
