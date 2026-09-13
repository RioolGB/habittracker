import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { api } from '../api/client';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function ThemeProvider({
  children,
  initialTheme,
  onThemeChange,
}: {
  children: ReactNode;
  initialTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('ht.theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return initialTheme ?? 'dark';
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('ht.theme', theme);
    onThemeChange?.(theme);
  }, [theme, onThemeChange]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme должен использоваться внутри ThemeProvider');
  return ctx;
}

export async function syncThemeToServer(user: User | null, theme: Theme): Promise<void> {
  if (!user) return;
  try {
    await api('/user/theme', 'PUT', { theme });
  } catch {
    /* ignore */
  }
}