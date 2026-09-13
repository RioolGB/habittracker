import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import type { CategoryRow, HabitEntryRow, HabitRow } from '../types.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { isValidDateString, todayStr } from '../utils/date.js';
import {
  bestStreak,
  buildScheduledDays,
  currentStreak,
  monthSkips,
  windowStats,
} from '../services/statistics.js';

const router = Router();
router.use(authenticate);

const habitSchema = z
  .object({
    name: z.string().min(1, 'Введите название привычки').max(120),
    icon: z.string().min(1).max(50).default('star'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Некорректный цвет').default('#8b5cf6'),
    categoryId: z.string().uuid().nullable().optional(),
    type: z.enum(['binary', 'numeric']).default('binary'),
    frequency: z.enum(['daily', 'weekly']).default('daily'),
    daysOfWeek: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'Выберите хотя бы один день недели')
      .max(7)
      .default([1, 2, 3, 4, 5, 6, 7]),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Некорректное время')
      .nullable()
      .optional()
      .default(null),
    unit: z.string().max(30).nullable().optional().default(null),
    dailyGoal: z.number().nonnegative().nullable().optional().default(null),
    conversionAmount: z.number().positive().nullable().optional().default(null),
    conversionUnit: z.string().max(30).nullable().optional().default(null),
    conversionComment: z.string().max(200).nullable().optional().default(null),
    skipLimit: z.number().int().min(0).max(31).default(3),
  })
  .refine((d) => {
    if (d.type !== 'numeric') return true;
    return d.unit != null && d.dailyGoal != null;
  }, {
    path: ['type'],
    message: 'Для количественной привычки укажите единицу измерения и цель на день',
  });

type HabitInput = z.infer<typeof habitSchema>;

async function getCategoryMap(userId: string): Promise<Map<string, CategoryRow>> {
  const { rows } = await query<CategoryRow>(
    'SELECT * FROM categories WHERE is_global = TRUE OR user_id = $1',
    [userId],
  );
  return new Map(rows.map((r) => [r.id, r]));
}

function serialize(
  habit: HabitRow,
  categoryMap: Map<string, CategoryRow>,
  stats?: Record<string, unknown>,
) {
  const category = habit.category_id ? categoryMap.get(habit.category_id) ?? null : null;
  return {
    id: habit.id,
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    type: habit.type,
    frequency: habit.frequency,
    daysOfWeek: habit.days_of_week,
    reminderTime: habit.reminder_time,
    unit: habit.unit,
    dailyGoal: habit.daily_goal,
    conversionAmount: habit.conversion_amount,
    conversionUnit: habit.conversion_unit,
    conversionComment: habit.conversion_comment,
    skipLimit: habit.skip_limit,
    isArchived: habit.is_archived,
    createdAt: habit.created_at,
    category: category
      ? {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          isGlobal: category.is_global,
        }
      : null,
    ...stats,
  };
}

const entrySchema = z
  .object({
    date: z.string().default(todayStr).refine(isValidDateString, 'Некорректная дата'),
    completed: z.boolean().optional(),
    value: z.number().nonnegative().nullable().optional(),
  })
  .refine((d) => typeof d.completed === 'boolean' || typeof d.value === 'number', {
    message: 'Укажите completed или value',
  });

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const archiveFilter = req.query.archived;
    let filter = 'is_archived = FALSE';
    const params: unknown[] = [req.user.id];
    if (archiveFilter === 'all') filter = 'TRUE';
    else if (archiveFilter === 'archived') filter = 'is_archived = TRUE';

    const { rows } = await query<HabitRow>(
      `SELECT * FROM habits WHERE user_id = $1 AND ${filter} ORDER BY created_at ASC`,
      params,
    );

    const categoryMap = await getCategoryMap(req.user.id);
    const today = todayStr();

    const result = await Promise.all(
      rows.map(async (habit) => {
        const entries = await loadEntries(habit.id);
        const scheduled = buildScheduledDays(habit, entries, today, 120);
        const skips = monthSkips(scheduled, today, habit.skip_limit);
        const week = windowStats(scheduled, today, 7);
        const last30 = windowStats(scheduled, today, 30);
        const stats = {
          currentStreak: currentStreak(scheduled, today, habit.skip_limit),
          bestStreak: bestStreak(scheduled, habit.skip_limit),
          monthSkips: skips.skips,
          remainingSkips: skips.remaining,
          monthScheduled: skips.scheduledDays,
          monthExhausted: skips.exhausted,
          weekDone: week.done,
          weekTotal: week.total,
          percent30: last30.percent,
        };
        return serialize(habit, categoryMap, stats as Record<string, unknown>);
      }),
    );

    res.json({ habits: result });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query<HabitRow>(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );
    if (rows.length === 0) throw new HttpError(404, 'Привычка не найдена');
    const categoryMap = await getCategoryMap(req.user.id);
    res.json({ habit: serialize(rows[0], categoryMap) });
  }),
);

