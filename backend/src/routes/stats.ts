import { Router } from 'express';
import { query } from '../db/pool.js';
import type { HabitEntryRow, HabitRow } from '../types.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { addDays, monthKey, monthLabel } from '../utils/date.js';
import {
  bestStreak,
  buildScheduledDays,
  conversionInfo,
  currentStreak,
  isScheduled,
  monthSkips,
  windowStats,
} from '../services/statistics.js';

const router = Router();
router.use(authenticate);

router.get(
  '/habits/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query<HabitRow>(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );
    const habit = rows[0];
    if (!habit) throw new HttpError(404, 'Привычка не найдена');

    const { rows: entries } = await query<HabitEntryRow>(
      'SELECT * FROM habit_entries WHERE habit_id = $1 ORDER BY date ASC',
      [habit.id],
    );

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const scheduled = buildScheduledDays(habit, entries, todayStr, 370);
    const last90 = windowStats(scheduled, todayStr, 90);
    const last30 = windowStats(scheduled, todayStr, 30);
    const last7 = windowStats(scheduled, todayStr, 7);
    const skips = monthSkips(scheduled, todayStr, habit.skip_limit);

    const series = buildScheduledDays(habit, entries, todayStr, 120).map((s) => ({
      date: s.date,
      completed: s.completed,
      value: s.value,
    }));

    const totalDone = scheduled.filter((s) => s.completed).length;
    const totalScheduled = scheduled.length;

    res.json({
      habit: {
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        type: habit.type,
        unit: habit.unit,
        dailyGoal: habit.daily_goal,
        skipLimit: habit.skip_limit,
        createdAt: habit.created_at,
      },
      currentStreak: currentStreak(scheduled, todayStr, habit.skip_limit),
      bestStreak: bestStreak(scheduled, habit.skip_limit),
      percent7: last7.percent,
      percent30: last30.percent,
      percent90: last90.percent,
      totalDone,
      totalScheduled,
      monthSkips: skips.skips,
      monthExhausted: skips.exhausted,
      series,
    });
  }),
);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const { rows: habits } = await query<HabitRow>(
      'SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id],
    );
    const { rows: entries } = await query<HabitEntryRow>(
      `SELECT * FROM habit_entries WHERE habit_id IN (
         SELECT id FROM habits WHERE user_id = $1
       ) ORDER BY date ASC`,
      [req.user.id],
    );

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let totalScheduled = 0;
    let totalDone = 0;
    const habitStats: Array<{
      id: string;
      name: string;
      color: string;
      icon: string;
      done: number;
      scheduled: number;
      percent: number;
      missPercent: number;
    }> = [];

    const dayAgg = new Map<string, { done: number; total: number }>();
    const monthAgg = new Map<string, { done: number; total: number }>();

    for (const habit of habits) {
      const habitEntries = entries.filter((e) => e.habit_id === habit.id);
      const scheduledDays = buildScheduledDays(habit, habitEntries, todayStr, 5000);
      const done = scheduledDays.filter((s) => s.completed).length;
      totalScheduled += scheduledDays.length;
      totalDone += done;

      const percent = scheduledDays.length ? Math.round((done / scheduledDays.length) * 100) : 0;
      habitStats.push({
        id: habit.id,
        name: habit.name,
        color: habit.color,
        icon: habit.icon,
        done,
        scheduled: scheduledDays.length,
        percent,
        missPercent: 100 - percent,
      });

      for (const s of scheduledDays) {
        const agg = dayAgg.get(s.date) ?? { done: 0, total: 0 };
        agg.total++;
        if (s.completed) agg.done++;
        dayAgg.set(s.date, agg);

        const mk = monthKey(s.date);
        const m = monthAgg.get(mk) ?? { done: 0, total: 0 };
        m.total++;
        if (s.completed) m.done++;
        monthAgg.set(mk, m);
      }
    }

    const overallPercent = totalScheduled ? Math.round((totalDone / totalScheduled) * 100) : 0;

    const sortedByPercent = [...habitStats].sort((a, b) => b.percent - a.percent);
    const topHabits = sortedByPercent.filter((h) => h.scheduled > 0).slice(0, 3);
    const worstHabits = sortedByPercent
      .filter((h) => h.scheduled > 0 && h.percent < 100)
      .slice()
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 3);

    let bestDay: { date: string; percent: number } | null = null;
    for (const [date, agg] of dayAgg) {
      const p = Math.round((agg.done / agg.total) * 100);
      if (!bestDay || p > bestDay.percent) bestDay = { date, percent: p };
    }

    const weekAgg = new Map<string, { done: number; total: number }>();
    for (const [date, agg] of dayAgg) {
      const d = new Date(date + 'T00:00:00');
      const dow = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - dow);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const w = weekAgg.get(key) ?? { done: 0, total: 0 };
      w.done += agg.done;
      w.total += agg.total;
      weekAgg.set(key, w);
    }
    let bestWeek: { start: string; percent: number } | null = null;
    for (const [start, agg] of weekAgg) {
      const p = Math.round((agg.done / agg.total) * 100);
      if (!bestWeek || p > bestWeek.percent) bestWeek = { start, percent: p };
    }

    let bestMonth: { month: string; percent: number } | null = null;
    for (const [month, agg] of monthAgg) {
      const p = Math.round((agg.done / agg.total) * 100);
      if (!bestMonth || p > bestMonth.percent) bestMonth = { month, percent: p };
    }

    const monthlySeries = [...monthAgg.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, agg]) => ({ month, label: monthLabel(month), done: agg.done, total: agg.total }));

    res.json({
      totalHabits: habits.length,
      totalDone,
      totalScheduled,
      overallPercent,
      topHabits,
      worstHabits,
      bestDay: bestDay ? { date: bestDay.date, percent: bestDay.percent } : null,
      bestWeek: bestWeek ? { start: bestWeek.start, percent: bestWeek.percent } : null,
      bestMonth: bestMonth
        ? { month: bestMonth.month, percent: bestMonth.percent, label: monthLabel(bestMonth.month) }
        : null,
      monthlySeries,
    });
  }),
);

