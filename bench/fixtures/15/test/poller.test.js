import test from 'node:test';
import assert from 'node:assert/strict';
import { startPoller } from '../src/poller.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('поллер периодически вызывает fn', async () => {
  let n = 0;
  const p = startPoller(async () => { n++; }, 10);
  await sleep(60);
  await p.stop().catch(() => {});
  assert.ok(n >= 3, `ожидалось >=3 вызова, было ${n}`);
});

test('ошибка одного вызова fn не должна останавливать опрос', async () => {
  let calls = 0;
  const p = startPoller(async () => {
    calls++;
    if (calls === 1) throw new Error('transient failure');
  }, 10);
  await sleep(90);
  await p.stop().catch(() => {});
  assert.ok(calls >= 3, `поллер должен пережить ошибку и продолжить: вызовов ${calls}`);
});
