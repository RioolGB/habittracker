export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  theme: 'dark' | 'light';
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isGlobal: boolean;
}

export type HabitType = 'binary' | 'numeric';
export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: HabitType;
  frequency: HabitFrequency;
  daysOfWeek: number[];
  reminderTime: string | null;
  unit: string | null;
  dailyGoal: number | null;
  conversionAmount: number | null;
  conversionUnit: string | null;
  conversionComment: string | null;
  skipLimit: number;
  isArchived: boolean;
  createdAt: string;
  category: Omit<Category, 'isGlobal'> | null;
  currentStreak?: number;
  bestStreak?: number;
  monthSkips?: number;
  remainingSkips?: number;
  monthScheduled?: number;
  monthExhausted?: boolean;
  weekDone?: number;
  weekTotal?: number;
  percent30?: number;
}

export interface HabitInput {
  name: string;
  icon: string;
  color: string;
  categoryId: string | null;
  type: HabitType;
  frequency: HabitFrequency;
  daysOfWeek: number[];
  reminderTime: string | null;
  unit: string | null;
  dailyGoal: number | null;
  conversionAmount: number | null;
  conversionUnit: string | null;
  conversionComment: string | null;
  skipLimit: number;
}

export interface Entry {
  id: string;
  habit_id: string;
  date: string;
  value: number | null;
  completed: boolean;
}

export interface DashboardHabit {
  habit: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: HabitType;
    unit: string | null;
    dailyGoal: number | null;
    reminderTime: string | null;
    skipLimit: number;
    frequency: HabitFrequency;
    daysOfWeek: number[];
  };
  completed: boolean;
  value: number | null;
}

export interface DashboardData {
  greeting: string;
  name: string;
  dateLabel: string;
  today: { done: number; total: number };
  yesterday: { done: number; total: number };
  week: {
    thisWeek: { percent: number };
    lastWeek: { percent: number };
    diff: number;
  };
  streaks: {
    best: number;
    current: number;
    bestHabitName: string;
    currentHabitName: string;
  };
  messages: string[];
  conversions: string[];
  habits: DashboardHabit[];
}

export interface CalendarDay {
  date: string;
  scheduled: number;
  done: number;
  status: 'full' | 'partial' | 'empty' | 'none';
}

export interface CalendarResponse {
  from: string;
  to: string;
  days: CalendarDay[];
}

export interface CalendarDayDetail {
  habit: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: HabitType;
    unit: string | null;
    dailyGoal: number | null;
    reminderTime: string | null;
    isArchived: boolean;
    category: { id: string; name: string; icon: string; color: string } | null;
  };
  scheduled: boolean;
  completed: boolean;
  value: number | null;
}

export interface HabitStatEntry {
  date: string;
  completed: boolean;
  value: number | null;
}

export interface HabitStatistics {
  habit: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: HabitType;
    unit: string | null;
    dailyGoal: number | null;
    skipLimit: number;
    createdAt: string;
  };
  currentStreak: number;
  bestStreak: number;
  percent7: number;
  percent30: number;
  percent90: number;
  totalDone: number;
  totalScheduled: number;
  monthSkips: number;
  monthExhausted: boolean;
  series: HabitStatEntry[];
}

export interface HabitRank {
  id: string;
  name: string;
  color: string;
  icon: string;
  done: number;
  scheduled: number;
  percent: number;
  missPercent: number;
}

export interface OverviewStats {
  totalHabits: number;
  totalDone: number;
  totalScheduled: number;
  overallPercent: number;
  topHabits: HabitRank[];
  worstHabits: HabitRank[];
  bestDay: { date: string; percent: number } | null;
  bestWeek: { start: string; percent: number } | null;
  bestMonth: { month: string; percent: number; label: string } | null;
  monthlySeries: Array<{ month: string; label: string; done: number; total: number }>;
}