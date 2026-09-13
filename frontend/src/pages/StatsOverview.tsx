import { useEffect, useState } from 'react';
import type { OverviewStats } from '../types';
import { api } from '../api/client';
import { EmptyState, Icon, Loading } from '../components/ui';
import { PageHeader } from '../layouts/AppLayout';
import { BarChart } from '../components/pickers';
import { formatLongDate, plural } from '../utils/dates';

export default function StatsOverview() {
  const [data, setData] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<OverviewStats>('/stats/overview', 'GET')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Загружаем статистику…" />;
  if (!data) return <EmptyState icon="info" title="Статистика не найдена" />;

  return (
    <div className="fade-in">
      <PageHeader title="Общая статистика" subtitle="Сводка по всем вашим привычкам" />

      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>Общая активность за всё время</h3>
        <div className="grid grid-3">
          <TotalBlock value={data.totalHabits} label={plural(data.totalHabits, 'привычка создана', 'привычки создано', 'привычек создано')} />
          <TotalBlock value={data.totalDone} label={plural(data.totalDone, 'выполнение', 'выполнения', 'выполнений')} />
          <TotalBlock value={`${data.overallPercent}%`} label="общий процент выполнения" />
        </div>
      </div>

      <div className="grid grid-3 mb-3">
        {data.bestDay && (
          <BestBlock icon="calendar" color="var(--success)" title="Лучший день" value={`${data.bestDay.percent}%`} label={formatLongDate(data.bestDay.date)} />
        )}
        {data.bestWeek && (
          <BestBlock icon="chart" color="var(--info)" title="Лучшая неделя" value={`${data.bestWeek.percent}%`} label={`с ${formatLongDate(data.bestWeek.start)}`} />
        )}
        {data.bestMonth && (
          <BestBlock icon="trophy" color="var(--warning)" title="Лучший месяц" value={`${data.bestMonth.percent}%`} label={data.bestMonth.label} />
        )}
        {!data.bestDay && !data.bestWeek && !data.bestMonth && (
          <div className="card" style={{ padding: 20 }}><p className="text-muted">Пока нет данных</p></div>
        )}
      </div>

      <div className="grid grid-2 mb-3">
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Топ-3 успешные привычки</h3>
          {data.topHabits.length === 0 ? (
            <p className="text-muted">Нет данных</p>
          ) : (
            <div className="stack" style={{ gap: 12, marginTop: 12 }}>
              {data.topHabits.map((h, i) => (
                <RankRow key={h.id} place={i + 1} habit={h} />
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Самые провальные привычки</h3>
          {data.worstHabits.length === 0 ? (
            <p className="text-muted">Нет данных</p>
          ) : (
            <div className="stack" style={{ gap: 12, marginTop: 12 }}>
              {data.worstHabits.map((h, i) => (
                <RankRow key={h.id} place={i + 1} habit={h} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1.05rem' }}>Активность по месяцам</h3>
        <p className="text-muted" style={{ marginTop: 0 }}>Сколько привычек выполнено за каждый месяц</p>
        <BarChart
          data={data.monthlySeries.map((m) => ({ label: m.label.split(' ')[0].slice(0, 3), value: m.done }))}
          label={(v) => String(v)}
        />
      </div>
    </div>
  );
}

function TotalBlock({ value, label }: { value: number | string; label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 0' }}>
      <div style={{ fontWeight: 800, fontSize: '1.8rem' }}>{value}</div>
      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
}

function BestBlock({ icon, color, title, value, label }: { icon: string; color: string; title: string; value: string; label: string }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="row" style={{ color, marginBottom: 6 }}>
        <Icon name={icon} size={18} />
        <span style={{ fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>{value}</div>
      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
}

function RankRow({ place, habit }: { place: number; habit: { name: string; color: string; icon: string; percent: number } }) {
  return (
    <div className="row">
      <span className="badge badge-accent" style={{ minWidth: 28, justifyContent: 'center' }}>{place}</span>
      <span className="habit-icon" style={{ background: habit.color + '22', color: habit.color, width: 30, height: 30 }}>
        <Icon name={habit.icon} size={16} />
      </span>
      <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.name}</span>
      <span style={{ fontWeight: 800 }}>{habit.percent}%</span>
    </div>
  );
}