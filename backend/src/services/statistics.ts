import type { HabitRow, HabitEntryRow } from '../types.js';
import { addDays, daysBetween, isoDow, monthKey } from '../utils/date.js';

export interface ScheduledDay {
  date: string;
  completed: boolean;
  value: number | null;
}

export function isScheduled(habit: HabitRow, dateStr: string): boolean {
  if (habit.frequency === 'daily') return true;
  return habit.days_of_week.includes(isoDow(dateStr));
}

export function buildScheduledDays(
  habit: HabitRow,
  entries: HabitEntryRow[],
  reference: string,
  historyDays: number,
): ScheduledDay[] {
  const entryMap = new Map<string, HabitEntryRow>();
  for (const e of entries) entryMap.set(e.date, e);

  const from = addDays(reference, -(historyDays - 1));
  const result: ScheduledDay[] = [];
  for (const date of daysBetween(from, reference)) {
    if (!isScheduled(habit, date)) continue;
    const entry = entryMap.get(date);
    result.push({
      date,
      completed: entry?.completed ?? false,
      value: entry?.value ?? null,
    });
  }
  return result;
}

export function completedSet(habit: HabitRow, entries: HabitEntryRow[]): Set<string> {
  const set = new Set<string>();
  for (const e of entries) if (e.completed) set.add(e.date);
  return set;
}

export function currentStreak(
  scheduled: ScheduledDay[],
  reference: string,
  limit: number,
): number {
  const completed = new Set(scheduled.filter((s) => s.completed).map((s) => s.date));
  const scheduledDates = new Set(scheduled.map((s) => s.date));

  let streak = 0;
  let missesInMonth = 0;
  let curMonth = monthKey(reference);
  let cur = reference;
  let todayHandled = false;

  while (true) {
    if (!scheduledDates.has(cur)) {
      cur = addDays(cur, -1);
      continue;
    }
    if (!todayHandled && cur === reference && !completed.has(cur)) {
      todayHandled = true; // сегодня ещё не отмечено — не считаем пропуском
      cur = addDays(cur, -1);
      continue;
    }
    todayHandled = true;

    if (completed.has(cur)) {
      streak++;
      cur = addDays(cur, -1);
      continue;
    }

    const m = monthKey(cur);
    if (m !== curMonth) {
      curMonth = m;
      missesInMonth = 0;
    }
    if (missesInMonth >= limit) break;
    missesInMonth++;
    cur = addDays(cur, -1);
  }

  return streak;
}

export function bestStreak(scheduled: ScheduledDay[], limit: number): number {
  if (scheduled.length === 0) return 0;

  const overLimit = (map: Map<string, number>) => {
    for (const v of map.values()) if (v > limit) return true;
    return false;
  };

  let best = 0;
  let left = 0;
  const missesByMonth = new Map<string, number>();

  for (let right = 0; right < scheduled.length; right++) {
    const day = scheduled[right];
    if (!day.completed) {
      const m = monthKey(day.date);
      missesByMonth.set(m, (missesByMonth.get(m) ?? 0) + 1);
    }

    while (left <= right) {
      const over = overLimit(missesByMonth);
      if (!over && scheduled[left].completed) break;
      const removed = scheduled[left];
      if (!removed.completed) {
        const m = monthKey(removed.date);
        const c = missesByMonth.get(m) ?? 0;
        if (c <= 1) missesByMonth.delete(m);
        else missesByMonth.set(m, c - 1);
      }
      left++;
    }

    if (right - left + 1 > best) best = right - left + 1;
  }

  return best;
}

export interface WindowStats {
  done: number;
  total: number;
  percent: number;
}

export function windowStats(
  scheduled: ScheduledDay[],
  reference: string,
  days: number,
): WindowStats {
  const start = addDays(reference, -(days - 1));
  const done = scheduled.filter(
    (s) => s.date >= start && s.date <= reference && s.completed,
  ).length;
  const total = scheduled.filter((s) => s.date >= start && s.date <= reference).length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export interface MonthSkipInfo {
  skips: number;
  scheduledDays: number;
  remaining: number;
  exhausted: boolean;
}

export function monthSkips(scheduled: ScheduledDay[], reference: string, limit: number): MonthSkipInfo {
  const month = monthKey(reference);
  const inMonth = scheduled.filter((s) => s.date <= reference && monthKey(s.date) === month);
  const skips = inMonth.filter((s) => !s.completed).length;
  return {
    skips,
    scheduledDays: inMonth.length,
    remaining: Math.max(0, limit - skips),
    exhausted: skips > limit,
  };
}

// Простое склонение единицы измерения для чисел > 1 (для отношений падежей не подходит,
// но для «книга → книги» и большинства распространённых единиц работает).
function pluralUnits(unit: string, n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return unit;
  if (last === 1) return unit;

  if (unit.endsWith('а')) return unit.slice(0, -1) + 'ы';
  if (unit.endsWith('я')) return unit.slice(0, -1) + 'и';
  if (unit.endsWith('ь')) return unit.slice(0, -1) + 'и';
  // Неизвестную форму не трогаем, чтобы не портить уже множественные («страницы»)
  return unit;
}

export function conversionInfo(habit: HabitRow, sum: number): string | null {
  if (habit.conversion_amount == null || habit.conversion_unit == null) return null;
  if (habit.unit == null) return null;
  const amount = Number(habit.conversion_amount);
  if (!isFinite(amount) || amount <= 0) return null;
  const units = Math.floor(sum / amount);
  const remainder = Math.round((sum % amount) * 100) / 100;

  if (units < 1) {
    return `Вы набрали ${sum} ${pluralUnits(habit.unit, sum)}. Мало — всего ${pluralUnits(habit.conversion_unit, 1)} в пути.`;
  }
  let text = `Вы набрали ${sum} ${pluralUnits(habit.unit, sum)}. Это ${units} ${pluralUnits(habit.conversion_unit, units)}`;
  if (remainder > 0) text += ` и ${remainder} ${pluralUnits(habit.unit, remainder)}`;
  text += '!';
  if (habit.conversion_comment) text += ` (${habit.conversion_comment})`;
  return text;
}