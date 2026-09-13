import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '../../types';
import { api, ApiError } from '../../api/client';
import { Button, ConfirmDialog, EmptyState, Icon, Loading, useToast } from '../../components/ui';
import { PageHeader } from '../../layouts/AppLayout';

export default function CategoriesList() {
  const { pushToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ categories: Category[] }>('/categories', 'GET');
      setCategories(data.categories);
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const deleteCategory = async () => {
    if (!toDelete) return;
    try {
      await api('/categories/' + toDelete.id, 'DELETE');
      pushToast('Категория удалена', 'success');
      setToDelete(null);
      await load();
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : 'Ошибка', 'error');
    }
  };

  if (loading) return <Loading label="Загружаем категории…" />;

  const global = categories.filter((c) => c.isGlobal);
  const user = categories.filter((c) => !c.isGlobal);

  return (
    <div className="fade-in">
      <PageHeader
        title="Категории"
        subtitle="Глобальные категории нельзя редактировать или удалять"
        actions={
          <Link to="/categories/new" className="btn btn-primary">
            <Icon name="plus" size={16} /> Создать категорию
          </Link>
        }
      />

      {categories.length === 0 ? (
        <EmptyState icon="tag" title="Категорий пока нет" action={<Link to="/categories/new" className="btn btn-primary">Создать категорию</Link>} />
      ) : (
        <div className="stack">
          <section>
            <h3 className="text-muted" style={{ marginBottom: 10 }}>Глобальные</h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {global.map((c) => (
                <div className="card" key={c.id} style={{ padding: 16 }}>
                  <div className="row">
                    <span className="habit-icon" style={{ background: c.color + '22', color: c.color }}>
                      <Icon name={c.icon} size={20} />
                    </span>
                    <span style={{ fontWeight: 700 }}>{c.name}</span>
                    <span className="spacer" />
                    <span className="badge">глобальная</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {user.length > 0 && (
            <section>
              <h3 className="text-muted" style={{ marginBottom: 10 }}>Мои категории</h3>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {user.map((c) => (
                  <div className="card" key={c.id} style={{ padding: 16 }}>
                    <div className="row">
                      <span className="habit-icon" style={{ background: c.color + '22', color: c.color }}>
                        <Icon name={c.icon} size={20} />
                      </span>
                      <span style={{ fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    </div>
                    <div className="row mt-2">
                      <Link to={`/categories/${c.id}/edit`} className="btn btn-outline btn-sm">
                        <Icon name="edit" size={14} /> Изменить
                      </Link>
                      <Button variant="danger-outline" size="sm" onClick={() => setToDelete(c)}>
                        <Icon name="trash" size={14} /> Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Удалить категорию?"
          message={`Категория «${toDelete.name}» будет удалена. Привычки останутся, но будут без категории.`}
          onConfirm={() => void deleteCategory()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}