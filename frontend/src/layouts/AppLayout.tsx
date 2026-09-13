import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui';

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'home', label: 'Дашборд', end: true },
  { to: '/habits', icon: 'target', label: 'Привычки' },
  { to: '/categories', icon: 'tag', label: 'Категории' },
  { to: '/calendar', icon: 'calendar', label: 'Календарь' },
  { to: '/stats', icon: 'chart', label: 'Статистика' },
  { to: '/profile', icon: 'user', label: 'Профиль' },
];

function Logo() {
  return (
    <div className="sidebar-logo">
      <span className="logo-mark">
        <Icon name="flame" size={20} strokeWidth={2.2} />
      </span>
      <span>HabitTracker</span>
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Основная навигация">
        <Logo />
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-link" onClick={toggleTheme} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>
          <div className="row" style={{ padding: '6px 12px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name ?? user?.username}
              </div>
              <div className="text-muted" style={{ fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
            <div className="spacer" />
            <Button variant="ghost" size="sm" onClick={handleLogout} title="Выйти">
              <Icon name="logout" size={18} />
              <span className="nav-logout-text">Выйти</span>
            </Button>
          </div>
        </div>
      </aside>

      <main className="main" id="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Нижняя навигация">
        <div className="bottom-nav-inner">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' active' : '')}
            >
              <Icon name={item.icon} size={22} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header row-between flex-wrap">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="text-secondary">{subtitle}</div>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}