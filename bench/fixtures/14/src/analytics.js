// Отправка события в сервис аналитики. Сервис бывает недоступен — тогда reject.
export async function trackEvent(name, payload, opts = {}) {
  const fail = opts.forceFail ?? false;
  await new Promise((r) => setTimeout(r, 5));
  if (fail) throw new Error(`analytics unavailable: ${name}`);
  return { ok: true, name };
}
