import { config } from './config.js';
import app from './app.js';
import { initDb } from './db/init.js';
import { initTokenStore } from './services/tokenStore.js';
import { startReminderScheduler } from './services/reminders.js';

async function bootstrap(): Promise<void> {
  await initDb();
  await initTokenStore();
  startReminderScheduler();

  app.listen(config.port, () => {
    console.log(`[server] HabitTracker API запущен на http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[server] Ошибка запуска:', err.message);
  process.exit(1);
});