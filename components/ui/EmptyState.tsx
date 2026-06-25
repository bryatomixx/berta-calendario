import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon:    LucideIcon;
  title:   string;
  body?:   string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="py-12 px-6 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-slate-100 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[var(--color-text-muted)]" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{title}</p>
      {body && (
        <p className="text-xs text-[var(--color-text-muted)] max-w-xs">{body}</p>
      )}
      {action && action}
    </div>
  );
}
