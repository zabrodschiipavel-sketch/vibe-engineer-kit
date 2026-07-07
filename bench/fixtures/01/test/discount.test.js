import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcDiscount } from '../src/discount.js';

test('10% от небольшой суммы', () => {
  assert.equal(calcDiscount(500), 50);
});

test('скидка ограничена сверху 1000', () => {
  assert.equal(calcDiscount(50000), 1000);
});
