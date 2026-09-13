import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { DashboardData, HabitInput } from '../types';
import { Button, EmptyState, Field, HabitCheckbox, Icon, Input, Loading, ProgressBar, Select, useToast } from '../components/ui';
import { PageHeader } from '../layouts/AppLayout';
import { HABIT_ICONS } from '../constants';
import { todayStr } from '../utils/dates';

export default function Dashboard() {
  const { pushToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<DashboardData>('/stats/dashboard', 'GET');
      setData(d);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить дашборд');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleHabit = async (habitId: string, completed: boolean) => {
    try {
      await api('/habits/' + habitId + '/entries', 'POST', {
        date: todayStr(),
        completed: !completed,
      });
      await load();
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
    }
  };

  const saveNumericValue = async (habitId: string, value: number) => {
    try {
      await api('/habits/' + habitId + '/entries', 'POST', {
        date: todayStr(),
        value,
      });
      await load();
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
    }
  };

  if (loading) return <Loading label="Загружаем ваш день…" />;
  if (error || !data) return <EmptyState icon="info" title="Ошибка" text={error} />;

  const { today } = data;
  const percent = today.total > 0 ? Math.round((today.done / today.total) * 100) : 0;

  return (
    <div className="fade-in">
      <PageHeader
        title={`${data.greeting}, ${data.name}!`}
        subtitle={data.dateLabel}
      />

      {/* Прогресс дня */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div className="row-between mb-2">
          <div className="text-secondary" style={{ fontWeight: 600 }}>
            Выполнено {today.done} из {today.total} привычек
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{percent}%</div>
        </div>
        <ProgressBar value={today.done} max={today.total} successColor />
      </div>

      {/* Мотивация */}
      {data.messages.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 16, borderColor: 'var(--accent)' }}>
          <div className="row" style={{ marginBottom: 8, color: 'var(--accent)' }}>
            <Icon name="flame" size={18} />
            <span style={{ fontWeight: 700 }}>Лучше, чем вчера</span>
          </div>
          {data.messages.map((m, i) => (
            <div key={i} className="text-secondary" style={{ fontSize: '0.95rem' }}>{m}</div>
          ))}
        </div>
      )}

      {/* Список привычек на сегодня */}
      <div className="row-between" style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Привычки на сегодня</h2>
        <Button variant={quickAddOpen ? 'outline' : 'primary'} size="sm" onClick={() => setQuickAddOpen((v) => !v)}>
          <Icon name="plus" size={16} /> {quickAddOpen ? 'Скрыть' : 'Добавить привычку'}
        </Button>
      </div>

      {quickAddOpen && (
        <QuickAddForm
          onSaved={async () => {
            setQuickAddOpen(false);
            await load();
          }}
          onCancel={() => setQuickAddOpen(false)}
          pushToast={pushToast}
        />
      )}

      {today.total === 0 && !quickAddOpen ? (
        <EmptyState
          icon="target"
          title="Пока нет привычек на сегодня"
          text="Создайте первую привычку — и начните выстраивать дисциплину."
          action={<Button onClick={() => setQuickAddOpen(true)}><Icon name="plus" size={16} /> Добавить привычку</Button>}
        />
      ) : (
        <div className="stack">
          {data.habits.map(({ habit, completed, value }) => (
            <div className="habit-card card" key={habit.id}>
              <span className="habit-icon" style={{ background: habit.color + '22', color: habit.color }}>
                <Icon name={habit.icon} size={22} />
              </span>
              <div className="habit-info">
                <div className="habit-name">{habit.name}</div>
                <div className="habit-meta">
                  {habit.reminderTime && `⏰ ${habit.reminderTime.slice(0, 5)}`}
                  {habit.reminderTime && habit.unit && ' · '}
                  {habit.type === 'numeric' && habit.dailyGoal != null ? `Цель: ${habit.dailyGoal} ${habit.unit ?? ''}` : ''}
                </div>
              </div>

              {habit.type === 'numeric' && (
                <NumericInput
                  defaultValue={value}
                  onSave={(v) => void saveNumericValue(habit.id, v)}
                  completed={completed}
                  unit={habit.unit}
                />
              )}

              <HabitCheckbox checked={completed} onChange={() => void toggleHabit(habit.id, completed)} color={habit.color} />
            </div>
          ))}
        </div>
      )}

      {/* Статистика в виде пользы */}
      {data.conversions.length > 0 && (
        <>
          <h2 className="mt-4" style={{ fontSize: '1.25rem' }}>Статистика в виде пользы</h2>
          <div className="card" style={{ padding: '16px 20px' }}>
            {data.conversions.map((c, i) => (
              <div key={i} className="row" style={{ padding: '6px 0', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--success)' }}><Icon name="sparkles" size={18} /></span>
                <span className="text-secondary">{c}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {data.streaks.best > 0 && (
        <div className="card mt-3" style={{ padding: '16px 20px' }}>
          <div className="row">
            <span style={{ color: 'var(--warning)' }}><Icon name="flame" size={20} /></span>
            <div>
              <div style={{ fontWeight: 700 }}>🔥 Текущая серия — {data.streaks.current} дней</div>
              <div className="text-muted">Рекорд: {data.streaks.best} дней ({data.streaks.bestHabitName})</div>
            </div>
            <div className="spacer" />
            <Link to="/stats" className="btn btn-outline btn-sm">Вся статистика</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NumericInput({
  defaultValue,
  onSave,
  completed,
  unit,
}: {
  defaultValue: number | null;
  onSave: (v: number) => void;
  completed: boolean;
  unit: string | null;
}) {
  const [value, setValue] = useState<string>(defaultValue != null ? String(defaultValue) : '');

  const submit = () => {
    const n = parseFloat(value.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return;
    onSave(n);
  };

  return (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      style={{ gap: 6 }}
    >
      <Input
        className="input habit-value-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type="number"
        min={0}
        step="any"
        placeholder="0"
        aria-label="Значение"
        disabled={completed}
        style={{ textAlign: 'center', padding: '9px 6px', width: 70 }}
      />
      {unit && <span className="text-muted" style={{ fontSize: '0.85rem', minWidth: 0 }}>{unit}</span>}
      {!completed && (
        <Button variant="ghost" size="sm" onClick={submit} style={{ padding: '8px 10px' }} aria-label="Сохранить значение">
          <Icon name="check" size={16} />
        </Button>
      )}
    </form>
  );
}

function QuickAddForm({
  onSaved,
  onCancel,
  pushToast,
}: {
  onSaved: () => void;
  onCancel: () => void;
  pushToast: (m: string, t?: 'success' | 'error' | 'info') => void;
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('star');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const body: HabitInput = {
        name: name.trim(),
        icon,
        color: '#8b5cf6',
        categoryId: null,
        type: 'binary',
        frequency,
        daysOfWeek: frequency === 'daily' ? [1, 2, 3, 4, 5, 6, 7] : [1, 3, 5],
        reminderTime: null,
        unit: null,
        dailyGoal: null,
        conversionAmount: null,
        conversionUnit: null,
        conversionComment: null,
        skipLimit: 3,
      };
      await api('/habits', 'POST', body);
      pushToast('Привычка добавлена', 'success');
      onSaved();
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div className="row-between mb-2">
        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Быстрое добавление привычки</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}><Icon name="x" size={16} /></Button>
      </div>
      <Field label="Название">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Читать 30 минут" autoFocus required />
      </Field>
      <Field label="Иконка" hint="Можно изменить позже через полную форму">
        <Select value={icon} onChange={(e) => setIcon(e.target.value)}>
          {HABIT_ICONS.map((ic) => (
            <option key={ic} value={ic}>{ic}</option>
          ))}
        </Select>
      </Field>
      <Field label="Периодичность">
        <div className="row">
          <Button type="button" variant={frequency === 'daily' ? 'primary' : 'outline'} onClick={() => setFrequency('daily')}>Ежедневно</Button>
          <Button type="button" variant={frequency === 'weekly' ? 'primary' : 'outline'} onClick={() => setFrequency('weekly')}>По дням (Пн, Ср, Пт)</Button>
        </div>
      </Field>
      <Button type="submit" block disabled={saving || !name.trim()}>
        {saving ? 'Сохраняем…' : 'Создать привычку'}
      </Button>
    </form>
  );
}