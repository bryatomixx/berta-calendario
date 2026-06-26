'use client';

import { BarChart2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ReportRow } from '@/lib/reports';

interface HoursPanelProps {
  title: string;
  rows: ReportRow[];
  labelOf: (key: string) => string;
}

/**
 * Panel de horas agregadas (por trabajadora, por cliente, etc.). Cada fila
 * muestra la etiqueta, una mini barra proporcional, las horas y el numero de
 * tareas. Reutilizado en el dashboard y en Reportes.
 */
export function HoursPanel({ title, rows, labelOf }: HoursPanelProps) {
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  const maxHours = rows.length > 0 ? Math.max(...rows.map((r) => r.hours)) : 0;

  return (
    <Card variant="default" padding="none">
      <div className="px-5 py-4 border-b border-[var(--color-border-soft)]">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          {title}
        </h2>
      </div>

      <div className="divide-y divide-[var(--color-border-soft)]">
        {rows.length === 0 ? (
          <EmptyState icon={BarChart2} title="Sin horas registradas en este periodo." />
        ) : (
          rows.map((r) => {
            const pct = maxHours > 0 ? Math.round((r.hours / maxHours) * 100) : 0;
            return (
              <div
                key={r.key}
                className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors duration-[var(--duration-fast)]"
              >
                <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {labelOf(r.key)}
                </span>
                <div className="w-20 h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-teal-400 rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                    role="presentation"
                  />
                </div>
                <span className="text-xs tabular-nums font-bold text-[var(--color-text-secondary)] w-10 text-right shrink-0">
                  {r.hours} h
                </span>
                <span className="text-xs text-[var(--color-text-muted)] w-6 text-right shrink-0">
                  {r.taskCount}
                </span>
              </div>
            );
          })
        )}
      </div>

      {rows.length > 0 && (
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-slate-50/60 flex justify-between items-center">
          <span className="text-xs font-bold text-[var(--color-text-secondary)]">Total</span>
          <span className="text-xs font-bold tabular-nums text-[var(--color-text-primary)]">
            {totalHours} h
          </span>
        </div>
      )}
    </Card>
  );
}
