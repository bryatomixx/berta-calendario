import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label:      string;
  value:      string;
  icon:       LucideIcon;
  iconColor?: string;
  iconBg?:    string;
  trend?:     string;
  trendUp?:   boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-slate-500',
  iconBg    = 'bg-slate-100',
  trend,
  trendUp,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-card p-[var(--card-p)] flex items-start gap-4">
      <div
        className={`shrink-0 w-10 h-10 rounded-[var(--radius-lg)] ${iconBg} flex items-center justify-center`}
      >
        <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          {value}
        </p>
        {trend != null && (
          <p className={`mt-1 text-xs ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
