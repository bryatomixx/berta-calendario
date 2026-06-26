'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '@/lib/constants';
import { validateTask, type ValidationErrors } from '@/lib/validation';
import { addTask, updateTask } from '@/lib/db/tasks';
import { getProjects } from '@/lib/db/projects';
import { getClients, addClient } from '@/lib/db/clients';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Cliente, Member, Project, Task, TaskInput } from '@/lib/types';

interface TaskModalProps {
  open: boolean;
  task: Task | null;        // null = modo creacion
  members: Member[];
  defaultMemberId: string;
  onClose: () => void;
  onSaved: (task: Task) => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/* Estilos base de input/select reutilizables */
const inputCls =
  'w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm ' +
  'placeholder:text-[var(--color-text-disabled)] ' +
  'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none ' +
  'transition-colors duration-[var(--duration-fast)]';

const textareaCls =
  'w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm ' +
  'placeholder:text-[var(--color-text-disabled)] resize-none ' +
  'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none ' +
  'transition-colors duration-[var(--duration-fast)]';

export function TaskModal({
  open,
  task,
  members,
  defaultMemberId,
  onClose,
  onSaved,
}: TaskModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<TaskInput>(() => ({
    title:       task?.title ?? '',
    description: task?.description ?? '',
    status:      task?.status ?? 'pendiente',
    priority:    task?.priority ?? 'media',
    member_id:   task?.member_id ?? defaultMemberId,
    client_id:   task?.client_id ?? null,
    hours:       task?.hours ?? null,
    task_date:   task?.task_date ?? today(),
    position:    task?.position ?? 0,
    project_id:  task?.project_id ?? null,
  }));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  /* Modo del selector de cliente: elegir uno existente o crear uno nuevo */
  const [clientMode, setClientMode] = useState<'select' | 'new'>('select');
  const [newClientName, setNewClientName] = useState('');

  /* Carga los proyectos activos para el selector */
  useEffect(() => {
    getProjects()
      .then((all) => setProjects(all.filter((p) => p.status === 'activo')))
      .catch(() => { /* silencioso: el selector quedara vacio */ });
  }, []);

  /* Carga los clientes para asignar la tarea */
  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() => { /* silencioso: el selector quedara vacio */ });
  }, []);

  /* Enfoca el titulo al abrir en modo creacion */
  useEffect(() => {
    if (open && !task && titleRef.current) {
      titleRef.current.focus();
    }
  }, [open, task]);

  /* Cierra con Escape */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function set<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const found = validateTask(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setSaveError('');
    try {
      let payload = form;
      // Si Berta escribio un cliente nuevo, se crea primero y se usa su id.
      if (clientMode === 'new' && newClientName.trim()) {
        const nuevo = await addClient(newClientName);
        payload = { ...form, client_id: nuevo.id };
      }
      const saved = task
        ? await updateTask(task.id, payload)
        : await addTask(payload);
      onSaved(saved);
    } catch {
      setSaveError('No se pudo guardar. Intenta de nuevo. Si el error persiste, recarga la pagina.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card
        variant="default"
        padding="none"
        className="w-full max-w-lg shadow-modal animate-scale-in"
      >
        {/* Encabezado del modal */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--color-border-soft)]">
          <h2 className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
            {task ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Cuerpo del formulario */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4">

            <Field label="Titulo de la tarea" error={errors.title} full>
              <input
                ref={titleRef}
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ej: Declaracion mensual de IVA"
                className={inputCls}
              />
            </Field>

            <Field label="Descripcion (opcional)" full>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="Detalles adicionales sobre la tarea"
                className={textareaCls}
              />
            </Field>

            <Field label="Asignar a" error={errors.member_id}>
              <select
                value={form.member_id}
                onChange={(e) => set('member_id', e.target.value)}
                className={inputCls}
              >
                <option value="">Selecciona un miembro</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Cliente">
              {clientMode === 'select' ? (
                <select
                  value={form.client_id ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '__new__') {
                      setClientMode('new');
                      return;
                    }
                    set('client_id', v === '' ? null : v);
                  }}
                  className={inputCls}
                >
                  <option value="">Sin cliente (interno)</option>
                  <option value="__new__">+ Crear cliente nuevo…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nombre del cliente nuevo"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => { setClientMode('select'); setNewClientName(''); }}
                    className="shrink-0 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-1"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </Field>

            <Field label="Estado">
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as TaskInput['status'])}
                className={inputCls}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </Field>

            <Field label="Prioridad">
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value as TaskInput['priority'])}
                className={inputCls}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </Field>

            <Field label="Proyecto (opcional)">
              <select
                value={form.project_id ?? ''}
                onChange={(e) =>
                  set('project_id', e.target.value === '' ? null : e.target.value)
                }
                className={inputCls}
              >
                <option value="">Sin proyecto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Horas trabajadas" error={errors.hours}>
              <input
                type="number"
                min="0"
                step="0.25"
                value={form.hours ?? ''}
                onChange={(e) =>
                  set('hours', e.target.value === '' ? null : Number(e.target.value))
                }
                placeholder="Ej: 2.5"
                className={inputCls}
              />
            </Field>

            <Field label="Fecha del trabajo" full>
              <input
                type="date"
                value={form.task_date}
                onChange={(e) => set('task_date', e.target.value)}
                className={inputCls}
              />
            </Field>

          </div>

          {saveError && (
            <p className="mt-3 text-sm text-rose-600">{saveError}</p>
          )}
        </div>

        {/* Pie del modal */}
        <div className="flex justify-end gap-2 px-6 pb-5 pt-2 border-t border-[var(--color-border-soft)]">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
          >
            {saving ? 'Guardando...' : 'Guardar tarea'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? 'col-span-2' : 'col-span-1'}`}>
      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  );
}
