import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui';

export default function NotFound() {
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const target = !initializing && user ? '/dashboard' : '/';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="center" style={{ maxWidth: 480 }}>
        <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--accent)' }}>404</div>
        <h1>Страница не найдена</h1>
        <p className="text-secondary">
          К сожалению, страница, которую вы ищете, не существует.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link to={target} className="btn btn-primary">
            Вернуться на главную
          </Link>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
}