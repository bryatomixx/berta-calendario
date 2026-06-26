export const STATUSES = ['pendiente', 'en_proceso', 'hecho'] as const;

export const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  hecho: 'Hecho',
};

// Roles del equipo. Berta es admin (crea y asigna); las trabajadoras ejecutan.
export const ROLES = ['admin', 'trabajadora'] as const;

export const ROLE_LABELS: Record<(typeof ROLES)[number], string> = {
  admin: 'Admin',
  trabajadora: 'Trabajadora',
};

// Palette assigned to members in order, for their avatars.
export const MEMBER_COLORS = [
  '#0d9488',
  '#2563eb',
  '#db2777',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#16a34a',
  '#dc2626',
];

// Prioridad de una tarea (alta primero por orden de urgencia).
export const PRIORITIES = ['alta', 'media', 'baja'] as const;

export const PRIORITY_LABELS: Record<(typeof PRIORITIES)[number], string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

// Estilos del badge/punto de prioridad: alta rojo, media ambar, baja gris.
export const PRIORITY_STYLES: Record<(typeof PRIORITIES)[number], { chip: string; dot: string }> = {
  alta:  { chip: 'bg-rose-100 text-rose-700',   dot: 'bg-rose-500' },
  media: { chip: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  baja:  { chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

// Estado de un proyecto.
export const PROJECT_STATUSES = ['activo', 'archivado'] as const;

// Paleta para el color de cada proyecto.
export const PROJECT_COLORS = [
  '#0d9488',
  '#0891b2',
  '#16a34a',
  '#ea580c',
  '#db2777',
  '#9333ea',
];
