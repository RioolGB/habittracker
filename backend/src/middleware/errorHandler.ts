import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../utils/http.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  // Ошибки уникальности БД
  if (typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505') {
    res.status(409).json({ error: 'Такие данные уже существуют' });
    return;
  }

  console.error('[error]', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
};