// Работа с датами в локальном времени (серверная локаль).
// Все даты в API передаются строками YYYY-MM-DD.

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateString(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toDateString(dt);
}

export function startOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7; // 0=Пн ... 6=Вс
  dt.setDate(dt.getDate() - dow);
  return toDateString(dt);
}

export function endOfWeek(dateStr: string): string {
  const start = startOfWeek(dateStr);
  return addDays(start, 6);
}

export function daysBetween(fromStr: string, toStr: string): string[] {
  const result: string[] = [];
  let cur = fromStr;
  while (cur <= toStr) {
    result.push(cur);
    cur = addDays(cur, 1);
  }
  return result;
}

// День недели по ISO: 1=Пн ... 7=Вс
export function isoDow(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 0 ? 7 : dow;
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function monthLabel(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  const names = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];
  return `${names[m - 1]} ${y}`;
}

export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];