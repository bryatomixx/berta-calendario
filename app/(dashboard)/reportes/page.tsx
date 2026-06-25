'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, BarChart2 } from 'lucide-react';
import { getTasks } from '@/lib/db/tasks';
import { getMembers } from '@/lib/db/members';
import {
  filterByDateRange,
  reportByCategory,
  reportByMember,
  type ReportRow,
} from '@/lib/reports';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Member, Task } from '@/lib/types';

/* ---- Helpers de fecha ---- */
function firstOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Formatea "2026-06-01" como "1 jun" para el contador */
function fmtShort(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

/* ---- Skeleton de carga ---- */
function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      {/* DateRangeBar */}
      <Skeleton className="h-14 w-full" />
      {/* Paneles */}
      <div className="grid grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-card overflow-hidden">
            <Skeleton className="h-10 w-full rounded-none" />
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((__, j) => (
                <Skeleton key={j} className="h-6" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Panel de reporte ---- */
interface ReportPanelProps {
  title:   string;
  rows:    ReportRow[];
  labelOf: (key: string) => string;
}

function ReportPanel({ title, rows, labelOf }: ReportPanelProps) {
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  const maxHours   = rows.length > 0 ? Math.max(...rows.map((r) => r.hours)) : 0;

  return (
    <Card variant="default" padding="none">
      {/* Encabezado del panel */}
      <div className="px-5 py-4 border-b border-[var(--color-border-soft)]">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          {title}
        </h2>
      </div>

      {/* Filas */}
      <div className="divide-y divide-[var(--color-border-soft)]">
        {rows.length === 0 ? (
          <EmptyState
            icon={BarChart2}
            title="Sin actividad en este periodo."
          />
        ) : (
          rows.map((r) => {
            const pct = maxHours > 0 ? Math.round((r.hours / maxHours) * 100) : 0;
            const label = labelOf(r.key);
            return (
              <div
                key={r.key}
                className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors duration-[var(--duration-fast)]"
              >
                <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {label}
                </span>
                {/* Mini barra proporcional */}
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

      {/* Footer total */}
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

/* ---- Pagina principal ---- */
export default function ReportsPage() {
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom]       = useState(firstOfMonth());
  const [to, setTo]           = useState(todayStr());

  useEffect(() => {
    Promise.all([getTasks(), getMembers()])
      .then(([t, m]) => {
        setTasks(t);
        setMembers(m);
      })
      .finally(() => setLoading(false));
  }, []);

  /* Validacion de rango */
  const rangeInvalid = from > to;

  const ranged = useMemo(() => {
    if (rangeInvalid) return [];
    return filterByDateRange(tasks, from, to);
  }, [tasks, from, to, rangeInvalid]);

  const memberName = (id: string) => {
    if (id === 'sin-responsable') return 'Sin asignar';
    return members.find((m) => m.id === id)?.name ?? 'Sin asignar';
  };

  if (loading) {
    return (
      <div className="animate-slide-up-fade">
        <PageHeader title="Reportes" />
        <ReportSkeleton />
      </div>
    );
  }

  return (
    <div className="animate-slide-up-fade">
      <PageHeader title="Reportes" />

      {/* DateRangeBar */}
      <div className="flex items-center gap-4 bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] px-5 py-3 shadow-xs mb-6">
        <CalendarDays className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />

        <label className="cursor-pointer">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Desde
          </span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="block mt-0.5 text-sm font-medium text-[var(--color-text-primary)] bg-transparent border-none outline-none cursor-pointer"
          />
        </label>

        <div className="w-px h-6 bg-[var(--color-border)] shrink-0" aria-hidden="true" />

        <label className="cursor-pointer">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Hasta
          </span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="block mt-0.5 text-sm font-medium text-[var(--color-text-primary)] bg-transparent border-none outline-none cursor-pointer"
          />
        </label>

        {/* Validacion de rango o contador */}
        <div className="ml-auto shrink-0">
          {rangeInvalid ? (
            <span className="text-xs text-rose-600 font-medium" role="alert">
              La fecha de inicio no puede ser posterior a la fecha final.
            </span>
          ) : (
            <span className="text-xs font-semibold text-[var(--color-teal-700)] bg-[var(--color-teal-50)] rounded-full px-3 py-1">
              {ranged.length} tareas del {fmtShort(from)} al {fmtShort(to)}
            </span>
          )}
        </div>
      </div>

      {/* Paneles: por categoria y por persona */}
      <div className="grid grid-cols-2 gap-5">
        <ReportPanel
          title="Por categoria"
          rows={reportByCategory(ranged)}
          labelOf={(k) => k}
        />
        <ReportPanel
          title="Por persona"
          rows={reportByMember(ranged)}
          labelOf={memberName}
        />
      </div>
    </div>
  );
}
