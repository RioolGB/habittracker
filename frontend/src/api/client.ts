import type { User } from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

const ACCESS_KEY = 'ht.access';
const REFRESH_KEY = 'ht.refresh';
const USER_KEY = 'ht.user';

export interface StoredUser extends User {}

let refreshInFlight: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function storeSession(accessToken: string, refreshToken: string, user: User): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const data = (await res.json()) as { accessToken: string; refreshToken: string; user: User };
  storeSession(data.accessToken, data.refreshToken, data.user);
  return data.accessToken;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<T> {
  let token = getAccessToken();
  if (path === '/auth/refresh' || path.startsWith('/auth/login') || path.startsWith('/auth/register')) {
    token = null;
  }

  const doFetch = (t: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(token);

  if (res.status === 401 && token) {
    if (!refreshInFlight) {
      refreshInFlight = refreshTokens().finally(() => {
        refreshInFlight = null;
      });
    }
    const newToken = await refreshInFlight;
    if (newToken) {
      res = await doFetch(newToken);
    } else {
      throw new ApiError(401, 'Сессия истекла, войдите снова');
    }
  }

  if (!res.ok) {
    let message = `Ошибка ${res.status}`;
    let details: unknown;
    try {
      const data = (await res.json()) as { error?: string; details?: unknown };
      if (data.error) message = data.error;
      details = data.details;
    } catch {
      /* тело не JSON */
    }
    throw new ApiError(res.status, message, details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function downloadExport(): void {
  const token = getAccessToken();
  fetch(`${BASE_URL}/user/export.csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then((res) => {
      if (!res.ok) throw new Error('Ошибка экспорта');
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habittracker-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })
    .catch((err) => console.error(err));
}