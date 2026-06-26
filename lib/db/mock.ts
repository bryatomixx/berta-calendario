/**
 * In-memory mock backend (offline / demo mode) para BVR Asesorias.
 *
 * Activo solo cuando NEXT_PUBLIC_USE_MOCK === 'true'. Deja correr la app sin
 * Supabase con datos seed realistas. El estado vive en memoria por la sesion y
 * se reinicia al recargar fuerte. Para apagarlo, quita NEXT_PUBLIC_USE_MOCK de
 * .env.local (el camino real de Supabase en lib/db/* queda intacto).
 */
import type { Member, Project, Task, TaskInput, Cliente } from '../types';
import clientesData from '@/data/clientes-demo.json';

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Store unico de clientes (sembrado desde el JSON de la cartera real). Es el
// mismo que usa la seccion Tributario; Berta puede agregar clientes nuevos.
const clients: Cliente[] = (clientesData as unknown as Cliente[]).map((c) => ({ ...c }));

// Berta es admin (crea y asigna). Las 4 trabajadoras ejecutan.
const members: Member[] = [
  { id: 'b1', name: 'Berta',      color: '#E71F22', role: 'admin',       created_at: '2026-05-01T10:00:00Z' },
  { id: 'w1', name: 'Luisa',      color: '#2563eb', role: 'trabajadora', created_at: '2026-05-01T10:05:00Z' },
  { id: 'w2', name: 'Naydis',     color: '#db2777', role: 'trabajadora', created_at: '2026-05-01T10:10:00Z' },
  { id: 'w3', name: 'Ginete',     color: '#9333ea', role: 'trabajadora', created_at: '2026-05-01T10:15:00Z' },
  { id: 'w4', name: 'Luz Elena',  color: '#ea580c', role: 'trabajadora', created_at: '2026-05-01T10:20:00Z' },
];

const projects: Project[] = [
  { id: 'pr1', name: 'Cierre contable de junio', description: 'Conciliaciones y cierre del mes.', status: 'activo', color: '#E71F22', created_at: '2026-05-28T09:00:00Z' },
  { id: 'pr2', name: 'Temporada de declaraciones', description: 'Declaraciones mensuales y anuales.', status: 'activo', color: '#0891b2', created_at: '2026-05-20T09:00:00Z' },
  { id: 'pr3', name: 'Digitalizacion de archivos', description: 'Pasar expedientes fisicos a digital.', status: 'activo', color: '#16a34a', created_at: '2026-05-15T09:00:00Z' },
  { id: 'pr4', name: 'Capacitacion del equipo', description: 'Formacion en software y normativa.', status: 'activo', color: '#ea580c', created_at: '2026-05-10T09:00:00Z' },
  { id: 'pr5', name: 'Migracion de software 2025', description: 'Proceso cerrado del anio pasado.', status: 'archivado', color: '#db2777', created_at: '2026-01-08T09:00:00Z' },
];

function t(
  id: string,
  title: string,
  status: Task['status'],
  priority: Task['priority'],
  member_id: string | null,
  client_id: string | null,
  hours: number | null,
  task_date: string,
  position: number,
  project_id: string | null = null,
  description: string | null = null,
): Task {
  return {
    id, title, description, status, priority, member_id, client_id, hours,
    task_date, position, project_id,
    created_at: `${task_date}T12:00:00Z`,
    updated_at: `${task_date}T12:00:00Z`,
  };
}

// Ids de clientes reales del JSON, usados para sembrar horas por cliente.
const C_420 = '420-latam-consultora-colombomexicana-sas';
const C_ABEL = 'abel-alberto-parra-martinez';
const C_ADELFA = 'adelfa-viloria-rios';

