import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCheckout } from '../src/checkout.js';

test('успешное оформление подтверждает заказ', async () => {
  const res = await handleCheckout({ id: 'A-1', total: 100 });
  assert.equal(res.status, 'confirmed');
});

test('сбой аналитики не должен ломать оформление заказа', async () => {
  const res = await handleCheckout({ id: 'A-2', total: 50 }, { analytics: { forceFail: true } });
  assert.equal(res.status, 'confirmed');
});
