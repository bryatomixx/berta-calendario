'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, CircleCheck, Timer, Users, Plus, Inbox } from 'lucide-react';
import { getTasks, updateTask } from '@/lib/db/tasks';
import { getMembers } from '@/lib/db/members';
import { getClients } from '@/lib/db/clients';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { needsHoursPrompt, reorderTasks } from '@/lib/board';
import { reportByMember, reportByClient } from '@/lib/reports';
import { PRIORITIES, PRIORITY_LABELS } from '@/lib/constants';
import type { Cliente, Member, Priority, Role, Status, Task } from '@/lib/types';
import { Board } from '@/components/Board';
import { TaskModal } from '@/components/TaskModal';
import { HoursPrompt } from '@/components/HoursPrompt';
import { HoursPanel } from '@/components/HoursPanel';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

/* Calcula el prefijo YYYY-MM del mes actual */
function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/* Skeleton de estado de carga */
function BoardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* KPIs fantasma */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-[var(--card-p)] flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-[var(--radius-lg)] bg-slate-100" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-2.5 bg-slate-100 rounded w-3/4" />
              <div className="h-5 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
      {/* Columnas fantasma */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((col) => (
          <div key={col} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
            <Skeleton className="h-6 w-24 mb-3" />
            {[0, 1, 2].map((card) => (
              <Skeleton key={card} className="h-24 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const { memberId } = useCurrentMember();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [memberFilter, setMemberFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  /* Toggle "Mias / Todas" exclusivo para trabajadoras */
  const [soloMias, setSoloMias] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const [pendingMove, setPendingMove] = useState<{
    task: Task;
    status: Status;
    index: number;
  } | null>(null);

  /* Rol del usuario actual derivado de la lista de miembros */
  const currentMember = useMemo(
    () => members.find((m) => m.id === memberId) ?? null,
    [members, memberId],
  );
  const currentRole: Role | null = currentMember?.role ?? null;
  const isAdmin = currentRole === 'admin';

  function load() {
    setLoading(true);
    setError('');
    Promise.all([getTasks(), getMembers(), getClients()])
      .then(([t, m, c]) => {
        setTasks(t);
        setMembers(m);
        setClients(c);
      })
      .catch(() => setError('No pudimos cargar el tablero. Verifica tu conexion.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      /* Filtro "Mias" solo aplica cuando la usuaria es trabajadora */
      if (!isAdmin && soloMias && t.member_id !== memberId) return false;
      if (memberFilter !== '' && t.member_id !== memberFilter) return false;
      if (priorityFilter !== '' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, isAdmin, soloMias, memberId, memberFilter, priorityFilter]);

  /* KPIs: calculados sobre TODAS las tareas (no las filtradas) */
  const month = currentMonth();

  /* KPI: tareas activas asignadas al equipo */
  const kpiTareasActivas = tasks.filter(
    (t) => t.status === 'pendiente' || t.status === 'en_proceso',
  ).length;

  const kpiHorasMes = tasks
    .filter((t) => t.task_date.slice(0, 7) === month && t.hours != null)
    .reduce((sum, t) => sum + (t.hours ?? 0), 0);

  const kpiTareasEnCurso = tasks.filter(
    (t) => t.status === 'en_proceso',
  ).length;

  const kpiCompletadasMes = tasks.filter(
    (t) => t.status === 'hecho' && t.task_date.slice(0, 7) === month,
  ).length;

  /* Horas del mes desglosadas por trabajadora y por cliente */
  const monthTasks = tasks.filter((t) => t.task_date.slice(0, 7) === month);
  const rowsByMember = reportByMember(monthTasks);
  const rowsByClient = reportByClient(monthTasks);
  const memberName = (id: string) =>
    id === 'sin-responsable'
      ? 'Sin asignar'
      : members.find((m) => m.id === id)?.name ?? 'Sin asignar';
  const clientName = (id: string) =>
    id === 'sin-cliente'
      ? 'Interno / sin cliente'
      : clients.find((c) => c.id === id)?.nombre ?? 'Cliente';

  function handleSaved(saved: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      return exists
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [...prev, saved];
    });
    setModalOpen(false);
    setEditing(null);
  }

  async function persistMove(
    prev: Task[],
    next: Task[],
    movedId: string,
    hours: number | null,
  ) {
    const changed = next.filter((t) => {
      const before = prev.find((p) => p.id === t.id);
      return (
        !before ||
        before.status !== t.status ||
        before.position !== t.position ||
        t.id === movedId
      );
    });
    try {
      for (const t of changed) {
        await updateTask(t.id, {
          status: t.status,
          position: t.position,
          ...(t.id === movedId && hours != null ? { hours } : {}),
        });
      }
    } catch {
      setTasks(prev);
      setError('No se pudo mover la tarea. Cambio revertido.');
    }
  }

  function applyMove(taskId: string, status: Status, index: number, hours: number | null) {
    const prev = tasks;
    const reordered = reorderTasks(prev, taskId, status, index);
    const next =
      hours == null
        ? reordered
        : reordered.map((t) => (t.id === taskId ? { ...t, hours } : t));
    setTasks(next);
    void persistMove(prev, next, taskId, hours);
  }

  function handleDrop(taskId: string, status: Status, index: number) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (needsHoursPrompt(task, status)) {
      setPendingMove({ task, status, index });
      return;
    }
    applyMove(taskId, status, index, null);
  }

  if (loading) return <BoardSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={Inbox}
        title="No pudimos cargar el tablero"
        body="Verifica tu conexion e intenta de nuevo."
        action={
          <Button variant="secondary" onClick={load}>
            Reintentar
          </Button>
        }
      />
    );
  }

  /* Clases del select estilizado segun ui-spec 4.1 */
  const selectCls =
    'h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white pl-3 pr-8 text-sm text-[var(--color-text-secondary)] shadow-xs transition-colors duration-150 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 focus:outline-none appearance-none cursor-pointer';

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        title="Tablero"
        actions={
          <>
            {/* Toggle Mias / Todas: solo visible para trabajadoras */}
            {!isAdmin && (
              <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden text-sm shadow-xs">
                <button
                  onClick={() => setSoloMias(true)}
                  className={[
                    'px-3 h-9 font-medium transition-colors duration-150',
                    soloMias
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-[var(--color-text-secondary)] hover:bg-slate-50',
                  ].join(' ')}
                >
                  Mias
                </button>
                <button
                  onClick={() => setSoloMias(false)}
                  className={[
                    'px-3 h-9 font-medium transition-colors duration-150',
                    !soloMias
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-[var(--color-text-secondary)] hover:bg-slate-50',
                  ].join(' ')}
                >
                  Todas
                </button>
              </div>
            )}

            {/* Filtro por persona: el admin puede filtrar por cualquier miembro */}
            {isAdmin && (
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className={selectCls}
                aria-label="Filtrar por miembro"
              >
                <option value="">Todo el equipo</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
              className={selectCls}
              aria-label="Filtrar por prioridad"
            >
              <option value="">Todas las prioridades</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>

            {/* Boton "Nueva tarea": solo visible para admin */}
            {isAdmin && (
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" aria-hidden="true" />}
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                Nueva tarea
              </Button>
            )}
          </>
        }
      />

      {/* Tira de 4 KPIs: stats del equipo, solo admin (Berta) */}
      {isAdmin && (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Tareas activas"
          value={String(kpiTareasActivas)}
          icon={Users}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          label="Horas este mes"
          value={`${kpiHorasMes} h`}
          icon={Timer}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          label="En proceso"
          value={String(kpiTareasEnCurso)}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Completadas este mes"
          value={String(kpiCompletadasMes)}
          icon={CircleCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>
      )}

      <Board
        tasks={visibleTasks}
        members={members}
        clients={clients}
        currentMemberId={memberId}
        currentRole={currentRole}
        onCardClick={(task) => {
          /* Solo el admin puede abrir el modal de edicion */
          if (!isAdmin) return;
          setEditing(task);
          setModalOpen(true);
        }}
        onDrop={handleDrop}
      />

      {/* Horas del equipo: stats solo para admin (Berta) */}
      {isAdmin && (
      <div className="mt-8">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">
          Horas del equipo · este mes
        </h2>
        <div className="grid grid-cols-2 gap-5">
          <HoursPanel
            title="Por trabajadora"
            rows={rowsByMember}
            labelOf={memberName}
            secondaryOf={(t) => (t.client_id ? clientName(t.client_id) : 'Interno')}
          />
          <HoursPanel
            title="Por cliente"
            rows={rowsByClient}
            labelOf={clientName}
            secondaryOf={(t) => (t.member_id ? memberName(t.member_id) : 'Sin asignar')}
          />
        </div>
      </div>
      )}

      {/* Modal de creacion/edicion: solo admin puede abrirlo */}
      {isAdmin && modalOpen && (
        <TaskModal
          open={modalOpen}
          task={editing}
          members={members}
          defaultMemberId={memberId ?? ''}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {pendingMove && (
        <HoursPrompt
          taskTitle={pendingMove.task.title}
          onConfirm={(hours) => {
            applyMove(pendingMove.task.id, pendingMove.status, pendingMove.index, hours);
            setPendingMove(null);
          }}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </div>
  );
}
