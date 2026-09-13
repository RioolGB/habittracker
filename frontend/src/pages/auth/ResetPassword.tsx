import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import { Button, Field, Input, useToast } from '../../components/ui';
import { api, ApiError } from '../../api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Ссылка некорректна: отсутствует токен');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/reset-password', 'POST', { token, password });
      setDone(true);
      pushToast('Пароль изменён. Войдите с новым паролем', 'success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сбросить пароль');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Готово!">
        <p className="text-secondary">Пароль успешно изменён. Войдите в аккаунт с новым паролем.</p>
        <Button block size="lg" onClick={() => navigate('/login')}>
          Войти
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Новый пароль"
      subtitle="Введите новый пароль для вашего аккаунта"
      footer={<Link to="/login">Уже помните? Войти</Link>}
    >
      <form onSubmit={submit} noValidate>
        {error && <div className="form-error-box">{error}</div>}
        <Field label="Новый пароль">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="минимум 6 символов"
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Подтверждение нового пароля">
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
          {loading ? 'Сохраняем…' : 'Сбросить пароль'}
        </Button>
      </form>
    </AuthLayout>
  );
}