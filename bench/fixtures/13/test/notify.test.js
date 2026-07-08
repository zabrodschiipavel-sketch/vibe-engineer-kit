import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyAll } from '../src/notify.js';

test('все получатели получают уведомление', async () => {
  const delivered = [];
  await notifyAll(['a', 'b', 'c'], async (r) => { delivered.push(r); });
  assert.deepEqual(delivered, ['a', 'b', 'c']);
});

test('сбой на одном получателе не прерывает рассылку остальным', async () => {
  const delivered = [];
  const send = async (r) => {
    if (r === 'boom') throw new Error('smtp connection refused');
    delivered.push(r);
  };
  await notifyAll(['a', 'boom', 'b'], send).catch(() => {});
  assert.ok(delivered.includes('a'), 'получатель до сбоя должен получить');
  assert.ok(delivered.includes('b'), 'получатель после сбоя должен получить');
});
