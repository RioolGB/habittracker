import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db/pool.js';
import type { UserRow } from '../types.js';
import { toPublicUser } from '../types.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();
router.use(authenticate);

const profileSchema = z.object({
  name: z.string().min(1, 'Введите имя').max(100),
  username: z
    .string()
    .min(3, 'Логин должен быть не короче 3 символов')
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Логин может содержать только буквы, цифры, точки, дефисы'),
  email: z.string().email('Некорректный email').max(255),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Введите текущий пароль').max(128),
    newPassword: z.string().min(6, 'Новый пароль должен быть не короче 6 символов').max(128),
    confirm: z.string().min(1, 'Подтвердите новый пароль'),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Пароли не совпадают',
    path: ['confirm'],
  });

const notificationsSchema = z.object({
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
});

const themeSchema = z.object({ theme: z.enum(['dark', 'light']) });

const pushSchema = z.object({
  endpoint: z.string().min(1).max(500),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(500),
});

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const { rows } = await query<UserRow>('SELECT * FROM users WHERE id = $1', [req.user.id]);
    res.json({ user: toPublicUser(rows[0]) });
  }),
);

router.put(
  '/profile',
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const { name, username, email } = req.body;
    try {
      const { rows } = await query<UserRow>(
        `UPDATE users SET name = $1, username = $2, email = $3, updated_at = now()
         WHERE id = $4 RETURNING *`,
        [name, username, email, req.user.id],
      );
      res.json({ user: toPublicUser(rows[0]) });
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        throw new HttpError(409, 'Логин или email уже заняты');
      }
      throw err;
    }
  }),
);

router.post(
  '/password',
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const { rows } = await query<UserRow>('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user) throw new HttpError(404, 'Пользователь не найден');

    const ok = await bcrypt.compare(oldPassword, user.password_hash);
    if (!ok) throw new HttpError(400, 'Текущий пароль неверен');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [
      passwordHash,
      req.user.id,
    ]);
    res.json({ message: 'Пароль изменён' });
  }),
);

router.put(
  '/notifications',
  validate(notificationsSchema),
  asyncHandler(async (req, res) => {
    const { emailEnabled, pushEnabled } = req.body;
    const { rows } = await query<UserRow>(
      `UPDATE users SET email_enabled = $1, push_enabled = $2, updated_at = now()
       WHERE id = $3 RETURNING *`,
      [emailEnabled, pushEnabled, req.user.id],
    );
    res.json({ user: toPublicUser(rows[0]) });
  }),
);

router.put(
  '/theme',
  validate(themeSchema),
  asyncHandler(async (req, res) => {
    const { theme } = req.body;
    await query('UPDATE users SET theme = $1, updated_at = now() WHERE id = $2', [theme, req.user.id]);
    res.json({ theme });
  }),
);

router.post(
  '/push-subscription',
  validate(pushSchema),
  asyncHandler(async (req, res) => {
    const { endpoint, p256dh, auth } = req.body;
    await query('DELETE FROM push_subscriptions WHERE user_id = $1', [req.user.id]);
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, endpoint, p256dh, auth],
    );
    res.status(201).json({ ok: true });
  }),
);

router.delete(
  '/push-subscription',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM push_subscriptions WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  }),
);

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

router.get(
  '/export.csv',
  asyncHandler(async (req, res) => {
    const { rows: habits } = await query<{
      id: string;
      name: string;
      icon: string;
      color: string;
      type: string;
      frequency: string;
      is_archived: boolean;
      created_at: Date;
    }>('SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at ASC', [req.user.id]);
    const { rows: entries } = await query<{
      habit_id: string;
      date: string;
      value: number | null;
      completed: boolean;
    }>(`SELECT * FROM habit_entries WHERE habit_id IN (SELECT id FROM habits WHERE user_id = $1) ORDER BY date ASC`, [req.user.id]);
    const { rows: categories } = await query<{ id: string; name: string }>(
      'SELECT * FROM categories WHERE is_global = TRUE OR user_id = $1',
      [req.user.id],
    );

    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    const lines: string[] = [];
    lines.push(['habits.csv'].join(','));
    lines.push(['id', 'name', 'icon', 'color', 'type', 'frequency', 'archived', 'created_at'].map(csvEscape).join(','));
    for (const h of habits) {
      lines.push([h.id, h.name, h.icon, h.color, h.type, h.frequency, h.is_archived, h.created_at.toISOString()].map(csvEscape).join(','));
    }

    lines.push('');
    lines.push(['entries.csv'].join(','));
    lines.push(['habit_id', 'date', 'value', 'completed'].map(csvEscape).join(','));
    for (const e of entries) {
      lines.push([e.habit_id, e.date, e.value ?? '', e.completed].map(csvEscape).join(','));
    }

    lines.push('');
    lines.push(['categories.csv'].join(','));
    lines.push(['id', 'name'].map(csvEscape).join(','));
    for (const c of categories) lines.push([c.id, c.name].map(csvEscape).join(','));

    lines.push('');
    lines.push(['HabitTracker-экспорт', new Date().toISOString(), `Всего привычек: ${habits.length}`, `Всего записей: ${entries.length}`].map(csvEscape).join(','));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="habittracker-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('\uFEFF' + lines.join('\r\n'));
  }),
);

router.delete(
  '/account',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ ok: true });
  }),
);

export default router;