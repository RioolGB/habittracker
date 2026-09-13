import webpush from 'web-push';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { todayStr } from '../utils/date.js';
import { sendEmail } from './email.js';
import type { HabitRow, HabitEntryRow } from '../types.js';

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

let pushReady = false;

function initPush(): void {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    console.warn('[reminders] VAPID-ключи не заданы — push-уведомления отключены');
    return;
  }
  webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);
  pushReady = true;
}

async function sendPush(userId: string, title: string, body: string): Promise<void> {
  if (!pushReady) return;
  const { rows } = await query<SubscriptionRow>(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
    [userId],
  );
  for (const sub of rows) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body }),
      );
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
      }
    }
  }
}

// Исключаем повторную отправку за день (in-memory)
const notified: Record<string, string> = {}; // habitId -> дата последнего напоминания

export async function runReminderCheck(): Promise<void> {
  if (!config.enableReminders) return;
  if (!pushReady) initPush();

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const date = todayStr();

  const { rows } = await query<HabitRow>(
    `SELECT * FROM habits
     WHERE is_archived = FALSE
       AND reminder_time IS NOT NULL
       AND to_char(reminder_time, 'HH24:MI') = $1`,
    [time],
  );

  for (const habit of rows) {
    if (notified[habit.id] === date) continue;

    // Пропускаем, если привычка уже выполнена сегодня
    const entry = await query<HabitEntryRow>(
      'SELECT * FROM habit_entries WHERE habit_id = $1 AND date = $2',
      [habit.id, date],
    );
    if (entry.rows[0]?.completed) continue;

    notified[habit.id] = date;

    const user = await query<{ email: string | null; id: string; email_enabled: boolean; push_enabled: boolean }>(
      'SELECT id, email, email_enabled, push_enabled FROM users WHERE id = $1',
      [habit.user_id],
    );
    const u = user.rows[0];
    if (!u) continue;

    const message = `Напомним: “${habit.name}” — не забудьте отметить выполнение.`;

    if (u.push_enabled) await sendPush(u.id, 'Пора выполнить привычку', message);
    if (u.email_enabled && u.email) {
      await sendEmail({
        to: u.email,
        subject: `Напоминание: ${habit.name}`,
        text: message,
      });
    }
  }
}

export function startReminderScheduler(): void {
  if (!config.enableReminders) {
    console.log('[reminders] Планировщик выключен (ENABLE_REMINDERS=false)');
    return;
  }
  initPush();
  void runReminderCheck();
  setInterval(() => {
    void runReminderCheck().catch((err) => console.error('[reminders]', err.message));
  }, 60_000);
  console.log('[reminders] Планировщик запущен');
}