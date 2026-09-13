import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui';

const STEPS = [
  { icon: 'plus', title: 'Создай привычку', text: 'Назови цель, выбери иконку, периодичность и напоминание.' },
  { icon: 'chart', title: 'Отслеживай прогресс', text: 'Отмечай выполнение каждый день и следи за стриками.' },
  { icon: 'trophy', title: 'Достигай целей', text: 'Получай статистику, мотивацию и рекорды.' },
];

const FEATURES = [
  { icon: 'flame', title: 'Стрики', text: 'Дни подряд с огоньком 🔥 и лимитом пропусков' },
  { icon: 'chart', title: 'Статистика', text: 'Проценты, графики, топ привычек' },
  { icon: 'bell', title: 'Напоминания', text: 'Push и email — в заданное время' },
  { icon: 'calendar', title: 'Календарь', text: 'История выполнения по дням и месяцам' },
  { icon: 'sparkles', title: 'Мотивация', text: 'Сравнение с прошлым и подбадривающие сообщения' },
  { icon: 'pencil', title: 'Гибкие привычки', text: 'Бинарные и количественные, с целями и единицами' },
];

const BENEFITS = [
  { icon: 'smile', title: 'Простота', text: 'Интерфейс понятен с первого взгляда' },
  { icon: 'flame', title: 'Мотивация', text: 'Сравнение с прошлыми результатами' },
  { icon: 'target', title: 'Гибкость', text: 'Периодичность, единицы, лимиты — настрой под себя' },
  { icon: 'user', title: 'Приватность', text: 'Каждый ведёт свои привычки независимо' },
];

const MOCK_HABITS = [
  { name: 'Читать 30 минут', icon: 'book', color: '#8b5cf6', state: 'done' },
  { name: 'Выпить 8 стаканов воды', icon: 'drop', color: '#06b6d4', state: 'done' },
  { name: 'Тренировка', icon: 'dumbbell', color: '#f59e0b', state: 'pending' },
  { name: 'Сон до 23:00', icon: 'moon', color: '#6366f1', state: 'pending' },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="row" style={{ fontWeight: 800, fontSize: 18 }}>
          <span className="logo-mark" style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="flame" size={20} strokeWidth={2.2} />
          </span>
          HabitTracker
        </div>
        <div className="row">
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme} aria-label="Переключить тему">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
          <Button variant="outline" size="sm" onClick={() => (window.location.href = '/login')}>
            Войти
          </Button>
          <Button size="sm" onClick={() => (window.location.href = '/register')}>
            Начать бесплатно
          </Button>
        </div>
      </header>

      <section className="hero">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <span className="badge badge-accent" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
            <Icon name="flame" size={16} /> Личный трекер привычек
          </span>
        </div>
        <h1>Выстрой дисциплину и укрепи свои привычки</h1>
        <p className="hero-sub">
          HabitTracker — личный трекер, который помогает формировать привычки через визуализацию прогресса,
          стрики, напоминания и детальную статистику.
        </p>
        <Button size="lg" onClick={() => (window.location.href = '/register')}>
          <Icon name="sparkles" size={18} /> Начать бесплатно
        </Button>

        <div className="landing-note">
          <Icon name="user" size={18} /> Это личный трекер привычек для каждого пользователя. Вы регистрируетесь
          и ведёте свои привычки независимо от других.
        </div>
      </section>

      <section className="landing-section">
        <h2>Как это работает</h2>
        <div className="grid grid-3">
          {STEPS.map((s, i) => (
            <div className="card" key={s.title} style={{ padding: 24 }}>
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="habit-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  <Icon name={s.icon} size={22} />
                </span>
                <span className="badge badge-accent">Шаг {i + 1}</span>
              </div>
              <h3 style={{ marginBottom: 6 }}>{s.title}</h3>
              <p className="text-secondary" style={{ margin: 0 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>Ключевые возможности</h2>
        <div className="grid grid-3">
          {FEATURES.map((f) => (
            <div className="card" key={f.title} style={{ padding: 20 }}>
              <span className="row" style={{ color: 'var(--accent)', marginBottom: 8 }}>
                <Icon name={f.icon} size={22} />
              </span>
              <h4 style={{ marginBottom: 4 }}>{f.title}</h4>
              <p className="text-muted" style={{ margin: 0 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>Пример дашборда</h2>
        <div className="card" style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
          <div className="row-between mb-2">
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Доброе утро, Алекс! ☀️</div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>Понедельник, 14 сентября 2026</div>
            </div>
            <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Выполнено 2 из 4</div>
          </div>
          <div className="progress mb-3"><div className="progress-fill" style={{ width: '50%' }} /></div>
          <div className="stack">
            {MOCK_HABITS.map((h) => (
              <div className="habit-card card" key={h.name} style={{ boxShadow: 'none' }}>
                <span className="habit-icon" style={{ background: h.color + '22', color: h.color }}>
                  <Icon name={h.icon} size={22} />
                </span>
                <span className="habit-info habit-name" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{h.name}</span>
                <span className={'badge ' + (h.state === 'done' ? 'badge-success' : 'badge-warning')}>
                  {h.state === 'done' ? 'Выполнено' : 'Предстоит'}
                </span>
              </div>
            ))}
          </div>
          <div className="row mt-3">
            <Button>+ Добавить привычку</Button>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2>Преимущества</h2>
        <div className="grid grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {BENEFITS.map((b) => (
            <div key={b.title} className="card" style={{ padding: 20, textAlign: 'center' }}>
              <span style={{ color: 'var(--accent)', fontSize: 24 }}><Icon name={b.icon} size={26} /></span>
              <h4 style={{ margin: '8px 0 4px' }}>{b.title}</h4>
              <p className="text-muted" style={{ margin: 0 }}>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section center">
        <h2>Готовы начать?</h2>
        <p className="text-secondary" style={{ maxWidth: 480, margin: '0 auto 24px' }}>
          Создайте аккаунт бесплатно и начните выстраивать дисциплину уже сегодня.
        </p>
        <Button size="lg" onClick={() => (window.location.href = '/register')}>
          Начать бесплатно
        </Button>
      </section>

      <footer className="landing-section" style={{ paddingTop: 0 }}>
        <hr className="divider" />
        <div className="row-between flex-wrap">
          <div className="text-muted">© 2026 HabitTracker · Личный трекер привычек</div>
          <div className="row">
            <Link to="/login">Вход</Link>
            <span className="text-muted">·</span>
            <Link to="/register">Регистрация</Link>
            <span className="text-muted">·</span>
            <span className="text-muted">Контакты: support@habittracker.app</span>
          </div>
        </div>
      </footer>
    </div>
  );
}