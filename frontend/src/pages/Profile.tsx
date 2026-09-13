import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, downloadExport } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, ConfirmDialog, Field, Icon, Input, useToast } from '../components/ui';
import { PageHeader } from '../layouts/AppLayout';
import type { User } from '../types';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setSavingProfile(true);
    try {
      const data = await api<{ user: User }>('/user/profile', 'PUT', { name, username, email });
      setUser(data.user);
      pushToast('Профиль сохранён', 'success');
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Не удалось сохранить');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (newPassword !== confirmPassword) {
      setPassError('Пароли не совпадают');
      return;
    }
    setSavingPass(true);
    try {
      await api('/user/password', 'POST', { oldPassword, newPassword, confirm: confirmPassword });
      pushToast('Пароль изменён', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err instanceof ApiError ? err.message : 'Не удалось изменить пароль');
    } finally {
      setSavingPass(false);
    }
  };

  const toggleNotifications = async (field: 'emailEnabled' | 'pushEnabled', value: boolean) => {
    const next = {
      emailEnabled: field === 'emailEnabled' ? value : (user?.emailEnabled ?? false),
      pushEnabled: field === 'pushEnabled' ? value : (user?.pushEnabled ?? false),
    };
    try {
      const data = await api<{ user: User }>('/user/notifications', 'PUT', next);
      setUser(data.user);
      pushToast('Настройки уведомлений обновлены', 'success');
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
    }
  };

  const deleteAccount = async () => {
    try {
      await api('/user/account', 'DELETE');
      pushToast('Аккаунт и все данные удалены', 'success');
      await logout();
      navigate('/');
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      <PageHeader title="Профиль и настройки" subtitle="Управляйте своими данными и уведомлениями" />
      <div className="stack">
        <section className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Личные данные</h3>
          <form onSubmit={saveProfile} noValidate>
            {profileError && <div className="form-error-box">{profileError}</div>}
            <div className="grid grid-2">
              <Field label="Имя">
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
              </Field>
              <Field label="Логин">
                <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
              </Field>
            </div>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Button type="submit" disabled={savingProfile}>{savingProfile ? 'Сохраняем…' : 'Сохранить'}</Button>
          </form>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Безопасность</h3>
          <form onSubmit={changePassword} noValidate>
            {passError && <div className="form-error-box">{passError}</div>}
            <Field label="Старый пароль">
              <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            <div className="grid grid-2">
              <Field label="Новый пароль">
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
              </Field>
              <Field label="Подтверждение нового пароля">
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
              </Field>
            </div>
            <Button type="submit" variant="outline" disabled={savingPass}>{savingPass ? 'Изменяем…' : 'Изменить пароль'}</Button>
          </form>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Уведомления</h3>
          <div className="stack" style={{ gap: 10 }}>
            <ToggleRow
              icon="mail"
              label="Email-уведомления"
              hint="Письма о напоминаниях привычек"
              checked={user?.emailEnabled ?? false}
              onChange={(v) => void toggleNotifications('emailEnabled', v)}
            />
            <ToggleRow
              icon="bell"
              label="Push-уведомления"
              hint="Напоминания через браузер"
              checked={user?.pushEnabled ?? false}
              onChange={(v) => void toggleNotifications('pushEnabled', v)}
            />
          </div>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Внешний вид</h3>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 600 }}>Тема {theme === 'dark' ? 'тёмная' : 'светлая'}</div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>По умолчанию — тёмная тема</div>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
              Переключить
            </Button>
          </div>
        </section>

        <section className="card" style={{ padding: 24, borderColor: 'var(--danger)' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--danger)' }}>Данные</h3>
          <div className="row flex-wrap">
            <Button variant="outline" onClick={downloadExport}>
              <Icon name="download" size={16} /> Экспорт в CSV
            </Button>
            <Button variant="danger-outline" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" size={16} /> Удалить все данные
            </Button>
          </div>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: 0 }}>
            Удаление аккаунта безвозвратно удалит все привычки, историю и статистику.
          </p>
        </section>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Удалить аккаунт?"
          message={`Это действие удалит аккаунт «${user?.username}» и все связанные данные без возможности восстановления. Вы уверены?`}
          confirmText="Удалить всё"
          onConfirm={() => void deleteAccount()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="row-between">
      <div className="row">
        <span style={{ color: 'var(--accent)' }}><Icon name={icon} size={20} /></span>
        <div>
          <div style={{ fontWeight: 600 }}>{label}</div>
          <div className="text-muted" style={{ fontSize: '0.82rem' }}>{hint}</div>
        </div>
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch-slider" />
      </label>
    </div>
  );
}