router.post(
  '/',
  validate(habitSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as HabitInput;

    if (body.categoryId) {
      const cat = await query('SELECT * FROM categories WHERE id = $1', [body.categoryId]);
      const c = cat.rows[0] as CategoryRow | undefined;
      if (!c || (c.user_id !== req.user.id && !c.is_global)) {
        throw new HttpError(400, 'Категория не существует');
      }
    }

    const reminder = body.reminderTime ?? null;
    const { rows } = await query<HabitRow>(
      `INSERT INTO habits (
        user_id, category_id, name, icon, color, type, frequency, days_of_week,
        reminder_time, unit, daily_goal, conversion_amount, conversion_unit,
        conversion_comment, skip_limit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        req.user.id,
        body.categoryId ?? null,
        body.name,
        body.icon,
        body.color,
        body.type,
        body.frequency,
        body.daysOfWeek,
        reminder,
        body.unit ?? null,
        body.type === 'numeric' ? body.dailyGoal ?? null : null,
        body.conversionAmount ?? null,
        body.conversionUnit ?? null,
        body.conversionComment ?? null,
        body.skipLimit,
      ],
    );
    const categoryMap = await getCategoryMap(req.user.id);
    res.status(201).json({ habit: serialize(rows[0], categoryMap) });
  }),
);

router.put(
  '/:id',
  validate(habitSchema),
  asyncHandler(async (req, res) => {
    const existing = await query<HabitRow>(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );
    if (existing.rows.length === 0) throw new HttpError(404, 'Привычка не найдена');

    const body = req.body as HabitInput;
    if (body.categoryId) {
      const cat = await query('SELECT * FROM categories WHERE id = $1', [body.categoryId]);
      const c = cat.rows[0] as CategoryRow | undefined;
      if (!c || (c.user_id !== req.user.id && !c.is_global)) {
        throw new HttpError(400, 'Категория не существует');
      }
    }

    const { rows } = await query<HabitRow>(
      `UPDATE habits SET
        category_id = $1, name = $2, icon = $3, color = $4, type = $5,
        frequency = $6, days_of_week = $7, reminder_time = $8, unit = $9,
        daily_goal = $10, conversion_amount = $11, conversion_unit = $12,
        conversion_comment = $13, skip_limit = $14, updated_at = now()
       WHERE id = $15 RETURNING *`,
      [
        body.categoryId ?? null,
        body.name,
        body.icon,
        body.color,
        body.type,
        body.frequency,
        body.daysOfWeek,
        body.reminderTime ?? null,
        body.type === 'numeric' ? body.unit ?? null : null,
        body.type === 'numeric' ? body.dailyGoal ?? null : null,
        body.conversionAmount ?? null,
        body.conversionUnit ?? null,
        body.conversionComment ?? null,
        body.skipLimit,
        req.params.id,
      ],
    );
    const categoryMap = await getCategoryMap(req.user.id);
    res.json({ habit: serialize(rows[0], categoryMap) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await query(
      'DELETE FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0) throw new HttpError(404, 'Привычка не найдена');
    res.json({ ok: true });
  }),
);

router.post(
  '/:id/archive',
  asyncHandler(async (req, res) => {
    const result = await query(
      'UPDATE habits SET is_archived = TRUE, updated_at = now() WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0) throw new HttpError(404, 'Привычка не найдена');
    res.json({ ok: true });
  }),
);

router.post(
  '/:id/unarchive',
  asyncHandler(async (req, res) => {
    const result = await query(
      'UPDATE habits SET is_archived = FALSE, updated_at = now() WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0) throw new HttpError(404, 'Привычка не найдена');
    res.json({ ok: true });
  }),
);

async function loadEntries(habitId: string): Promise<HabitEntryRow[]> {
  const { rows } = await query<HabitEntryRow>(
    'SELECT * FROM habit_entries WHERE habit_id = $1 ORDER BY date ASC',
    [habitId],
  );
  return rows;
}

router.get(
  '/:id/history',
  asyncHandler(async (req, res) => {
    const from = typeof req.query.from === 'string' && isValidDateString(req.query.from) ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' && isValidDateString(req.query.to) ? req.query.to : undefined;

    const existing = await query('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (existing.rows.length === 0) throw new HttpError(404, 'Привычка не найдена');

    let sql = 'SELECT * FROM habit_entries WHERE habit_id = $1';
    const params: unknown[] = [req.params.id, req.user.id];
    if (from) {
      params.push(from);
      sql += ' AND date >= $' + params.length;
    }
    if (to) {
      params.push(to);
      sql += ' AND date <= $' + params.length;
    }
    sql += ' ORDER BY date ASC';
    const { rows } = await query<HabitEntryRow>(sql, params);
    res.json({ entries: rows });
  }),
);

router.post(
  '/:id/entries',
  validate(entrySchema),
  asyncHandler(async (req, res) => {
    const existing = await query<HabitRow>(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );
    const habit = existing.rows[0];
    if (!habit) throw new HttpError(404, 'Привычка не найдена');

    const { date, completed, value } = req.body;

    let finalCompleted: boolean;
    let finalValue: number | null = null;

    if (habit.type === 'binary') {
      finalCompleted = Boolean(completed);
    } else {
      finalValue = typeof value === 'number' ? value : 0;
      finalCompleted = typeof completed === 'boolean' ? completed : finalValue > 0;
    }

    // Удаляем старую запись, чтобы upsert не конфликтовал
    await query('DELETE FROM habit_entries WHERE habit_id = $1 AND date = $2', [
      habit.id,
      date,
    ]);

    if (finalCompleted) {
      await query(
        `INSERT INTO habit_entries (habit_id, date, value, completed)
         VALUES ($1, $2, $3, TRUE)`,
        [habit.id, date, finalValue],
      );
    }

    const { rows } = await query<HabitEntryRow>(
      'SELECT * FROM habit_entries WHERE habit_id = $1 AND date = $2',
      [habit.id, date],
    );
    res.json({ entry: rows[0] ?? null });
  }),
);

router.delete(
  '/:id/entries/:date',
  asyncHandler(async (req, res) => {
    if (!isValidDateString(req.params.date)) throw new HttpError(400, 'Некорректная дата');
    const existing = await query('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (existing.rows.length === 0) throw new HttpError(404, 'Привычка не найдена');

    await query('DELETE FROM habit_entries WHERE habit_id = $1 AND date = $2', [
      req.params.id,
      req.params.date,
    ]);
    res.json({ ok: true });
  }),
);

export default router;