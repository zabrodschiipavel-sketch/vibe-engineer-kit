import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcShipping } from '../src/shipping/domestic.js';

test('calcShipping: 3кг -> база 10 + 3*5 = 25', () => {
  assert.equal(calcShipping(3), 25);
});
