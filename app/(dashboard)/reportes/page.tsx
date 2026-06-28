'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { getTasks } from '@/lib/db/tasks';
import { getMembers } from '@/lib/db/members';
import { getClients } from '@/lib/db/clients';
import { filterByDateRange, reportByClient, reportByMember } from '@/lib/reports';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { HoursPanel } from '@/components/HoursPanel';
import type { Cliente, Member, Task } from '@/lib/types';

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

/* ---- Pagina principal ---- */
export default function ReportsPage() {
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom]       = useState(firstOfMonth());
  const [to, setTo]           = useState(todayStr());

  useEffect(() => {
    Promise.all([getTasks(), getMembers(), getClients()])
      .then(([t, m, c]) => {
        setTasks(t);
        setMembers(m);
        setClients(c);
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

  const clientName = (id: string) => {
    if (id === 'sin-cliente') return 'Interno / sin cliente';
    return clients.find((c) => c.id === id)?.nombre ?? 'Cliente';
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

      {/* Paneles desplegables: por cliente y por persona */}
      <div className="grid grid-cols-2 gap-5">
        <HoursPanel
          title="Por cliente"
          rows={reportByClient(ranged)}
          labelOf={clientName}
          secondaryOf={(t) => (t.member_id ? memberName(t.member_id) : 'Sin asignar')}
        />
        <HoursPanel
          title="Por persona"
          rows={reportByMember(ranged)}
          labelOf={memberName}
          secondaryOf={(t) => (t.client_id ? clientName(t.client_id) : 'Interno')}
        />
      </div>
    </div>
  );
}
