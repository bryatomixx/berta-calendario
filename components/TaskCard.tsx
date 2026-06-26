'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Building2 } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { Avatar } from './Avatar';
import type { Member, Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  member: Member | undefined;
  /** Nombre del cliente al que pertenece la tarea (undefined = tarea interna). */
  clientName?: string;
  onClick: () => void;
  /** Si es false la tarjeta no es arrastrable ni responde al clic (lectura). Default: true */
  interactive?: boolean;
}

export function TaskCard({ task, member, clientName, onClick, interactive = true }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: !interactive });

  function handleClick() {
    if (!interactive) return;
    onClick();
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...(interactive ? listeners : {})}
      onClick={handleClick}
      title={interactive ? 'Clic para editar' : undefined}
      className={[
        'rounded-xl border border-slate-200 bg-white p-3.5 text-left',
        'shadow-card transition-all duration-150 ease-out',
        interactive
          ? 'cursor-grab hover:-translate-y-0.5 hover:shadow-card-hover hover:border-slate-300/80'
          : 'cursor-default opacity-60',
        isDragging ? 'opacity-60 scale-[1.02] shadow-modal' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Titulo de la tarea */}
      <div className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
        {task.title}
      </div>

      {/* Fecha de la tarea */}
      {task.task_date && (
        <div className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          {task.task_date}
        </div>
      )}

      {/* Footer: cliente + prioridad a la izquierda, horas + avatar a la derecha */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {clientName ? (
            <span className="inline-flex items-center gap-1 max-w-[140px] rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
              <Building2 className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{clientName}</span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              Interno
            </span>
          )}
          <PriorityBadge priority={task.priority} variant="dot" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.hours != null && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums text-[var(--color-text-secondary)]">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {task.hours} h
            </span>
          )}
          {member && <Avatar name={member.name} color={member.color} size={22} />}
        </div>
      </div>
    </div>
  );
}
