'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Timer, CircleCheck, CircleDot, Clock, FolderKanban, Building2,
} from 'lucide-react';
import { getProjects, updateProject } from '@/lib/db/projects';
import { getTasks } from '@/lib/db/tasks';
import { getMembers } from '@/lib/db/members';
import { getClients } from '@/lib/db/clients';
import { STATUS_LABELS, STATUSES } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/Avatar';
import { PriorityBadge } from '@/components/PriorityBadge';
import type { Cliente, Member, Project, Task } from '@/lib/types';

/* Formato de fecha legible */
function fmtDate(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/* Skeleton de carga */
function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-8 w-72 mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}

/* Fila de tarea dentro de una seccion de estado */
interface TaskRowProps {
  task:   Task;
  member: Member | undefined;
  clientName?: string;
}

function TaskRow({ task, member, clientName }: TaskRowProps) {
  return (
    <div className="flex gap-3 items-start py-3 border-b border-[var(--color-border-soft)] last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {/* Persona asignada en lugar del cliente */}
          {member ? (
            <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
              {member.name}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-[var(--color-text-disabled)]">
              Sin asignar
            </span>
          )}
          {clientName && (
            <span className="inline-flex items-center gap-1 max-w-[160px] rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
              <Building2 className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{clientName}</span>
            </span>
          )}
          <PriorityBadge priority={task.priority} variant="chip" />
        </div>
      </div>

      {/* Responsable + horas + fecha */}
      <div className="shrink-0 flex flex-col items-end gap-1.5 text-right">
        <div className="flex items-center gap-1.5">
          {member ? (
            <>
              <Avatar name={member.name} color={member.color} size={18} />
              <span className="text-xs text-[var(--color-text-secondary)]">{member.name}</span>
            </>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">Sin asignar</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          {task.hours != null && (
            <span className="flex items-center gap-0.5 font-medium tabular-nums text-[var(--color-text-secondary)]">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {task.hours} h
            </span>
          )}
          <span>{fmtDate(task.task_date)}</span>
        </div>
      </div>
    </div>
  );
}

/* ---- Pagina de detalle ---- */
export default function ProyectoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getProjects(), getTasks(), getMembers(), getClients()])
      .then(([allProjects, allTasks, allMembers, allClients]) => {
        setProject(allProjects.find((p) => p.id === id) ?? null);
        setTasks(allTasks.filter((t) => t.project_id === id));
        setMembers(allMembers);
        setClients(allClients);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus() {
    if (!project || toggling) return;
    const next = project.status === 'activo' ? 'archivado' : 'activo';
    setToggling(true);
    try {
      const updated = await updateProject(project.id, { status: next });
      setProject(updated);
    } catch {
      /* Silencioso */
    } finally {
      setToggling(false);
    }
  }

  if (loading) return <DetailSkeleton />;

  if (!project) {
    return (
      <div className="py-24 text-center animate-scale-in">
        <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
          Proyecto no encontrado.
        </p>
        <Link
          href="/proyectos"
          className="text-sm font-medium text-[var(--color-teal-600)] hover:underline"
        >
          Volver a proyectos
        </Link>
      </div>
    );
  }

  /* Calculos */
  const memberById = new Map(members.map((m) => [m.id, m]));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const total      = tasks.length;
  const done       = tasks.filter((t) => t.status === 'hecho').length;
  const inProgress = tasks.filter((t) => t.status === 'en_proceso').length;
  const pending    = tasks.filter((t) => t.status === 'pendiente').length;
  const totalHours = tasks.reduce((s, t) => s + (t.hours ?? 0), 0);

  /* Tareas agrupadas por estado segun el orden de STATUSES */
  const grouped = STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    items: tasks.filter((t) => t.status === status),
  }));

  const isArchived = project.status === 'archivado';

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        back={{ href: '/proyectos', label: 'Proyectos' }}
        title={project.name}
        subtitle={project.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {/* Chip de estado */}
            <span
              className={[
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                isArchived
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-emerald-100 text-emerald-700',
              ].join(' ')}
            >
              <span
                className={[
                  'mr-1.5 w-1.5 h-1.5 rounded-full',
                  isArchived ? 'bg-slate-400' : 'bg-emerald-500',
                ].join(' ')}
                aria-hidden="true"
              />
              {isArchived ? 'Archivado' : 'Activo'}
            </span>

            {/* Boton de archivar/reactivar */}
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleStatus}
              loading={toggling}
            >
              {isArchived ? 'Reactivar' : 'Archivar'}
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total de tareas"
          value={String(total)}
          icon={FolderKanban}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          label="Horas totales"
          value={`${totalHours} h`}
          icon={Timer}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          label="Completadas"
          value={String(done)}
          icon={CircleCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="En proceso"
          value={String(inProgress + pending)}
          icon={CircleDot}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Tareas agrupadas por estado */}
      {tasks.length === 0 ? (
        <Card variant="flat" padding="none">
          <EmptyState
            icon={FolderKanban}
            title="Sin tareas en este proyecto"
            body="Agrega tareas desde el tablero y asignalas a este proyecto."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <section key={group.status}>
                <SectionTitle>
                  {group.label} ({group.items.length})
                </SectionTitle>
                <Card variant="default" padding="sm">
                  {group.items.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      member={task.member_id ? memberById.get(task.member_id) : undefined}
                      clientName={task.client_id ? clientById.get(task.client_id)?.nombre : undefined}
                    />
                  ))}
                </Card>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
