import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import { Button, Field, Input, useToast } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../api/client';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await register({ username, email, password, confirm });
      pushToast('Аккаунт создан. Добро пожаловать!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Регистрация"
      subtitle="Создайте аккаунт и начните выстраивать привычки"
      footer={
        <>
          <Link to="/login">Уже есть аккаунт? Войти</Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        {error && <div className="form-error-box">{error}</div>}
        <Field label="Логин">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="минимум 3 символа"
            autoComplete="username"
            required
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Пароль">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="минимум 6 символов"
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Подтверждение пароля">
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="повторите пароль"
            autoComplete="new-password"
            required
          />
        </Field>
        <Button type="submit" block size="lg" disabled={loading}>
          {loading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
        </Button>
      </form>
    </AuthLayout>
  );
}