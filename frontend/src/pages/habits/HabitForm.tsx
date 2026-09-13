import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { Category, Habit, HabitFrequency, HabitType } from '../../types';
import { Button, Field, Icon, Input, Loading, Select, useToast } from '../../components/ui';
import { ColorPicker, IconPicker, WeekdayPicker } from '../../components/pickers';
import { PageHeader } from '../../layouts/AppLayout';
import { CATEGORY_COLORS, HABIT_ICONS } from '../../constants';

interface FormState {
  name: string;
  icon: string;
  color: string;
  categoryId: string | null;
  type: HabitType;
  frequency: HabitFrequency;
  daysOfWeek: number[];
  reminderTime: string | null;
  unit: string | null;
  dailyGoal: string;
  conversionAmount: string;
  conversionUnit: string | null;
  conversionComment: string | null;
  skipLimit: number;
}

const EMPTY: FormState = {
  name: '',
  icon: 'star',
  color: '#8b5cf6',
  categoryId: null,
  type: 'binary',
  frequency: 'daily',
  daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
  reminderTime: null,
  unit: null,
  dailyGoal: '',
  conversionAmount: '',
  conversionUnit: null,
  conversionComment: null,
  skipLimit: 3,
};

export default function HabitForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ categories: Category[] }>('/categories', 'GET');
        setCategories(data.categories);
      } catch (err) {
        pushToast(err instanceof ApiError ? err.message : 'Не удалось загрузить категории', 'error');
      }
    })();

    if (isEdit) {
      api<{ habit: Habit }>('/habits/' + id, 'GET')
        .then(({ habit }) => {
          setForm({
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            categoryId: habit.category?.id ?? null,
            type: habit.type,
            frequency: habit.frequency,
            daysOfWeek: habit.daysOfWeek,
            reminderTime: habit.reminderTime ? habit.reminderTime.slice(0, 5) : null,
            unit: habit.unit,
            dailyGoal: habit.dailyGoal != null ? String(habit.dailyGoal) : '',
            conversionAmount: habit.conversionAmount != null ? String(habit.conversionAmount) : '',
            conversionUnit: habit.conversionUnit,
            conversionComment: habit.conversionComment,
            skipLimit: habit.skipLimit,
          });
        })
        .catch((err) => {
          pushToast(err instanceof ApiError ? err.message : 'Ошибка загрузки', 'error');
          navigate('/habits');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, isEdit, navigate, pushToast]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.type === 'numeric' && (!form.dailyGoal || parseFloat(form.dailyGoal) <= 0)) {
      setError('Для количественной привычки укажите цель на день');
      return;
    }

    const body = {
      name: form.name.trim(),
      icon: form.icon,
      color: form.color,
      categoryId: form.categoryId,
      type: form.type,
      frequency: form.frequency,
      daysOfWeek: form.daysOfWeek,
      reminderTime: form.reminderTime,
      unit: form.type === 'numeric' ? form.unit : null,
      dailyGoal: form.type === 'numeric' ? parseFloat(form.dailyGoal) : null,
      conversionAmount: form.conversionAmount ? parseFloat(form.conversionAmount) : null,
      conversionUnit: form.conversionUnit,
      conversionComment: form.conversionComment && form.conversionComment.trim() ? form.conversionComment.trim() : null,
      skipLimit: form.skipLimit,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api('/habits/' + id, 'PUT', body);
        pushToast('Изменения сохранены', 'success');
        navigate('/habits');
      } else {
        await api('/habits', 'POST', body);
        pushToast('Привычка создана!', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setError(String((err.details as Array<{ message: string }>)[0]?.message ?? err.message));
      } else {
        setError(err instanceof ApiError ? err.message : 'Не удалось сохранить');
      }
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Загружаем привычку…" />;

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      <PageHeader title={isEdit ? 'Редактирование привычки' : 'Новая привычка'} />
      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        {error && <div className="form-error-box">{error}</div>}

        <Field label="Название" error={!form.name.trim() && error ? 'Введите название' : undefined}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Например, Читать 30 минут"
            maxLength={120}
            required
          />
        </Field>

        <Field label="Иконка">
          <IconPicker icons={HABIT_ICONS} value={form.icon} onChange={(v) => set('icon', v)} />
        </Field>

        <Field label="Цвет">
          <ColorPicker colors={CATEGORY_COLORS} value={form.color} onChange={(v) => set('color', v)} />
        </Field>

        <Field label="Категория" hint="Одна привычка — одна категория">
          <Select value={form.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)}>
            <option value="">Без категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Тип привычки">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <HabitTypeCard
              active={form.type === 'binary'}
              onClick={() => set('type', 'binary')}
              title="Бинарная"
              text="Простой чекбокс — выполнил / не выполнил"
            />
            <HabitTypeCard
              active={form.type === 'numeric'}
              onClick={() => set('type', 'numeric')}
              title="Количественная"
              text="Числовое значение + единица измерения"
            />
          </div>
        </Field>

        <Field label="Периодичность">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <HabitTypeCard
              active={form.frequency === 'daily'}
              onClick={() => {
                set('frequency', 'daily');
                set('daysOfWeek', [1, 2, 3, 4, 5, 6, 7]);
              }}
              title="Ежедневно"
              text="Показывается каждый день"
            />
            <HabitTypeCard
              active={form.frequency === 'weekly'}
              onClick={() => {
                set('frequency', 'weekly');
                if (form.daysOfWeek.length === 7) set('daysOfWeek', [1, 3, 5]);
              }}
              title="По дням недели"
              text="Выбери конкретные дни"
            />
          </div>
        </Field>

        {form.frequency === 'weekly' && (
          <Field label="Дни недели" hint="Выберите хотя бы один день">
            <WeekdayPicker value={form.daysOfWeek} onChange={(days) => set('daysOfWeek', days)} />
          </Field>
        )}

        <Field label="Напоминание" hint="Одно время для всех дней. Push — если включено, email — если включено">
          <Input
            type="time"
            value={form.reminderTime ?? ''}
            onChange={(e) => set('reminderTime', e.target.value || null)}
          />
        </Field>

        {form.type === 'numeric' && (
          <>
            <div className="grid grid-2">
              <Field label="Единица измерения">
                <Input
                  value={form.unit ?? ''}
                  onChange={(e) => set('unit', e.target.value || null)}
                  placeholder="страницы, минуты, стаканы…"
                />
              </Field>
              <Field label="Цель на день">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={form.dailyGoal}
                  onChange={(e) => set('dailyGoal', e.target.value)}
                  placeholder="Например, 30"
                />
              </Field>
            </div>

            <div className="divider" />

            <h3 style={{ fontSize: '1.05rem' }}>Статистика в виде пользы (опционально)</h3>
            <p className="text-muted" style={{ marginTop: 0 }}>
              Коэффициент перевода выполненных привычек в понятные единицы.
              Например: «За месяц вы прочитали 320 страниц. Это 2 книги!» при 1 книге = 160 страниц.
            </p>
            <div className="grid grid-2">
              <Field label="Сколько единиц = один результат">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={form.conversionAmount}
                  onChange={(e) => set('conversionAmount', e.target.value)}
                  placeholder="Например, 160"
                />
              </Field>
              <Field label="Название результата">
                <Input
                  value={form.conversionUnit ?? ''}
                  onChange={(e) => set('conversionUnit', e.target.value || null)}
                  placeholder="книга"
                />
              </Field>
            </div>
            <Field label="Комментарий (опционально)">
              <Input
                value={form.conversionComment ?? ''}
                onChange={(e) => set('conversionComment', e.target.value || null)}
                placeholder="Например: средний объём книги"
              />
            </Field>
          </>
        )}

        <Field label="Лимит пропусков в месяц" hint="Пока вы в лимите — стрик сохраняется. При превышении стрик обнуляется.">
          <Input
            type="number"
            min={0}
            max={31}
            value={form.skipLimit}
            onChange={(e) => set('skipLimit', Math.max(0, Math.min(31, Number(e.target.value) || 0)))}
          />
        </Field>

        <div className="row mt-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? 'Сохраняем…' : isEdit ? <><Icon name="check" size={18} /> Сохранить изменения</> : 'Создать привычку'}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate(-1)}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}

function HabitTypeCard({
  active,
  onClick,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="card"
      style={{
        padding: 14,
        textAlign: 'left',
        cursor: 'pointer',
        border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
        color: 'var(--text)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div className="text-muted" style={{ fontSize: '0.82rem' }}>{text}</div>
    </button>
  );
}