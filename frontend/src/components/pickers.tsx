import type { ReactNode } from 'react';
import { Icon } from './Icon';

/* ---------- Выбор иконки из библиотеки ---------- */
export function IconPicker({
  icons,
  value,
  onChange,
}: {
  icons: string[];
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Выберите иконку">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
        {icons.map((icon) => (
          <button
            key={icon}
            type="button"
            role="radio"
            aria-checked={value === icon}
            onClick={() => onChange(icon)}
            className="btn"
            style={{
              padding: 10,
              borderRadius: 12,
              border: `2px solid ${value === icon ? 'var(--accent)' : 'var(--border)'}`,
              background: value === icon ? 'var(--accent-soft)' : 'transparent',
            }}
            title={icon}
          >
            <Icon name={icon} size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Палитра цветов ---------- */
export function ColorPicker({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Выберите цвет">
      <div className="row flex-wrap">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={value.toLowerCase() === color}
            onClick={() => onChange(color)}
            title={color}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: color,
              border: '2px solid transparent',
              outline: value.toLowerCase() === color ? `2px solid var(--text)` : 'none',
              outlineOffset: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Выбор дней недели ---------- */
const DOW_LABELS: Array<{ n: number; label: string }> = [
  { n: 1, label: 'Пн' },
  { n: 2, label: 'Вт' },
  { n: 3, label: 'Ср' },
  { n: 4, label: 'Чт' },
  { n: 5, label: 'Пт' },
  { n: 6, label: 'Сб' },
  { n: 7, label: 'Вс' },
];

export function WeekdayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (days: number[]) => void;
}) {
  const toggle = (n: number) => {
    if (value.includes(n)) {
      onChange(value.filter((d) => d !== n));
    } else {
      onChange([...value, n].sort((a, b) => a - b));
    }
  };

  return (
    <div className="row" role="group" aria-label="Дни недели">
      {DOW_LABELS.map(({ n, label }) => {
        const active = value.includes(n);
        return (
          <button
            key={n}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(n)}
            className="btn"
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 10,
              border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'var(--accent-soft)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 700,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Линейный график (SVG) ---------- */
export function LineChart({
  data,
  height = 220,
  width = 720,
  formatValue,
}: {
  data: Array<{ date: string; value: number }>;
  height?: number;
  width?: number;
  formatValue?: (v: number) => string;
}) {
  if (data.length === 0) {
    return <div className="text-muted center" style={{ padding: 24 }}>Нет данных для графика</div>;
  }

  const padX = 34;
  const padY = 12;
  const innerW = width - padX;
  const innerH = height - padY;

  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);

  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - ((d.value - min) / range) * innerH;
    return { x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L${points[points.length - 1].x.toFixed(1)},${(padY + innerH).toFixed(1)} L${points[0].x.toFixed(1)},${(padY + innerH).toFixed(1)} Z`;

  // Подписи дат: до 8 меток
  const labelIndexes: number[] = [];
  const maxLabels = 8;
  const stride = Math.max(1, Math.ceil(data.length / maxLabels));
  for (let i = 0; i < data.length; i += stride) labelIndexes.push(i);
  if (labelIndexes[labelIndexes.length - 1] !== data.length - 1) {
    labelIndexes.push(data.length - 1);
  }

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="График прогресса">
        {labelIndexes.map((i) => {
          const p = points[i];
          return (
            <text key={i} x={p.x} y={height - 2} textAnchor="middle" className="chart-label">
              {data[i].date.slice(5)}
            </text>
          );
        })}
        <path d={area} fill="var(--accent-soft)" stroke="none" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="var(--accent)" />
            <title>{`${data[i].date}: ${formatValue ? formatValue(data[i].value) : data[i].value}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ---------- Столбчатый график (SVG) ---------- */
export function BarChart({
  data,
  height = 260,
  width = 720,
  label,
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
  width?: number;
  label?: (v: number) => string;
}) {
  if (data.length === 0) {
    return <div className="text-muted center" style={{ padding: 24 }}>Нет данных</div>;
  }

  const padY = 18;
  const padX = 30;
  const innerW = width - padX;
  const innerH = height - padY;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = innerW / data.length;
  const barW = Math.max(6, slot * 0.55);

  const labelIndexes = data.map((_, i) => i).filter((i) => {
    if (data.length <= 12) return true;
    return i % Math.ceil(data.length / 12) === 0 || i === data.length - 1;
  });

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="График активности">
        {labelIndexes.map((i) => {
          const x = padX + i * slot + slot / 2;
          return (
            <text key={i} x={x} y={height - 2} textAnchor="middle" className="chart-label">
              {data[i].label}
            </text>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = padX + i * slot + (slot - barW) / 2;
          return (
            <g key={i}>
              <rect x={x} y={height - padY - h} width={barW} height={h} rx={4} fill="var(--accent)" opacity={0.85}>
                <title>{`${d.label}: ${label ? label(d.value) : d.value}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- Спиннер для кнопок ---------- */
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="spin" aria-hidden="true" style={{ animation: 'rotate 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={3} strokeDasharray="40" strokeLinecap="round" />
      <style>{'@keyframes rotate { to { transform: rotate(360deg); } }'}</style>
    </svg>
  );
}

export function RadioCards<T extends string | number>({
  options,
  value,
  onChange,
  render,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  render?: (v: T) => ReactNode;
}) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
      {options.map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => onChange(opt)}
          style={{
            padding: '12px',
            borderRadius: 12,
            border: `2px solid ${value === opt ? 'var(--accent)' : 'var(--border)'}`,
            background: value === opt ? 'var(--accent-soft)' : 'transparent',
            color: 'var(--text)',
            fontWeight: 600,
          }}
        >
          {render ? render(opt) : String(opt)}
        </button>
      ))}
    </div>
  );
}