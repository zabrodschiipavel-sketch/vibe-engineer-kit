// Рассылает уведомление всем получателям через переданную функцию send.
export async function notifyAll(recipients, send) {
  for (const recipient of recipients) {
    await send(recipient);
  }
}
