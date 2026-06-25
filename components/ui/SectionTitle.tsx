import { type ReactNode } from 'react';

interface SectionTitleProps {
  children: ReactNode;
  action?:  ReactNode;
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
        {children}
      </h2>
      {action && action}
    </div>
  );
}
