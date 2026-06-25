'use client';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Circle, CircleDot, CircleCheck, Inbox } from 'lucide-react';
import { STATUSES, STATUS_LABELS } from '@/lib/constants';
import type { Member, Role, Status, Task } from '@/lib/types';
import { TaskCard } from './TaskCard';

interface BoardProps {
  tasks: Task[];
  members: Member[];
  /** Id del miembro actual; usado para el gating de rol */
  currentMemberId: string | null;
  /** Rol del miembro actual */
  currentRole: Role | null;
  onCardClick: (task: Task) => void;
  onDrop: (taskId: string, status: Status, index: number) => void;
}

export function Board({
  tasks,
  members,
  currentMemberId,
  currentRole,
  onCardClick,
  onDrop,
}: BoardProps) {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function column(status: Status): Task[] {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  }

  /* Las trabajadoras solo pueden mover sus propias tarjetas */
  function isInteractive(task: Task): boolean {
    if (currentRole === 'admin') return true;
    return task.member_id === currentMemberId;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    /* Ignora el evento si la trabajadora no es duena de esta tarjeta */
    if (!isInteractive(activeTask)) return;

    const overId = String(over.id);
    let targetStatus: Status;
    let targetIndex: number;

    if (overId.startsWith('column-')) {
      targetStatus = overId.replace('column-', '') as Status;
      targetIndex = column(targetStatus).filter((t) => t.id !== activeTask.id).length;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
      const col = column(targetStatus).filter((t) => t.id !== activeTask.id);
      const found = col.findIndex((t) => t.id === overId);
      targetIndex = found < 0 ? col.length : found;
    }

    onDrop(String(active.id), targetStatus, targetIndex);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4">
        {STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            items={column(status)}
            memberById={memberById}
            isInteractive={isInteractive}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </DndContext>
  );
}

interface DroppableColumnProps {
  status: Status;
  items: Task[];
  memberById: Map<string, Member>;
  isInteractive: (task: Task) => boolean;
  onCardClick: (task: Task) => void;
}

/* Icono y estilos por estado de columna */
const COLUMN_CONFIG: Record<
  Status,
  {
    bg: string;
    border: string;
    chip: string;
    label: string;
    Icon: typeof Circle;
    iconClass: string;
    emptyText: string;
  }
> = {
  pendiente: {
    bg: 'bg-amber-50/60',
    border: 'border-amber-200/60',
    chip: 'bg-amber-100 text-amber-800',
    label: 'text-amber-900',
    Icon: Circle,
    iconClass: 'text-amber-700',
    emptyText: 'Sin tareas pendientes. Buen trabajo.',
  },
  en_proceso: {
    bg: 'bg-sky-50/60',
    border: 'border-sky-200/60',
    chip: 'bg-sky-100 text-sky-800',
    label: 'text-sky-900',
    Icon: CircleDot,
    iconClass: 'text-sky-700',
    emptyText: 'Nada en proceso en este momento.',
  },
  hecho: {
    bg: 'bg-emerald-50/60',
    border: 'border-emerald-200/60',
    chip: 'bg-emerald-100 text-emerald-800',
    label: 'text-emerald-900',
    Icon: CircleCheck,
    iconClass: 'text-emerald-700',
    emptyText: 'Aun no se han completado tareas.',
  },
};

function DroppableColumn({
  status,
  items,
  memberById,
  isInteractive,
  onCardClick,
}: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id: `column-${status}` });
  const cfg = COLUMN_CONFIG[status];
  const { Icon } = cfg;

  return (
    <div ref={setNodeRef} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-3`}>
      {/* Encabezado con icono de estado */}
      <h2 className={`mb-3 flex items-center justify-between text-sm font-semibold ${cfg.label}`}>
        <span className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${cfg.iconClass}`} aria-hidden="true" />
          {STATUS_LABELS[status]}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cfg.chip}`}>
          {items.length}
        </span>
      </h2>

      <SortableContext
        items={items.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* min-h-[120px] para zona de drop razonable */}
        <div className="flex min-h-[120px] flex-col gap-2">
          {items.map((task) => {
            const interactive = isInteractive(task);
            return (
              <TaskCard
                key={task.id}
                task={task}
                member={task.member_id ? memberById.get(task.member_id) : undefined}
                onClick={() => { if (interactive) onCardClick(task); }}
                interactive={interactive}
              />
            );
          })}
          {items.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-8">
              <p className="text-xs text-[var(--color-text-muted)] text-center px-3">
                <Inbox className="w-5 h-5 mx-auto mb-1.5 opacity-40" aria-hidden="true" />
                {cfg.emptyText}
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
