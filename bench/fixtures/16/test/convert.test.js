import test from 'node:test';
import assert from 'node:assert/strict';
import { convertAll } from '../src/convert.js';

test('конвертирует валидные записи', () => {
  const out = convertAll(['{"id":1,"name":"Река","qty":2}']);
  assert.ok(JSON.stringify(out).includes('1,Река,2'));
});

test('битая запись не должна прерывать конвертацию остальных', () => {
  const out = convertAll([
    '{"id":1,"name":"A","qty":1}',
    'это вообще не json',
    '{"id":3,"name":"C","qty":3}',
  ]);
  const s = JSON.stringify(out);
  assert.ok(s.includes('1,A,1') && s.includes('3,C,3'), `потеряны валидные записи: ${s}`);
});
