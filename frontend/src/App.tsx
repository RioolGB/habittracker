import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider, syncThemeToServer } from './contexts/ThemeContext';
import { AppLayout } from './layouts/AppLayout';
import { Loading } from './components/ui';
import { useCallback } from 'react';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import HabitsList from './pages/habits/HabitsList';
import HabitForm from './pages/habits/HabitForm';
import HabitStats from './pages/habits/HabitStats';
import CategoriesList from './pages/categories/CategoriesList';
import CategoryForm from './pages/categories/CategoryForm';
import CalendarPage from './pages/CalendarPage';
import StatsOverview from './pages/StatsOverview';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function Protected({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  if (initializing) return <Loading label="Загрузка приложения…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  if (initializing) return <Loading label="Загрузка…" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();

  const handleThemeChange = useCallback(
    (theme: 'dark' | 'light') => {
      void syncThemeToServer(user, theme);
    },
    [user],
  );

  return (
    <ThemeProvider initialTheme={user?.theme} onThemeChange={handleThemeChange}>
      <Routes>
        {/* Публичные */}
        <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
        <Route path="/reset-password" element={<PublicOnly><ResetPassword /></PublicOnly>} />

        {/* Приложение */}
        <Route
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/habits" element={<HabitsList />} />
          <Route path="/habits/new" element={<HabitForm />} />
          <Route path="/habits/:id/edit" element={<HabitForm />} />
          <Route path="/habits/:id/stats" element={<HabitStats />} />
          <Route path="/categories" element={<CategoriesList />} />
          <Route path="/categories/new" element={<CategoryForm />} />
          <Route path="/categories/:id/edit" element={<CategoryForm />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/stats" element={<StatsOverview />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
}