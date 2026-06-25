'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ListChecks, Timer, Users, ChevronLeft, ChevronRight, Clock,
} from 'lucide-react';
import { getTasks } from '@/lib/db/tasks';
import { getMembers } from '@/lib/db/members';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { ROLE_LABELS } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/Avatar';
import { CategoryBadge } from '@/components/CategoryBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import type { Member, Task } from '@/lib/types';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function shiftDay(date: string, delta: number): string {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
function longDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* Una fila de tarea trabajada ese dia */
function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border-soft)] last:border-0">
      <Badge variant="status" value={task.status} size="xs" />
      <p className="flex-1 min-w-0 text-sm text-[var(--color-text-primary)] truncate">{task.title}</p>
      <CategoryBadge category={task.category} />
      <PriorityBadge priority={task.priority} variant="dot" />
      <span className="flex items-center gap-1 text-xs tabular-nums text-[var(--color-text-secondary)] w-16 justify-end">
        {task.hours != null ? (
          <><Clock className="w-3 h-3" aria-hidden="true" />{task.hours} h</>
        ) : (
          <span className="text-[var(--color-text-muted)]">sin h</span>
        )}
      </span>
    </div>
  );
}

export default function ActividadPage() {
  const { memberId, loaded } = useCurrentMember();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTasks(), getMembers()])
      .then(([t, m]) => { setTasks(t); setMembers(m); })
      .finally(() => setLoading(false));
  }, []);

  const me = members.find((m) => m.id === memberId) ?? null;
  const isAdmin = me?.role === 'admin';

  // Tareas visibles segun rol (admin: todas; trabajadora: solo las suyas).
  const scoped = useMemo(
    () => (isAdmin ? tasks : tasks.filter((t) => t.member_id === memberId)),
    [tasks, isAdmin, memberId],
  );

  // Fecha inicial: el dia mas reciente con actividad (para abrir poblado).
  useEffect(() => {
    if (date || scoped.length === 0) return;
    const latest = scoped.reduce((max, t) => (t.task_date > max ? t.task_date : max), scoped[0].task_date);
    setDate(latest);
  }, [scoped, date]);

  const selected = date ?? todayStr();
  const dayTasks = scoped.filter((t) => t.task_date === selected);

  const totalHours = dayTasks.reduce((s, t) => s + (t.hours ?? 0), 0);
  const activePeople = new Set(dayTasks.map((t) => t.member_id)).size;

  // Agrupa por persona (solo admin).
  const byMember = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of dayTasks) {
      const k = t.member_id ?? 'sin-asignar';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [dayTasks]);

  const memberById = new Map(members.map((m) => [m.id, m]));

  if (loading || !loaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const dateControls = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setDate(todayStr())}
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors"
      >
        Hoy
      </button>
      <button
        onClick={() => setDate(shiftDay(selected, -1))}
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors"
        aria-label="Día anterior"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </button>
      <input
        type="date"
        value={selected}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-teal-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]/30"
      />
      <button
        onClick={() => setDate(shiftDay(selected, 1))}
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors"
        aria-label="Día siguiente"
      >
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        title="Actividad"
        subtitle={isAdmin ? 'Qué trabajó el equipo, por día.' : 'Tu trabajo, por día.'}
        actions={dateControls}
      />

      <p className="mb-5 text-sm font-medium text-[var(--color-text-secondary)] first-letter:uppercase">
        {longDate(selected)}
      </p>

      {/* Resumen del día */}
      <div className={`grid grid-cols-2 ${isAdmin ? 'md:grid-cols-3' : ''} gap-4 mb-6`}>
        <StatCard
          label={isAdmin ? 'Tareas del día' : 'Tus tareas del día'}
          value={String(dayTasks.length)}
          icon={ListChecks} iconBg="bg-teal-50" iconColor="text-teal-600"
        />
        <StatCard
          label="Horas registradas"
          value={`${totalHours} h`}
          icon={Timer} iconBg="bg-sky-50" iconColor="text-sky-600"
        />
        {isAdmin && (
          <StatCard
            label="Personas activas"
            value={String(activePeople)}
            icon={Users} iconBg="bg-violet-50" iconColor="text-violet-600"
          />
        )}
      </div>

      {/* Contenido */}
      {dayTasks.length === 0 ? (
        <Card variant="flat" padding="none">
          <EmptyState
            icon={ListChecks}
            title="Sin actividad este día"
            body={isAdmin ? 'Nadie registró trabajo con esta fecha.' : 'No registraste trabajo con esta fecha.'}
          />
        </Card>
      ) : isAdmin ? (
        <div className="space-y-4">
          {byMember.map(([mid, items]) => {
            const m = memberById.get(mid);
            const hrs = items.reduce((s, t) => s + (t.hours ?? 0), 0);
            return (
              <Card key={mid} padding="md">
                <div className="flex items-center gap-3 mb-2 pb-3 border-b border-[var(--color-border-soft)]">
                  {m ? <Avatar name={m.name} color={m.color} size={32} /> : <Avatar name="?" color="#94a3b8" size={32} />}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{m?.name ?? 'Sin asignar'}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{m ? ROLE_LABELS[m.role] : 'Sin asignar'}</p>
                  </div>
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] tabular-nums">
                    {items.length} tareas · {hrs} h
                  </span>
                </div>
                <div>
                  {items.map((t) => <TaskRow key={t.id} task={t} />)}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card padding="md">
          {dayTasks.map((t) => <TaskRow key={t.id} task={t} />)}
        </Card>
      )}
    </div>
  );
}
