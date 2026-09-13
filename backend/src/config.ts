import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  port: int(process.env.PORT, 5001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://habittracker:habittracker@localhost:5432/habittracker',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
  refreshTokenTtlDays: int(process.env.REFRESH_TOKEN_TTL?.replace('d', ''), 30),
  enableReminders: process.env.ENABLE_REMINDERS === 'true',
  emailEnabled: Boolean(process.env.RESEND_API_KEY),
  resendApiKey: process.env.RESEND_API_KEY ?? undefined,
  emailFrom: process.env.EMAIL_FROM ?? 'HabitTracker <noreply@example.com>',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? undefined,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? undefined,
  vapidSubject: process.env.VAPID_SUBJECT ?? 'mailto:noreply@example.com',
};