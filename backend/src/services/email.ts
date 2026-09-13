import { config } from '../config.js';

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Отправка email. При наличии RESEND_API_KEY — через Resend HTTP API,
 * иначе письмо логируется в консоль (режим разработки).
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!config.resendApiKey) {
    console.log('[email] (dev) Письмо не отправлено, провайдер не настроен:');
    console.log(`  to: ${message.to}\n  subject: ${message.subject}\n  body: ${message.text}`);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.resendApiKey}`,
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });
    if (!res.ok) {
      console.error('[email] Ошибка Resend:', res.status, await res.text());
    }
  } catch (err) {
    console.error('[email] Ошибка отправки:', (err as Error).message);
  }
}