// Данные для дашборда: приветствие, прогресс, мотивация, конверсии
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const { rows: users } = await query<{ id: string; name: string }>(
      'SELECT id, name FROM users WHERE id = $1',
      [req.user.id],
    );
    const name = users[0]?.name || req.user.name;

    const hour = new Date().getHours();
    const greeting = hour >= 5 && hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = addDays(todayStr, -1);
    const weekdayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const dateLabel = `${weekdayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const { rows: habits } = await query<HabitRow>(
      'SELECT * FROM habits WHERE user_id = $1 AND is_archived = FALSE ORDER BY created_at ASC',
      [req.user.id],
    );
    const { rows: entries } = await query<HabitEntryRow>(
      `SELECT * FROM habit_entries WHERE habit_id IN (
         SELECT id FROM habits WHERE user_id = $1
       ) AND date >= $2`,
      [req.user.id, addDays(todayStr, -45)],
    );

    let todayTotal = 0;
    let todayDone = 0;
    let yesterdayTotal = 0;
    let yesterdayDone = 0;

    const habitCards: Array<{
      habit: {
        id: string;
        name: string;
        icon: string;
        color: string;
        type: 'binary' | 'numeric';
        unit: string | null;
        dailyGoal: number | null;
        reminderTime: string | null;
        skipLimit: number;
        frequency: string;
        daysOfWeek: number[];
      };
      completed: boolean;
      value: number | null;
    }> = [];

    for (const habit of habits) {
      const habitEntries = entries.filter((e) => e.habit_id === habit.id);
      const entryMap = new Map(habitEntries.map((e) => [e.date, e]));

      if (isScheduled(habit, todayStr)) {
        todayTotal++;
        if (entryMap.get(todayStr)?.completed) todayDone++;
        habitCards.push({
          habit: {
            id: habit.id,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            type: habit.type,
            unit: habit.unit,
            dailyGoal: habit.daily_goal,
            reminderTime: habit.reminder_time,
            skipLimit: habit.skip_limit,
            frequency: habit.frequency,
            daysOfWeek: habit.days_of_week,
          },
          completed: entryMap.get(todayStr)?.completed ?? false,
          value: entryMap.get(todayStr)?.value ?? null,
        });
      }
      if (isScheduled(habit, yesterday)) {
        yesterdayTotal++;
        if (entryMap.get(yesterday)?.completed) yesterdayDone++;
      }
    }

    const dow = (now.getDay() + 6) % 7;
    const weekStart = addDays(todayStr, -dow);
    const lastWeekStart = addDays(weekStart, -7);

    const countWeek = (from: string) => {
      let scheduled = 0;
      let done = 0;
      for (const habit of habits) {
        const habitEntries = entries.filter((e) => e.habit_id === habit.id);
        const entryMap = new Map(habitEntries.map((e) => [e.date, e]));
        for (let i = 0; i < 7; i++) {
          const d = addDays(from, i);
          if (!isScheduled(habit, d)) continue;
          scheduled++;
          if (entryMap.get(d)?.completed) done++;
        }
      }
      return { scheduled, done, percent: scheduled ? Math.round((done / scheduled) * 100) : 0 };
    };
    const thisWeek = countWeek(weekStart);
    const lastWeek = countWeek(lastWeekStart);

    let bestOverall = 0;
    let currentOverall = 0;
    let bestHabitName = '';
    let currentHabitName = '';
    for (const habit of habits) {
      const habitEntries = entries.filter((e) => e.habit_id === habit.id);
      const scheduledDays = buildScheduledDays(habit, habitEntries, todayStr, 60);
      const cur = currentStreak(scheduledDays, todayStr, habit.skip_limit);
      const best = bestStreak(scheduledDays, habit.skip_limit);
      if (cur > currentOverall) {
        currentOverall = cur;
        currentHabitName = habit.name;
      }
      if (best > bestOverall) {
        bestOverall = best;
        bestHabitName = habit.name;
      }
    }

    const messages: string[] = [];
    if (todayTotal > 0 && yesterdayTotal > 0 && todayDone < yesterdayDone) {
      messages.push(`Вчера вы сделали ${yesterdayDone}/${yesterdayTotal} привычек. Сегодня ${todayDone}/${todayTotal} — подтянитесь!`);
    }
    if (todayDone === 0 && todayTotal > 0) {
      messages.push('Вы пока ничего не отметили, ай-яй — завтра не пропускаем! Начните с малого.');
    }
    if (thisWeek.scheduled > 0 && lastWeek.scheduled > 0 && thisWeek.percent > lastWeek.percent) {
      messages.push(`На этой неделе вы выполнили ${thisWeek.percent}% привычек — это на ${thisWeek.percent - lastWeek.percent}% лучше, чем на прошлой!`);
    } else if (thisWeek.scheduled > 0 && lastWeek.scheduled > 0 && thisWeek.percent < lastWeek.percent) {
      messages.push(`На этой неделе ${thisWeek.percent}% против ${lastWeek.percent}% на прошлой. Выше нос!`);
    }
    if (bestOverall > 0) {
      messages.push(`Ваш рекорд — ${bestOverall} дней подряд («${bestHabitName}»). Текущая серия — ${currentOverall} дней!`);
    }

    const conversions: string[] = [];
    for (const habit of habits) {
      if (habit.type !== 'numeric' || !habit.unit) continue;
      const habitEntries = entries.filter((e) => e.habit_id === habit.id);
      const month = monthKey(todayStr);
      const sum = habitEntries
        .filter((e) => monthKey(e.date) === month && e.completed)
        .reduce((acc, e) => acc + Number(e.value ?? 0), 0);
      const sumRound = Math.round(sum * 100) / 100;
      if (sumRound <= 0) continue;
      const converted = conversionInfo(habit, sumRound);
      if (converted) {
        conversions.push(`«${habit.name}»: ${converted}`);
      } else {
        conversions.push(`За месяц вы набрали ${sumRound} ${habit.unit} по привычке «${habit.name}».`);
      }
    }

    res.json({
      greeting,
      name,
      dateLabel,
      today: { done: todayDone, total: todayTotal },
      yesterday: { done: yesterdayDone, total: yesterdayTotal },
      week: {
        thisWeek: { percent: thisWeek.percent },
        lastWeek: { percent: lastWeek.percent },
        diff: thisWeek.percent - lastWeek.percent,
      },
      streaks: {
        best: bestOverall,
        current: currentOverall,
        bestHabitName,
        currentHabitName,
      },
      messages,
      conversions,
      habits: habitCards,
    });
  }),
);

export default router;