import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { useTheme } from '../contexts/ThemeContext';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="row-between" style={{ padding: '18px 24px' }}>
        <Link to="/" className="row" style={{ color: 'var(--text)', fontWeight: 800, fontSize: 18, textDecoration: 'none' }}>
          <span className="logo-mark" style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="flame" size={20} strokeWidth={2.2} />
          </span>
          HabitTracker
        </Link>
        <button className="btn btn-ghost btn-sm" onClick={toggleTheme} aria-label="Переключить тему">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px 48px' }}>
        <div className="card" style={{ width: '100%', maxWidth: 420, padding: '28px 28px 24px' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>{title}</h1>
          {subtitle && <p className="text-secondary" style={{ marginTop: 0 }}>{subtitle}</p>}
          {children}
          {footer && <div className="text-secondary center mt-3" style={{ fontSize: '0.9rem' }}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}