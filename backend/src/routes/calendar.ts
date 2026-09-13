import { Router } from 'express';
import { query } from '../db/pool.js';
import type { CategoryRow, HabitEntryRow, HabitRow } from '../types.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { daysBetween, isValidDateString, isoDow } from '../utils/date.js';
import { isScheduled } from '../services/statistics.js';

const router = Router();
router.use(authenticate);

function monthRange(month: string): { from: string; to: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (m < 1 || m > 12) return null;
  const from = `${match[1]}-${match[2]}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${match[1]}-${match[2]}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    const range = month ? monthRange(month) : null;
    if (!range) {
      const now = new Date();
      const nowMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const fallback = monthRange(nowMonth)!;
      return render(res, req.user.id, fallback.from, fallback.to);
    }
    return render(res, req.user.id, range.from, range.to);
  }),
);

async function getDailyAggregation(userId: string, from: string, to: string, withDetails: boolean) {
  const { rows: habits } = await query<HabitRow>(
    'SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at ASC',
    [userId],
  );
  const { rows: entries } = await query<HabitEntryRow>(
    `SELECT * FROM habit_entries WHERE habit_id IN (
       SELECT id FROM habits WHERE user_id = $1
     ) AND date BETWEEN $2 AND $3`,
    [userId, from, to],
  );
  const categoryRows = await query<CategoryRow>(
    'SELECT * FROM categories WHERE is_global = TRUE OR user_id = $1',
    [userId],
  );
  const categories = new Map(categoryRows.rows.map((c) => [c.id, c]));

  const entriesByHabit = new Map<string, HabitEntryRow[]>();
  for (const e of entries) {
    const list = entriesByHabit.get(e.habit_id) ?? [];
    list.push(e);
    entriesByHabit.set(e.habit_id, list);
  }
  const entriesByDate = new Map<string, HabitEntryRow>();
  for (const e of entries) entriesByDate.set(`${e.habit_id}|${e.date}`, e);

  return { habits, entriesByHabit, entriesByDate, categories };
}

async function render(res: import('express').Response, userId: string, from: string, to: string) {
  const { habits, entriesByDate } = await getDailyAggregation(userId, from, to, false);

  const days = daysBetween(from, to).map((date) => {
    let total = 0;
    let done = 0;
    for (const habit of habits) {
      if (!isScheduled(habit, date)) continue;
      total++;
      if (entriesByDate.get(`${habit.id}|${date}`)?.completed) done++;
    }
    let status: 'full' | 'partial' | 'empty' | 'none' = 'none';
    if (total > 0) {
      if (done === total) status = 'full';
      else if (done > 0) status = 'partial';
      else status = 'empty';
    }
    return { date, scheduled: total, done, status };
  });

  res.json({ from, to, days });
}

router.get(
  '/:date',
  asyncHandler(async (req, res) => {
    const date = req.params.date;
    if (!isValidDateString(date)) throw new HttpError(400, 'Некорректная дата');
    const { habits, entriesByDate, categories } = await getDailyAggregation(
      req.user.id,
      date,
      date,
      true,
    );

    const items = habits.map((habit) => {
      const entry = entriesByDate.get(`${habit.id}|${date}`);
      const scheduled = isScheduled(habit, date);
      const category = habit.category_id ? categories.get(habit.category_id) : undefined;
      return {
        habit: {
          id: habit.id,
          name: habit.name,
          icon: habit.icon,
          color: habit.color,
          type: habit.type,
          unit: habit.unit,
          dailyGoal: habit.daily_goal,
          reminderTime: habit.reminder_time,
          isArchived: habit.is_archived,
          category: category
            ? { id: category.id, name: category.name, icon: category.icon, color: category.color }
            : null,
        },
        scheduled,
        completed: entry?.completed ?? false,
        value: entry?.value ?? null,
      };
    });

    res.json({ date, items });
  }),
);

export default router;