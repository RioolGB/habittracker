import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import {
  api,
  clearSession,
  getStoredUser,
  storeSession,
} from '../api/client';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    confirm: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Проверяем валидность сессии при загрузке
    api<{ user: User }>('/auth/me', 'GET')
      .then((data) => {
        setUser(data.user);
        storeSessionApiUser(data.user);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const storeSessionApiUser = (u: User) => {
    // Обновляем сохранённого пользователя в localStorage без смены токенов
    const stored = localStorage.getItem('ht.user');
    if (stored) {
      localStorage.setItem('ht.user', JSON.stringify(u));
    }
  };

  const login = useCallback(async (login: string, password: string) => {
    const data = await api<AuthResponse>('/auth/login', 'POST', { login, password });
    storeSession(data.accessToken, data.refreshToken, data.user);
    setUser(data.user);
  }, []);

  const register = useCallback(async (data: {
    username: string;
    email: string;
    password: string;
    confirm: string;
  }) => {
    const res = await api<AuthResponse>('/auth/register', 'POST', data);
    storeSession(res.accessToken, res.refreshToken, res.user);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('ht.refresh');
    try {
      if (refreshToken) {
        await api<void>('/auth/logout', 'POST', { refreshToken });
      }
    } catch {
      /* ignore */
    }
    clearSession();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await api<{ user: User }>('/user/me', 'GET');
    setUser(data.user);
    const stored = localStorage.getItem('ht.user');
    if (stored) localStorage.setItem('ht.user', JSON.stringify(data.user));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, initializing, login, register, logout, setUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return ctx;
}