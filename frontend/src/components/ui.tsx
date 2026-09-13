import { createContext, useCallback, useContext, useState } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Icon } from './Icon';
export { Icon } from './Icon';

/* ---------- Кнопки ---------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'danger-outline';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    variant === 'primary' ? 'btn-primary' : '',
    variant === 'outline' ? 'btn-outline' : '',
    variant === 'ghost' ? 'btn-ghost' : '',
    variant === 'danger' ? 'btn-danger' : '',
    variant === 'danger-outline' ? 'btn-danger-outline' : '',
    size === 'sm' ? 'btn-sm' : '',
    size === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Поля ввода ---------- */
interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="select" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />;
}

/* ---------- Чекбокс выполнения ---------- */
export function HabitCheckbox({
  checked,
  onChange,
  color,
}: {
  checked: boolean;
  onChange: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      className="habit-check-button"
      onClick={onChange}
      aria-pressed={checked}
      aria-label={checked ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
    >
      <span
        className={'habit-check' + (checked ? ' checked' : '')}
        style={checked && color ? { background: color, borderColor: color } : undefined}
      >
        <Icon name="check" size={16} strokeWidth={3} />
      </span>
    </button>
  );
}

/* ---------- Прогресс-бар ---------- */
export function ProgressBar({
  value,
  max,
  className = '',
  successColor = false,
}: {
  value: number;
  max: number;
  className?: string;
  successColor?: boolean;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={'progress ' + className}>
      <div
        className={'progress-fill' + (successColor && percent >= 100 ? ' success' : '')}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/* ---------- Модальное окно ---------- */
export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Закрыть">
            <Icon name="x" size={18} />
          </Button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Подтверждение ---------- */
export function ConfirmDialog({
  title,
  message,
  confirmText = 'Удалить',
  danger = true,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{message}</p>
    </Modal>
  );
}

/* ---------- Тосты ---------- */
type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ pushToast: (message: string, type?: ToastType) => void } | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="toast-viewport">
        {toasts.map((t) => (
          <div key={t.id} className={'toast ' + t.type}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): { pushToast: (message: string, type?: ToastType) => void } {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast должен использоваться внутри ToastProvider');
  return ctx;
}

/* ---------- Пустое состояние ---------- */
export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="center" style={{ padding: '40px 16px' }}>
      <div style={{ fontSize: 40, color: 'var(--text-muted)', marginBottom: 12 }}>
        <Icon name={icon} size={44} />
      </div>
      <h3>{title}</h3>
      {text && <p className="text-secondary" style={{ maxWidth: 420, margin: '0 auto 16px' }}>{text}</p>}
      {action}
    </div>
  );
}

/* ---------- Загрузка ---------- */
export function Loading({ label = 'Загрузка…' }: { label?: string }) {
  return <div className="text-muted center" style={{ padding: '40px 0' }}>{label}</div>;
}