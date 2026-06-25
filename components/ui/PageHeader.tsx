import { type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title:     string;
  subtitle?: string;
  back?:     { href: string; label: string };
  actions?:  ReactNode;
}

export function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-teal-600)] mb-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal-500)]/40"
          aria-label={`Volver a ${back.label}`}
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1
            style={{ fontSize: 'var(--text-display)' }}
            className="font-bold tracking-tight leading-[1.2] text-[var(--color-text-primary)]"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
