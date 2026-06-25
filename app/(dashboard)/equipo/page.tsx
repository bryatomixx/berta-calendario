'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, CheckCircle2, Circle, Timer } from 'lucide-react';
import { getMembers, addMember } from '@/lib/db/members';
import { getTasks } from '@/lib/db/tasks';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { MEMBER_COLORS, ROLE_LABELS } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/Avatar';
import type { Member, Task } from '@/lib/types';

/* Skeleton de carga */
function TeamSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-36" />
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

/* Fila de un miembro del equipo */
interface MemberRowProps {
  member: Member;
  tasks:  Task[];
}

function MemberRow({ member, tasks }: MemberRowProps) {
  const memberTasks = tasks.filter((t) => t.member_id === member.id);
  const total    = memberTasks.length;
  const done     = memberTasks.filter((t) => t.status === 'hecho').length;
  const open     = total - done;
  const hours    = memberTasks.reduce((s, t) => s + (t.hours ?? 0), 0);

  return (
    <Card variant="default" padding="md">
      <div className="flex items-center gap-4">
        <Avatar name={member.name} color={member.color} size={40} />

        {/* Nombre y rol */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {member.name}
            </span>
            <span
              className={[
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                member.role === 'admin'
                  ? 'bg-[var(--color-teal-50)] text-[var(--color-teal-700)]'
                  : 'bg-slate-100 text-slate-600',
              ].join(' ')}
            >
              {ROLE_LABELS[member.role]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {total} {total === 1 ? 'tarea' : 'tareas'} asignadas
          </p>
        </div>

        {/* Estadisticas */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-sm font-bold tabular-nums">{done}</span>
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">hechas</span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-amber-600">
              <Circle className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-sm font-bold tabular-nums">{open}</span>
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">abiertas</span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
              <Timer className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-sm font-bold tabular-nums">{hours}</span>
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">horas</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---- Pagina principal ---- */
export default function EquipoPage() {
  const { memberId, loaded } = useCurrentMember();

  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [newName, setNewName] = useState('');
  const [adding, setAdding]   = useState(false);
  const [addError, setAddError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getMembers(), getTasks()])
      .then(([m, t]) => {
        setMembers(m);
        setTasks(t);
      })
      .catch(() => setError('No pudimos cargar el equipo. Verifica tu conexion.'))
      .finally(() => setLoading(false));
  }, []);

  /* Resolucion del rol del miembro actual (puede estar cargando) */
  const currentMember = loaded
    ? (members.find((m) => m.id === memberId) ?? null)
    : null;

  const isAdmin = currentMember?.role === 'admin';

  async function handleAdd() {
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    setAddError('');
    try {
      const color  = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
      const added  = await addMember(name, color, 'trabajadora');
      setMembers((prev) => [...prev, added]);
      setNewName('');
      inputRef.current?.focus();
    } catch {
      setAddError('No pudimos agregar el miembro. Intenta de nuevo.');
    } finally {
      setAdding(false);
    }
  }

  /* Pantalla de carga */
  if (loading || !loaded) {
    return (
      <div className="animate-slide-up-fade">
        <PageHeader title="Equipo" />
        <TeamSkeleton />
      </div>
    );
  }

  /* Error de carga */
  if (error) {
    return (
      <EmptyState
        icon={Users}
        title="No pudimos cargar el equipo"
        body="Verifica tu conexion e intenta de nuevo."
      />
    );
  }

  /* Acceso denegado: solo admin */
  if (!isAdmin) {
    return (
      <div className="animate-slide-up-fade">
        <PageHeader title="Equipo" />
        <Card variant="flat" padding="md">
          <EmptyState
            icon={Users}
            title="Acceso restringido"
            body="Solo Berta (admin) puede ver el equipo."
          />
        </Card>
      </div>
    );
  }

  /* Clases del input */
  const inputCls =
    'h-9 flex-1 min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm ' +
    'placeholder:text-[var(--color-text-disabled)] ' +
    'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none ' +
    'transition-colors duration-[var(--duration-fast)]';

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        title="Equipo"
        subtitle={`${members.length} ${members.length === 1 ? 'miembro' : 'miembros'}`}
        actions={
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAdd(); } }}
                placeholder="Nombre del nuevo miembro"
                className={inputCls}
                aria-label="Nombre del nuevo miembro"
              />
              <Button
                variant="primary"
                onClick={handleAdd}
                loading={adding}
                disabled={!newName.trim()}
              >
                Agregar miembro
              </Button>
            </div>
            {addError && (
              <p className="text-xs text-rose-600" role="alert">{addError}</p>
            )}
          </div>
        }
      />

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin miembros todavia"
          body="Agrega el primer miembro usando el campo de arriba."
        />
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} tasks={tasks} />
          ))}
        </div>
      )}
    </div>
  );
}
