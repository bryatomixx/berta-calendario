interface MiniBarProps {
  value:  number;
  max:    number;
  color?: string;
  label?: string;
}

export function MiniBar({ value, max, color = 'bg-teal-500', label }: MiniBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className="text-sm text-[var(--color-text-secondary)] w-32 shrink-0 truncate">
          {label}
        </span>
      )}
      <div className="flex-1 h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-[width] duration-500 ease-out`}
          style={{ width: `${pct}%` }}
          role="presentation"
        />
      </div>
      <span className="text-xs tabular-nums font-medium text-[var(--color-text-secondary)] w-10 text-right">
        {value} h
      </span>
    </div>
  );
}
