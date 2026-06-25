import { Ticket } from 'lucide-react';
import { CATEGORY_COLORS } from '@/lib/constants';
import type { Category, Status } from '@/lib/types';

type BadgeVariant = 'category' | 'status' | 'source';
type BadgeValue   = Category | Status | 'cliente' | 'agencia';

interface BadgeProps {
  variant: BadgeVariant;
  value:   BadgeValue;
  size?:   'sm' | 'xs';
}

const STATUS_CLASSES: Partial<Record<Status, string>> = {
  pendiente: 'bg-[var(--color-pendiente-chip)] text-[var(--color-pendiente-text)]',
  en_proceso:'bg-[var(--color-proceso-chip)] text-[var(--color-proceso-text)]',
  hecho:     'bg-[var(--color-hecho-chip)] text-[var(--color-hecho-text)]',
};

const STATUS_LABELS: Record<Status, string> = {
  pendiente:  'Pendiente',
  en_proceso: 'En proceso',
  hecho:      'Hecho',
};

const SIZE_CLASSES: Record<NonNullable<BadgeProps['size']>, string> = {
  xs: 'px-2 py-0.5 text-[11px]',
  sm: 'px-2.5 py-1 text-xs',
};

export function Badge({ variant, value, size = 'xs' }: BadgeProps) {
  const base = `inline-flex items-center gap-1 rounded-[var(--radius-full)] font-medium leading-none whitespace-nowrap ${SIZE_CLASSES[size]}`;

  if (variant === 'source' && value === 'cliente') {
    return (
      <span className={`${base} bg-amber-100 text-amber-800`}>
        <Ticket className="w-3 h-3" aria-hidden="true" />
        Cliente
      </span>
    );
  }

  if (variant === 'category') {
    const colorClass = CATEGORY_COLORS[value as Category] ?? 'bg-slate-100 text-slate-600';
    return <span className={`${base} ${colorClass}`}>{value}</span>;
  }

  if (variant === 'status') {
    const colorClass = STATUS_CLASSES[value as Status] ?? 'bg-slate-100 text-slate-600';
    const label      = STATUS_LABELS[value as Status] ?? value;
    return <span className={`${base} ${colorClass}`}>{label}</span>;
  }

  /* Fallback */
  return <span className={`${base} bg-slate-100 text-slate-600`}>{value}</span>;
}
