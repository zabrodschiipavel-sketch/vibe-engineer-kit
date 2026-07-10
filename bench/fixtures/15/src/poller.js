// Периодический опрос: вызывает fn каждые intervalMs.
// БАГ: первая же ошибка fn убивает цикл опроса навсегда.
export function startPoller(fn, intervalMs) {
  let stopped = false;
  let ticks = 0;
  const done = (async () => {
    while (!stopped) {
      await new Promise((r) => setTimeout(r, intervalMs));
      if (stopped) break;
      await fn();
      ticks++;
    }
  })();
  return {
    stop() {
      stopped = true;
      return done;
    },
    getTicks() {
      return ticks;
    },
  };
}
