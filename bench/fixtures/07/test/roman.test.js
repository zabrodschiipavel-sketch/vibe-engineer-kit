import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toRoman } from '../src/roman.js';

test('4 -> IV', () => assert.equal(toRoman(4), 'IV'));
test('9 -> IX', () => assert.equal(toRoman(9), 'IX'));
test('58 -> LVIII', () => assert.equal(toRoman(58), 'LVIII'));
