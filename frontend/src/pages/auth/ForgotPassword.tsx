import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import { Button, Field, Input } from '../../components/ui';
import { api, ApiError } from '../../api/client';

interface ForgotResponse {
  message: string;
  devResetUrl?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<ForgotResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api<ForgotResponse>('/auth/forgot-password', 'POST', { email });
      setSent(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отправить запрос');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Проверьте почту" subtitle={sent.message}>
        <p className="text-secondary">
          {sent.devResetUrl
            ? 'В режиме разработки email-сервис не подключён — воспользуйтесь ссылкой ниже для сброса пароля.'
            : ''}
        </p>
        {sent.devResetUrl && (
          <div className="card" style={{ padding: 12, marginBottom: 16, wordBreak: 'break-all', background: 'var(--bg-soft)' }}>
            <a href={sent.devResetUrl} style={{ fontSize: '0.85rem' }}>{sent.devResetUrl}</a>
          </div>
        )}
        <Link to="/login" style={{ fontSize: '0.9rem' }}>← Вернуться ко входу</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Восстановление пароля"
      subtitle="Укажите email — мы отправим инструкцию"
      footer={<Link to="/login">Вспомнили пароль? Войти</Link>}
    >
      <form onSubmit={submit} noValidate>
        {error && <div className="form-error-box">{error}</div>}
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>
        <Button type="submit" block size="lg" disabled={loading}>
          {loading ? 'Отправляем…' : 'Получить инструкцию'}
        </Button>
      </form>
    </AuthLayout>
  );
}