import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { Habit } from '../../types';
import { Button, ConfirmDialog, EmptyState, Icon, Loading, useToast } from '../../components/ui';
import { PageHeader } from '../../layouts/AppLayout';
import { habitWeekdaysLabel, plural } from '../../utils/dates';

type Filter = 'active' | 'all' | 'archived';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'active', label: 'Активные' },
  { value: 'all', label: 'Все' },
  { value: 'archived', label: 'Архивные' },
];

export default function HabitsList() {
  const { pushToast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('active');
  const [toDelete, setToDelete] = useState<Habit | null>(null);

  const load = useCallback(async () => {
    try {
      const archiveQuery = filter === 'active' ? '' : `?archived=${filter}`;
      const data = await api<{ habits: Habit[] }>('/habits' + archiveQuery, 'GET');
      setHabits(data.habits);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить привычки');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const deleteHabit = async () => {
    if (!toDelete) return;
    try {
      await api('/habits/' + toDelete.id, 'DELETE');
      pushToast('Привычка удалена', 'success');
      setToDelete(null);
      await load();
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
    }
  };

  const toggleArchive = async (habit: Habit) => {
    try {
      if (habit.isArchived) {
        await api('/habits/' + habit.id + '/unarchive', 'POST');
        pushToast('Привычка восстановлена из архива', 'success');
      } else {
        await api('/habits/' + habit.id + '/archive', 'POST');
        pushToast('Привычка отправлена в архив (стрик обнулён)', 'success');
      }
      await load();
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
    }
  };

  if (loading) return <Loading label="Загружаем привычки…" />;
  if (error) return <EmptyState icon="info" title="Ошибка" text={error} />;

  return (
    <div className="fade-in">
      <PageHeader
        title="Привычки"
        subtitle={habits.length > 0 ? `${habits.length} ${plural(habits.length, 'привычка', 'привычки', 'привычек')}` : undefined}
        actions={
          <Link to="/habits/new" className="btn btn-primary">
            <Icon name="plus" size={16} /> Создать привычку
          </Link>
        }
      />

      <div className="row mb-3" role="tablist">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon="target"
          title={filter === 'archived' ? 'Архив пуст' : 'Привычек пока нет'}
          text={filter === 'archived' ? 'Архивируйте привычки — история сохранится здесь.' : 'Создайте первую привычку, чтобы начать трекинг.'}
          action={filter !== 'archived' ? (
            <Link to="/habits/new" className="btn btn-primary"><Icon name="plus" size={16} /> Создать привычку</Link>
          ) : undefined}
        />
      ) : (
        <div className="stack">
          {habits.map((h) => (
            <HabitListItem key={h.id} habit={h} onArchive={() => void toggleArchive(h)} onDelete={() => setToDelete(h)} />
          ))}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Удалить привычку?"
          message={`Привычка «${toDelete.name}» и вся её история будут удалены безвозвратно.`}
          onConfirm={() => void deleteHabit()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function HabitListItem({
  habit,
  onArchive,
  onDelete,
}: {
  habit: Habit;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const current = habit.currentStreak ?? 0;
  const exhausted = habit.monthExhausted ?? false;

  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="row-between flex-wrap" style={{ gap: 12 }}>
        <div className="row" style={{ minWidth: 0 }}>
          <span className="habit-icon" style={{ background: habit.color + '22', color: habit.color }}>
            <Icon name={habit.icon} size={22} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{habit.name}</span>
              {habit.category && (
                <span className="badge" style={{ color: habit.category.color }}>
                  <Icon name={habit.category.icon} size={12} /> {habit.category.name}
                </span>
              )}
              {habit.isArchived && <span className="badge">В архиве</span>}
            </div>
            <div className="habit-meta">
              {habitWeekdaysLabel(habit)}
              {habit.type === 'numeric' && habit.unit ? ` · ${habit.unit}` : ''}
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <Link to={`/habits/${habit.id}/stats`} className="btn btn-outline btn-sm">
            <Icon name="chart" size={16} /> Статистика
          </Link>
          <Link to={`/habits/${habit.id}/edit`} className="btn btn-outline btn-sm" title="Редактировать">
            <Icon name="edit" size={16} />
          </Link>
          <Button variant="outline" size="sm" onClick={onArchive} title={habit.isArchived ? 'Восстановить из архива' : 'В архив'}>
            <Icon name="archive" size={16} />
          </Button>
          <Button variant="danger-outline" size="sm" onClick={onDelete} title="Удалить">
            <Icon name="trash" size={16} />
          </Button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
        <div className="card" style={{ padding: '10px 12px', boxShadow: 'none', background: 'var(--bg-soft)' }}>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Текущая серия</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
            <span style={{ color: current > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>🔥</span> {current} {plural(current, 'день', 'дня', 'дней')}
          </div>
        </div>
        <div className="card" style={{ padding: '10px 12px', boxShadow: 'none', background: 'var(--bg-soft)' }}>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Рекорд</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>🏆 {habit.bestStreak ?? 0}</div>
        </div>
        <div className="card" style={{ padding: '10px 12px', boxShadow: 'none', background: 'var(--bg-soft)' }}>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Пропуски в этом месяце</div>
          <div className="row" style={{ gap: 6 }}>
            <span className={'badge ' + (exhausted ? 'badge-danger' : habit.remainingSkips === 0 ? 'badge-warning' : 'badge-accent')}>
              {exhausted ? 'Лимит исчерпан' : `Осталось ${habit.remainingSkips ?? 0}`}
            </span>
          </div>
        </div>
        <div className="card" style={{ padding: '10px 12px', boxShadow: 'none', background: 'var(--bg-soft)' }}>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>На этой неделе</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
            {habit.weekDone ?? 0}/{habit.weekTotal ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}