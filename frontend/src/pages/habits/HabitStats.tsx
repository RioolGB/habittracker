import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { HabitStatistics as HabitStatsData } from '../../types';
import { api } from '../../api/client';
import { EmptyState, Icon, Loading } from '../../components/ui';
import { PageHeader } from '../../layouts/AppLayout';
import { LineChart } from '../../components/pickers';
import { plural } from '../../utils/dates';

export default function HabitStats() {
  const { id } = useParams();
  const [data, setData] = useState<HabitStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<HabitStatsData>('/stats/habits/' + id, 'GET')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading label="Загружаем статистику…" />;
  if (!data) return <EmptyState icon="info" title="Статистика не найдена" />;

  const { habit } = data;

  const chartValues = data.series.map((s) => ({
    date: s.date,
    value: habit.type === 'numeric' ? (s.value ?? 0) : s.completed ? 1 : 0,
  }));

  const formatValue =
    habit.type === 'numeric'
      ? (v: number) => `${v} ${habit.unit ?? ''}`
      : (v: number) => (v > 0 ? 'выполнено' : 'пропуск');

  return (
    <div className="fade-in">
      <PageHeader
        title={
          <span className="row">
            <span className="habit-icon" style={{ background: habit.color + '22', color: habit.color }}>
              <Icon name={habit.icon} size={22} />
            </span>
            {habit.name}
          </span>
        }
        actions={
          <Link to="/habits" className="btn btn-outline btn-sm">
            ← К списку
          </Link>
        }
      />

      <div className="grid grid-3 mb-3">
        <StatCard
          icon="flame"
          color="var(--warning)"
          value={`${data.currentStreak}`}
          label={`${plural(data.currentStreak, 'день', 'дня', 'дней')} подряд`}
        />
        <StatCard
          icon="trophy"
          color="var(--accent)"
          value={`${data.bestStreak}`}
          label="Лучшая серия"
        />
        <StatCard
          icon="target"
          color="var(--success)"
          value={`${data.totalDone}/${data.totalScheduled}`}
          label="Выполнено за всё время"
        />
      </div>

      <div className="grid grid-2">
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Процент выполнения</h3>
          <div className="stack " style={{ gap: 12, marginTop: 12 }}>
            <PercentRow label="За 7 дней" percent={data.percent7} />
            <PercentRow label="За 30 дней" percent={data.percent30} />
            <PercentRow label="За 90 дней" percent={data.percent90} />
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Пропуски в этом месяце</h3>
          <div className="mt-2">
            <span className={'badge ' + (data.monthExhausted ? 'badge-danger' : 'badge-accent')} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
              {data.monthExhausted ? 'Лимит пропусков исчерпан — стрик обнулён' : `Использовано ${data.monthSkips} из ${habit.skipLimit}`}
            </span>
          </div>
          <p className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
            Пока вы в лимите (≤ {habit.skipLimit} пропусков в месяц), серия сохраняется.
          </p>
        </div>
      </div>

      <div className="card mt-3" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1.05rem' }}>График прогресса</h3>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Последние 120 дней. {habit.type === 'numeric' ? `Значение в единицах «${habit.unit ?? ''}».` : 'Выполнено (1) / пропуск (0).'}
        </p>
        <LineChart data={chartValues} formatValue={formatValue} />
      </div>

      <div className="mt-3 row">
        <Link to={`/habits/${habit.id}/edit`} className="btn btn-outline">
          <Icon name="edit" size={16} /> Редактировать
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon, color, value, label }: { icon: string; color: string; value: string; label: string }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div className="row" style={{ color, marginBottom: 8 }}>
        <Icon name={icon} size={22} />
      </div>
      <div style={{ fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2 }}>{value}</div>
      <div className="text-muted">{label}</div>
    </div>
  );
}

function PercentRow({ label, percent }: { label: string; percent: number }) {
  return (
    <div>
      <div className="row-between mb-1">
        <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{label}</span>
        <span style={{ fontWeight: 700 }}>{percent}%</span>
      </div>
      <div className="progress">
        <div className="progress-fill success" style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}