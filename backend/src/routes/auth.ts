import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db/pool.js';
import type { UserRow } from '../types.js';
import { toPublicUser } from '../types.js';
import { authenticate, signAccessToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { config } from '../config.js';
import { sendEmail } from '../services/email.js';
import {
  generateRefreshToken,
  revokeRefreshToken,
  resolveRefreshToken,
  saveRefreshToken,
} from '../services/tokenStore.js';

const router = Router();

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Логин должен быть не короче 3 символов')
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Логин может содержать только буквы, цифры, точки, дефисы и подчёркивания'),
  email: z.string().email('Некорректный email').max(255),
  password: z.string().min(6, 'Пароль должен быть не короче 6 символов').max(128),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Пароли не совпадают',
  path: ['confirm'],
});

const loginSchema = z.object({
  login: z.string().min(1, 'Введите логин или email').max(255),
  password: z.string().min(1, 'Введите пароль').max(128),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });
const logoutSchema = z.object({ refreshToken: z.string().min(1) });

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Пароль должен быть не короче 6 символов').max(128),
});

async function issueTokens(userId: string) {
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(refreshToken, userId);
  return { accessToken: signAccessToken(userId), refreshToken };
}

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const existing = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [
      username,
      email,
    ]);
    if (existing.rows.length > 0) {
      throw new HttpError(409, 'Пользователь с таким логином или email уже существует');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await query<UserRow>(
      `INSERT INTO users (username, email, password_hash, name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [username, email, passwordHash, username],
    );
    const user = rows[0];
    const tokens = await issueTokens(user.id);

    if (config.enableReminders) {
      void sendEmail({
        to: user.email,
        subject: 'Добро пожаловать в HabitTracker!',
        text: `Привет, ${user.username}! Спасибо, что зарегистрировались. Начните выстраивать свои привычки.`,
      });
    }

    res.status(201).json({ user: toPublicUser(user), ...tokens });
  }),
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { login, password } = req.body;

    const { rows } = await query<UserRow>(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [login],
    );
    const user = rows[0];
    if (!user) throw new HttpError(401, 'Неверный логин или пароль');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new HttpError(401, 'Неверный логин или пароль');

    const tokens = await issueTokens(user.id);
    res.json({ user: toPublicUser(user), ...tokens });
  }),
);

router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const userId = await resolveRefreshToken(refreshToken);
    if (!userId) throw new HttpError(401, 'Сессия истекла, войдите заново');

    const { rows } = await query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) throw new HttpError(401, 'Пользователь не найден');

    await revokeRefreshToken(refreshToken);
    const tokens = await issueTokens(userId);
    res.json({ user: toPublicUser(rows[0]), ...tokens });
  }),
);

router.post(
  '/logout',
  validate(logoutSchema),
  asyncHandler(async (req, res) => {
    await revokeRefreshToken(req.body.refreshToken);
    res.json({ ok: true });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { rows } = await query<UserRow>('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) throw new HttpError(404, 'Пользователь не найден');
    res.json({ user: toPublicUser(rows[0]) });
  }),
);

router.post(
  '/forgot-password',
  validate(forgotSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const { rows } = await query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      // Не раскрываем, существует ли пользователь
      res.json({ message: 'Если email зарегистрирован, инструкция отправлена' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [
      resetToken,
      expires,
      rows[0].id,
    ]);

    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Восстановление пароля HabitTracker',
      text: `Здравствуйте! Для восстановления пароля перейдите по ссылке: ${resetUrl}\nСсылка действует 1 час.`,
    });

    res.json({
      message: 'Если email зарегистрирован, инструкция отправлена',
      // dev: ссылка для тестирования без реального email-сервиса
      devResetUrl: config.emailEnabled ? undefined : resetUrl,
    });
  }),
);

router.post(
  '/reset-password',
  validate(resetSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const { rows } = await query<UserRow>(
      'SELECT * FROM users WHERE reset_token = $1',
      [token],
    );
    const user = rows[0];
    if (!user || !user.reset_token_expires || user.reset_token_expires < new Date()) {
      throw new HttpError(400, 'Ссылка недействительна или истекла');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [
      passwordHash,
      user.id,
    ]);
    res.json({ message: 'Пароль успешно изменён' });
  }),
);

export default router;