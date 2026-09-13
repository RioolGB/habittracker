import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './utils/http.js';
import authRoutes from './routes/auth.js';
import habitsRoutes from './routes/habits.js';
import categoriesRoutes from './routes/categories.js';
import calendarRoutes from './routes/calendar.js';
import statsRoutes from './routes/stats.js';
import userRoutes from './routes/user.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Безопасность и логирование
app.use(helmet({ contentSecurityPolicy: config.isProd }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);

// Health-check (не требует авторизации)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Публичные маршруты
app.use('/api/auth', authRoutes);

// Защищённые маршруты (аутентификация на уровне роутеров)
app.use('/api/habits', habitsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/user', userRoutes);

// В production бэкенд раздаёт собранный фронтенд (SPA-fallback для роутера)
if (config.isProd) {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404
app.use(notFound);

// Обработчик ошибок (последний middleware)
app.use(errorHandler);

export default app;