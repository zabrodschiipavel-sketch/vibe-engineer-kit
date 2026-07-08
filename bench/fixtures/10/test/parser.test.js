import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLine } from '../src/parser.js';

test('простые поля без кавычек', () => {
  assert.deepEqual(parseLine('Петров,Казань,555-01'), ['Петров', 'Казань', '555-01']);
});

test('поле в кавычках с запятой внутри', () => {
  assert.deepEqual(parseLine('"Иванов, Иван",Москва,555-02'), ['Иванов, Иван', 'Москва', '555-02']);
});

test('экранированная кавычка внутри поля', () => {
  assert.deepEqual(parseLine('"ООО ""Ромашка""",Тверь,555-03'), ['ООО "Ромашка"', 'Тверь', '555-03']);
});

test('пустые поля сохраняются', () => {
  assert.deepEqual(parseLine('Сидоров,,555-04'), ['Сидоров', '', '555-04']);
});