const tasks: Task[] = [
  t('t1', 'Conciliación bancaria de mayo', 'hecho', 'alta', 'w1', C_420, 4, '2026-06-04', 0, 'pr1'),
  t('t2', 'Declaración de IVA mensual', 'hecho', 'alta', 'w2', C_ABEL, 3, '2026-06-09', 1, 'pr2'),
  t('t3', 'Cálculo de nómina quincenal', 'en_proceso', 'alta', 'w3', C_420, null, '2026-06-18', 2, 'pr1'),
  t('t4', 'Emitir facturas pendientes del mes', 'pendiente', 'media', 'w1', C_ADELFA, null, '2026-06-21', 3, null),
  t('t5', 'Trámite de alta patronal', 'hecho', 'media', 'w4', C_420, 2, '2026-06-02', 4, null),
  t('t6', 'Revisión de gastos deducibles', 'hecho', 'media', 'w2', C_ADELFA, 5, '2026-06-11', 5, 'pr1'),
  t('t7', 'Auditoría interna del segundo trimestre', 'en_proceso', 'baja', 'w3', C_ABEL, null, '2026-06-17', 6, 'pr3'),
  t('t8', 'Reunión mensual de equipo', 'pendiente', 'media', 'w4', null, null, '2026-06-24', 7, 'pr4'),
  t('t9', 'Digitalizar expedientes 2024', 'hecho', 'baja', 'w4', C_420, 6, '2026-06-05', 8, 'pr3'),
  t('t10', 'Preparar declaración anual', 'en_proceso', 'alta', 'w1', C_ABEL, null, '2026-06-19', 9, 'pr2'),
  t('t11', 'Capacitación en software contable', 'pendiente', 'media', 'w2', null, null, '2026-06-22', 10, 'pr4'),
  t('t12', 'Conciliación de cuentas por cobrar', 'pendiente', 'media', 'w3', C_ADELFA, null, '2026-06-20', 11, null),
];

let idCounter = 0;
function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${++idCounter}-${Date.now()}`;
  }
}

function nowISO(): string {
  return new Date().toISOString();
}

export const mock = {
  getMembers(): Member[] {
    // Berta (admin) primero, luego las trabajadoras por nombre.
    return [...members].sort((a, b) => {
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  },
  addMember(name: string, color: string, role: Member['role'] = 'trabajadora'): Member {
    const m: Member = { id: newId(), name, color, role, created_at: nowISO() };
    members.push(m);
    return m;
  },

  getClients(): Cliente[] {
    return [...clients].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  },
  getClient(id: string): Cliente | null {
    return clients.find((c) => c.id === id) ?? null;
  },
  // Cliente nuevo creado al asignar una tarea: solo nombre, sin datos tributarios.
  addClient(nombre: string): Cliente {
    const c: Cliente = { id: newId(), nombre: nombre.trim(), obligacionesActivas: [] };
    clients.push(c);
    return c;
  },

  getTasks(): Task[] {
    return [...tasks].sort((a, b) => a.position - b.position);
  },
  addTask(input: TaskInput): Task {
    const task: Task = {
      ...input,
      id: newId(),
      description: input.description || null,
      created_at: nowISO(),
      updated_at: nowISO(),
    };
    tasks.push(task);
    return task;
  },
  updateTask(id: string, patch: Partial<Task>): Task {
    const task = tasks.find((x) => x.id === id);
    if (!task) throw new Error(`Mock: tarea ${id} no encontrada`);
    Object.assign(task, patch, { updated_at: nowISO() });
    return task;
  },

  getProjects(): Project[] {
    return [...projects].sort((a, b) => a.name.localeCompare(b.name));
  },
  addProject(name: string, description: string | null = null): Project {
    const palette = ['#E71F22', '#0891b2', '#16a34a', '#ea580c', '#db2777', '#9333ea'];
    const p: Project = {
      id: newId(),
      name,
      description,
      status: 'activo',
      color: palette[projects.length % palette.length],
      created_at: nowISO(),
    };
    projects.push(p);
    return p;
  },
  updateProject(id: string, patch: Partial<Project>): Project {
    const p = projects.find((x) => x.id === id);
    if (!p) throw new Error(`Mock: proyecto ${id} no encontrado`);
    Object.assign(p, patch);
    return p;
  },
};
