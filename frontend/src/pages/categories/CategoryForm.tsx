import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import { Button, Field, Input, Loading, useToast } from '../../components/ui';
import { ColorPicker, IconPicker } from '../../components/pickers';
import { PageHeader } from '../../layouts/AppLayout';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../constants';

export default function CategoryForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState('#8b5cf6');
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api<{ categories: Array<{ id: string; name: string; icon: string; color: string; isGlobal: boolean }> }>('/categories', 'GET')
      .then((data) => {
        const cat = data.categories.find((c) => c.id === id);
        if (!cat) throw new ApiError(404, 'Категория не найдена');
        if (cat.isGlobal) throw new ApiError(403, 'Глобальные категории нельзя редактировать');
        setName(cat.name);
        setIcon(cat.icon);
        setColor(cat.color);
      })
      .catch((err) => {
        pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
        navigate('/categories');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate, pushToast]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const body = { name: name.trim(), icon, color };
      if (isEdit) {
        await api('/categories/' + id, 'PUT', body);
        pushToast('Категория обновлена', 'success');
      } else {
        await api('/categories', 'POST', body);
        pushToast('Категория создана', 'success');
      }
      navigate('/categories');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить');
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Загружаем категорию…" />;

  return (
    <div className="fade-in" style={{ maxWidth: 640 }}>
      <PageHeader title={isEdit ? 'Редактирование категории' : 'Новая категория'} />
      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        {error && <div className="form-error-box">{error}</div>}
        <Field label="Название категории">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Отдых" maxLength={100} required />
        </Field>
        <Field label="Иконка">
          <IconPicker icons={CATEGORY_ICONS} value={icon} onChange={setIcon} />
        </Field>
        <Field label="Цвет">
          <ColorPicker colors={CATEGORY_COLORS} value={color} onChange={setColor} />
        </Field>
        <div className="row mt-3">
          <Button type="submit" size="lg" disabled={saving || !name.trim()}>
            {saving ? 'Сохраняем…' : isEdit ? 'Сохранить изменения' : 'Создать категорию'}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate(-1)}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}