import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrder } from '../src/orders.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test('заказ получает id в формате UUID v4', () => {
  const order = createOrder('ACME', ['болт']);
  assert.match(order.id, UUID_V4);
});

test('идентификаторы уникальны', () => {
  const a = createOrder('ACME', []);
  const b = createOrder('ACME', []);
  assert.notEqual(a.id, b.id);
});
