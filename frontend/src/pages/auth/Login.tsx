import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import { Button, Field, Input, useToast } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginValue, password);
      pushToast('С возвращением!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Вход"
      subtitle="Рады видеть вас снова!"
      footer={
        <>
          <Link to="/register">Нет аккаунта? Зарегистрироваться</Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        {error && <div className="form-error-box">{error}</div>}
        <Field label="Логин или email">
          <Input
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            placeholder="ваш-логин или email"
            autoComplete="username"
            required
          />
        </Field>
        <Field label="Пароль">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </Field>
        <div className="row-between mb-2">
          <Link to="/forgot-password" style={{ fontSize: '0.85rem' }}>Забыли пароль?</Link>
        </div>
        <Button type="submit" block size="lg" disabled={loading}>
          {loading ? 'Входим…' : 'Войти'}
        </Button>
      </form>
    </AuthLayout>
  );
}