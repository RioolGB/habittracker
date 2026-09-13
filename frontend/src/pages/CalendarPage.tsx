import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, HabitCheckbox, Input, Loading, Modal, useToast } from '../components/ui';
import type { CalendarDay, CalendarResponse, CalendarDayDetail } from '../types';
import { api, ApiError } from '../api/client';
import { PageHeader } from '../layouts/AppLayout';
import { addMonths, currentMonthKey, monthName, monthGrid, todayStr } from '../utils/dates';

const DOW_HEADERS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function CalendarPage() {
  const { pushToast } = useToast();
  const [month, setMonth] = useState(currentMonthKey());
  const [days, setDays] = useState<Record<string, CalendarDay>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<CalendarResponse>('/calendar?month=' + month, 'GET');
      const map: Record<string, CalendarDay> = {};
      for (const d of data.days) map[d.date] = d;
      setDays(map);
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка загрузки календаря', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = todayStr();
  const cells = monthGrid(month);

  return (
    <div className="fade-in">
      <PageHeader title="Календарь" subtitle="История выполнения привычек по дням" />

      <div className="card" style={{ padding: 20 }}>
        <div className="row-between mb-3">
          <Button variant="outline" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Предыдущий месяц">
            <Icon name="arrowLeft" size={18} />
          </Button>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', textTransform: 'capitalize' }}>
            {monthName(month)}
          </div>
          <Button variant="outline" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Следующий месяц">
            <Icon name="arrowRight" size={18} />
          </Button>
        </div>

        <div className="row-between mb-2">
          <Button variant="ghost" size="sm" onClick={() => setMonth(currentMonthKey())}>
            Сегодня
          </Button>
          <div className="row" style={{ gap: 12, fontSize: '0.8rem' }}>
            <span className="row" style={{ gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--success-soft)', border: '1px solid var(--success)' }} /> Все</span>
            <span className="row" style={{ gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--warning-soft)', border: '1px solid var(--warning)' }} /> Частично</span>
            <span className="row" style={{ gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--bg-hover)' }} /> Пусто</span>
          </div>
        </div>

        {loading ? (
          <Loading label="Загружаем месяц…" />
        ) : (
          <div className="calendar-grid">
            {DOW_HEADERS.map((d) => (
              <div key={d} className="calendar-header-cell">{d}</div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`e${i}`} className="calendar-cell empty" />;
              const info = days[date];
              const isToday = date === today;
              const status: 'full' | 'partial' | 'empty' | 'none' = info ? info.status : 'none';
              const className = [
                'calendar-cell',
                isToday ? 'today' : '',
                status === 'full' ? 'full' : '',
                status === 'partial' ? 'partial' : '',
                status === 'empty' || status === 'none' ? 'empty-state' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button key={date} className={className} onClick={() => setSelectedDate(date)} aria-label={`${date}: ${info ? info.done : 0} из ${info ? info.scheduled : 0}`}>
                  <span>{Number(date.slice(8))}</span>
                  {info && info.scheduled > 0 && (
                    <span className="cell-ratio">{info.done}/{info.scheduled}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 row" style={{ fontSize: '0.85rem' }}>
        <span className="text-muted">Кликните на день, чтобы отметить или исправить выполнение за прошлые дни.</span>
      </div>

      {selectedDate && (
        <DayModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onChanged={() => {
            void load();
          }}
        />
      )}
    </div>
  );
}

function DayModal({ date, onClose, onChanged }: { date: string; onClose: () => void; onChanged: () => void }) {
  const { pushToast } = useToast();
  const [items, setItems] = useState<CalendarDayDetail[] | null>(null);

  useEffect(() => {
    api<{ date: string; items: CalendarDayDetail[] }>('/calendar/' + date, 'GET')
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, [date]);

  const setEntry = async (habitId: string, completed: boolean, value?: number) => {
    try {
      if (completed) {
        // снять отметку
        await api('/habits/' + habitId + '/entries/' + date, 'DELETE');
        pushToast('Отметка снята', 'info');
      } else {
        if (typeof value === 'number') {
          await api('/habits/' + habitId + '/entries', 'POST', { date, value });
        } else {
          await api('/habits/' + habitId + '/entries', 'POST', { date, completed: true });
        }
        pushToast('Выполнение отмечено', 'success');
      }
      onChanged();
      const d = await api<{ date: string; items: CalendarDayDetail[] }>('/calendar/' + date, 'GET');
      setItems(d.items);
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
    }
  };

  const scheduled = (items ?? []).filter((i) => i.scheduled);
  const doneCount = scheduled.filter((i) => i.completed).length;

  return (
    <Modal
      title={`${date}`}
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>Закрыть</Button>
      }
    >
      {!items ? (
        <Loading label="Загружаем день…" />
      ) : scheduled.length === 0 ? (
        <p className="text-secondary">На этот день нет запланированных привычек.</p>
      ) : (
        <>
          <div className="row-between mb-2">
            <span className="text-secondary">Выполнено {doneCount} из {scheduled.length}</span>
            <span className="text-muted">{date}</span>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {scheduled.map((entry) => (
              <div className="habit-card card" key={entry.habit.id} style={{ padding: 12 }}>
                <span className="habit-icon" style={{ background: entry.habit.color + '22', color: entry.habit.color, width: 36, height: 36 }}>
                  <Icon name={entry.habit.icon} size={18} />
                </span>
                <div className="habit-info">
                  <div className="habit-name" style={{ fontSize: '0.92rem' }}>{entry.habit.name}</div>
                  <div className="habit-meta">
                    {entry.habit.category?.name ?? 'Без категории'}
                    {entry.habit.isArchived ? ' · в архиве' : ''}
                  </div>
                </div>
                {entry.habit.type === 'numeric' && (
                  <NumericInline
                    completed={entry.completed}
                    value={entry.value}
                    unit={entry.habit.unit}
                    onSave={(v) => void setEntry(entry.habit.id, false, v)}
                  />
                )}
                <HabitCheckbox
                  checked={entry.completed}
                  onChange={() => void setEntry(entry.habit.id, entry.completed)}
                  color={entry.habit.color}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

function NumericInline({
  completed,
  value,
  unit,
  onSave,
}: {
  completed: boolean;
  value: number | null;
  unit: string | null;
  onSave: (v: number) => void;
}) {
  const [val, setVal] = useState(value != null ? String(value) : '');
  return (
    <form
      className="row"
      style={{ gap: 6 }}
      onSubmit={(e) => {
        e.preventDefault();
        const n = parseFloat(val.replace(',', '.'));
        if (Number.isFinite(n)) onSave(n);
      }}
    >
      <Input
        type="number"
        min={0}
        step="any"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={completed}
        style={{ width: 70, textAlign: 'center', padding: '8px 6px' }}
        aria-label="Значение"
      />
      {unit && <span className="text-muted" style={{ fontSize: '0.8rem' }}>{unit}</span>}
    </form>
  );
}