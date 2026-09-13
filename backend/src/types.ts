export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  name: string;
  theme: 'dark' | 'light';
  email_enabled: boolean;
  push_enabled: boolean;
  reset_token: string | null;
  reset_token_expires: Date | null;
  created_at: Date;
}

export interface CategoryRow {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_global: boolean;
}

export interface HabitRow {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: 'binary' | 'numeric';
  frequency: 'daily' | 'weekly';
  days_of_week: number[];
  reminder_time: string | null;
  unit: string | null;
  daily_goal: number | null;
  conversion_amount: number | null;
  conversion_unit: string | null;
  conversion_comment: string | null;
  skip_limit: number;
  is_archived: boolean;
  created_at: Date;
}

export interface HabitEntryRow {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  value: number | null;
  completed: boolean;
}

export type HabitType = 'binary' | 'numeric';
export type HabitFrequency = 'daily' | 'weekly';

// Форма для создания/редактирования привычки (тело запроса)
export interface HabitInput {
  name: string;
  icon?: string;
  color?: string;
  category_id?: string | null;
  type: HabitType;
  frequency: HabitFrequency;
  days_of_week: number[];
  reminder_time?: string | null;
  unit?: string | null;
  daily_goal?: number | null;
  conversion_amount?: number | null;
  conversion_unit?: string | null;
  conversion_comment?: string | null;
  skip_limit?: number;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  name: string;
  theme: 'dark' | 'light';
  emailEnabled: boolean;
  pushEnabled: boolean;
  createdAt: string;
}

export function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    name: u.name,
    theme: u.theme,
    emailEnabled: u.email_enabled,
    pushEnabled: u.push_enabled,
    createdAt: u.created_at.toISOString(),
  };
}