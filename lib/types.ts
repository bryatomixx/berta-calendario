import { CATEGORIES, STATUSES, PRIORITIES, PROJECT_STATUSES, ROLES } from './constants';

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type Role = (typeof ROLES)[number];

export interface Member {
  id: string;
  name: string;
  color: string;
  // Berta es 'admin' (crea y asigna). Las demas son 'trabajadora'.
  role: Role;
  created_at: string;
}

// Un proyecto agrupa tareas internas del equipo (sin cliente).
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  status: Status;
  priority: Priority;
  // member_id = la persona a la que la tarea esta asignada.
  member_id: string | null;
  hours: number | null;
  task_date: string;
  position: number;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

// Forma del formulario de crear/editar (solo admin). El admin siempre elige a
// quien asignar, por eso member_id es obligatorio aqui.
export interface TaskInput {
  title: string;
  description: string;
  category: Category;
  status: Status;
  priority: Priority;
  member_id: string;
  hours: number | null;
  task_date: string;
  position: number;
  project_id: string | null;
}
