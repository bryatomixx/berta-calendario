'use client';

import { useState } from 'react';
import { BarChart2, ChevronRight, Inbox } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import type { ReportRow } from '@/lib/reports';
import type { Task } from '@/lib/types';

interface HoursPanelProps {
  title: string;
  rows: ReportRow[];
  labelOf: (key: string) => string;
  /**
   * Texto secundario por tarea al desplegar una fila: en el panel "Por cliente"
   * es quien hizo la tarea; en "Por trabajadora" es el cliente de la tarea.
   */
  secondaryOf: (task: Task) => string;
}

/**
 * Panel de horas agregadas (por trabajadora, por cliente, etc.). Cada fila
 * muestra etiqueta, mini barra, horas y numero de tareas, y se DESPLIEGA al
 * hacer clic para ver las tareas concretas que la componen. Reutilizado en el
 * dashboard y en Reportes.
 */
export function HoursPanel({ title, rows, labelOf, secondaryOf }: HoursPanelProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
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
            const isOpen = openKey === r.key;
            return (
              <div key={r.key}>
                {/* Fila resumen (clic para desplegar) */}
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : r.key)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-[var(--color-surface-2)] transition-colors duration-[var(--duration-fast)]"
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  />
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
                </button>

                {/* Detalle desplegado: las tareas concretas */}
                {isOpen && (
                  <ul className="bg-[var(--color-surface)] border-t border-[var(--color-border-soft)] px-5 py-2 space-y-1">
                    {[...r.tasks]
                      .sort((a, b) => b.task_date.localeCompare(a.task_date))
                      .map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center gap-2.5 py-1.5"
                        >
                          <Badge variant="status" value={t.status} size="xs" />
                          <span className="flex-1 min-w-0 text-[13px] text-[var(--color-text-primary)] truncate">
                            {t.title}
                          </span>
                          <span className="hidden sm:block text-[11px] text-[var(--color-text-muted)] truncate max-w-[120px]">
                            {secondaryOf(t)}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums shrink-0">
                            {t.task_date}
                          </span>
                          <span className="text-xs font-bold tabular-nums text-[var(--color-text-secondary)] w-10 text-right shrink-0">
                            {t.hours != null ? `${t.hours} h` : '—'}
                          </span>
                        </li>
                      ))}
                    {r.tasks.length === 0 && (
                      <li className="flex items-center gap-2 py-2 text-xs text-[var(--color-text-muted)]">
                        <Inbox className="w-4 h-4 opacity-50" aria-hidden="true" />
                        Sin tareas.
                      </li>
                    )}
                  </ul>
                )}
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
