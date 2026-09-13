CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  theme VARCHAR(10) NOT NULL DEFAULT 'dark',
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'tag',
  color VARCHAR(20) NOT NULL DEFAULT '#8b5cf6',
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Глобальные категории по умолчанию (вставляются, только если таблица пуста)
INSERT INTO categories (id, name, icon, color, is_global)
SELECT v.id, v.name, v.icon, v.color, v.is_global FROM (VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Здоровье', 'heart', '#ef4444', TRUE),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Работа', 'briefcase', '#3b82f6', TRUE),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Образование', 'book', '#8b5cf6', TRUE),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'Спорт', 'dumbbell', '#f59e0b', TRUE),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'Питание', 'apple', '#22c55e', TRUE),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'Дом', 'home', '#06b6d4', TRUE),
  ('00000000-0000-0000-0000-000000000007'::uuid, 'Вредные привычки', 'no-smoking', '#f97316', TRUE),
  ('00000000-0000-0000-0000-000000000008'::uuid, 'Творчество', 'palette', '#ec4899', TRUE),
  ('00000000-0000-0000-0000-000000000009'::uuid, 'Сон', 'moon', '#6366f1', TRUE)
) AS v(id, name, icon, color, is_global)
WHERE NOT EXISTS (SELECT 1 FROM categories);

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(120) NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'star',
  color VARCHAR(20) NOT NULL DEFAULT '#8b5cf6',
  type VARCHAR(10) NOT NULL DEFAULT 'binary' CHECK (type IN ('binary', 'numeric')),
  frequency VARCHAR(10) NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,7]::integer[],
  reminder_time TIME,
  unit VARCHAR(30),
  daily_goal NUMERIC,
  conversion_amount NUMERIC,
  conversion_unit VARCHAR(30),
  conversion_comment TEXT,
  skip_limit INTEGER NOT NULL DEFAULT 3,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);

CREATE TABLE IF NOT EXISTS habit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_entries_habit_date ON habit_entries(habit_id, date);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);