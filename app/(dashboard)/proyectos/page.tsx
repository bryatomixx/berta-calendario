'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FolderKanban, Plus, Inbox } from 'lucide-react';
import { getProjects, addProject } from '@/lib/db/projects';
import { getTasks } from '@/lib/db/tasks';
import { getMembers } from '@/lib/db/members';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Member, Project, Task } from '@/lib/types';

/* Formato de fecha corta */
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/* Skeleton de carga */
function ProjectsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-40" />
      </div>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

/* Tarjeta de un proyecto */
interface ProjectCardProps {
  project: Project;
  tasks:   Task[];
  members: Member[];
}

function ProjectCard({ project, tasks, members }: ProjectCardProps) {
  const projectTasks = tasks.filter((t) => t.project_id === project.id);
  const total      = projectTasks.length;
  const done       = projectTasks.filter((t) => t.status === 'hecho').length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;
  const totalHours = projectTasks.reduce((s, t) => s + (t.hours ?? 0), 0);

  /* Personas involucradas: nombres distintos de las personas asignadas */
  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const involvedNames = [
    ...new Set(
      projectTasks
        .map((t) => (t.member_id ? memberMap.get(t.member_id) : undefined))
        .filter((n): n is string => Boolean(n)),
    ),
  ];

  const isArchived = project.status === 'archivado';

  return (
    <Link
      href={`/proyectos/${project.id}`}
      className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 rounded-[var(--radius-xl)]"
    >
      <Card
        variant="default"
        padding="md"
        className="transition-all duration-150 hover:shadow-card-hover hover:-translate-y-px"
      >
        <div className="flex items-start gap-4">
          {/* Punto de color */}
          <span
            className="mt-0.5 shrink-0 w-3 h-3 rounded-full"
            style={{ backgroundColor: project.color }}
            aria-hidden="true"
          />

          {/* Nombre y descripcion */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-teal-700)] transition-colors duration-150">
                {project.name}
              </span>
              {isArchived && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-500">
                  Archivado
                </span>
              )}
            </div>
            {project.description && (
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)] truncate">
                {project.description}
              </p>
            )}

            {/* Metadatos en linea */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
              <span>
                <span className="font-semibold text-[var(--color-text-primary)]">{total}</span>{' '}
                {total === 1 ? 'tarea' : 'tareas'}
              </span>
              <span>
                <span className="font-semibold text-[var(--color-text-primary)]">{totalHours} h</span>{' '}
                registradas
              </span>
              {involvedNames.length > 0 && (
                <span>
                  {involvedNames.join(', ')}
                </span>
              )}
              <span className="text-[var(--color-text-muted)]">
                Creado {fmtDate(project.created_at)}
              </span>
            </div>
          </div>

          {/* Progreso */}
          <div className="shrink-0 text-right min-w-[60px]">
            <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {pct}%
            </span>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">completado</p>
            {/* Barra de progreso */}
            <div className="mt-1.5 h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: project.color }}
              />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ---- Pagina principal ---- */
export default function ProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [members, setMembers]   = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [newName, setNewName] = useState('');
  const [adding, setAdding]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    setError('');
    Promise.all([getProjects(), getTasks(), getMembers()])
      .then(([p, t, m]) => {
        setProjects(p);
        setTasks(t);
        setMembers(m);
      })
      .catch(() => setError('No pudimos cargar los proyectos. Verifica tu conexion.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      const created = await addProject(name);
      setProjects((prev) => [created, ...prev]);
      setNewName('');
      inputRef.current?.focus();
    } catch {
      /* Silencioso: el input queda con el nombre para reintentar */
    } finally {
      setAdding(false);
    }
  }

  /* Separa activos de archivados */
  const { active, archived } = useMemo(() => {
    const active   = projects.filter((p) => p.status === 'activo');
    const archived = projects.filter((p) => p.status === 'archivado');
    return { active, archived };
  }, [projects]);

  const activeCount = active.length;

  if (loading) return <ProjectsSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={Inbox}
        title="No pudimos cargar los proyectos"
        body="Verifica tu conexion e intenta de nuevo."
        action={
          <Button variant="secondary" onClick={load}>
            Reintentar
          </Button>
        }
      />
    );
  }

  /* Clases del input inline */
  const inputCls =
    'h-9 flex-1 min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm ' +
    'placeholder:text-[var(--color-text-disabled)] ' +
    'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none ' +
    'transition-colors duration-[var(--duration-fast)]';

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        title="Proyectos"
        subtitle={`${activeCount} ${activeCount === 1 ? 'activo' : 'activos'}`}
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAdd(); } }}
              placeholder="Nombre del proyecto"
              className={inputCls}
              aria-label="Nombre del nuevo proyecto"
            />
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" aria-hidden="true" />}
              onClick={handleAdd}
              loading={adding}
              disabled={!newName.trim()}
            >
              Agregar proyecto
            </Button>
          </div>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Sin proyectos todavia"
          body="Crea tu primer proyecto usando el campo de arriba."
        />
      ) : (
        <div className="space-y-8">
          {/* Proyectos activos */}
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
                Activos
              </h2>
              <div className="space-y-3">
                {active.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    tasks={tasks}
                    members={members}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Proyectos archivados */}
          {archived.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
                Archivados
              </h2>
              <div className="space-y-3">
                {archived.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    tasks={tasks}
                    members={members}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
