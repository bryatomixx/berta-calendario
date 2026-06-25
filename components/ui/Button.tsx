'use client';

import { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--color-teal-600)] text-white shadow-card hover:bg-[var(--color-teal-700)] focus-visible:ring-2 focus-visible:ring-[var(--color-teal-500)]/40 focus-visible:ring-offset-2',
  secondary:
    'bg-white text-slate-700 border border-[var(--color-border)] shadow-xs hover:border-teal-300 hover:bg-[var(--color-teal-50)]/60 hover:text-[var(--color-teal-700)] focus-visible:ring-2 focus-visible:ring-[var(--color-teal-500)]/40 focus-visible:ring-offset-2',
  ghost:
    'text-slate-600 bg-transparent hover:bg-[var(--color-surface-2)] hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[var(--color-teal-500)]/40 focus-visible:ring-offset-2',
  danger:
    'bg-rose-600 text-white shadow-card hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:ring-offset-2',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  md: 'h-9 rounded-[var(--radius-md)] px-4 text-sm font-semibold gap-1.5',
  sm: 'h-7 rounded-[var(--radius-sm)] px-3 text-xs font-semibold gap-1',
};

const ICON_ONLY_CLASSES = 'h-8 w-8 rounded-[var(--radius-md)] p-0 justify-center';

/** Spinner SVG para estado loading. */
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconOnly = false,
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        'inline-flex items-center transition-all duration-150 ease-out cursor-pointer',
        'focus-visible:outline-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        iconOnly ? ICON_ONLY_CLASSES : SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          {icon && <span aria-hidden="true">{icon}</span>}
          {!iconOnly && children}
        </>
      )}
    </button>
  );
}
