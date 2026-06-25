'use client';

import { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** aria-label es obligatorio para iconos sin texto visible. */
  'aria-label': string;
  children: ReactNode;
  variant?: 'ghost' | 'default';
}

export function IconButton({
  'aria-label': ariaLabel,
  children,
  variant = 'ghost',
  className = '',
  ...rest
}: IconButtonProps) {
  const variantClass =
    variant === 'ghost'
      ? 'text-slate-500 hover:text-slate-900 hover:bg-[var(--color-surface-2)]'
      : 'text-slate-600 bg-white border border-[var(--color-border)] shadow-xs hover:border-teal-300';

  return (
    <button
      aria-label={ariaLabel}
      {...rest}
      className={[
        'inline-flex items-center justify-center h-8 w-8 rounded-[var(--radius-md)]',
        'transition-colors duration-[var(--duration-fast)] cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal-500)]/40',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
