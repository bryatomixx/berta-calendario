-- BVR Asesorias — esquema de base de datos (board de tareas interno).
-- Correr en el SQL editor de Supabase del proyecto de BVR.

-- Equipo: Berta es 'admin' (crea y asigna). Las trabajadoras ejecutan.
create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  role text not null default 'trabajadora' check (role in ('admin', 'trabajadora')),
  created_at timestamptz not null default now()
);

-- Proyectos: agrupan tareas internas del equipo.
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'activo' check (status in ('activo', 'archivado')),
  color text not null default '#0d9488',
  created_at timestamptz not null default now()
);

-- Clientes de la firma: el mismo store que usa la seccion Tributario. Los datos
-- tributarios son opcionales (un cliente creado al asignar tarea es solo nombre).
create table clients (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nit text,
  digito_verificacion text,
  tipo_persona text check (tipo_persona in ('natural', 'juridica')),
  regimen_iva text check (regimen_iva in ('no_aplica', 'bimestral', 'cuatrimestral')),
  obligaciones_activas jsonb not null default '[]',
  email text,
  telefono text,
  notas text,
  created_at timestamptz not null default now()
);

-- Tareas asignadas a una persona (member_id) y a un cliente (client_id, opcional;
-- null = tarea interna). Las horas se acumulan al cliente en los reportes.
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_proceso', 'hecho')),
  priority text not null default 'media' check (priority in ('alta', 'media', 'baja')),
  member_id uuid references members(id),
  client_id uuid references clients(id) on delete set null,
  hours numeric(5,2),
  task_date date not null default current_date,
  position integer not null default 0,
  project_id uuid references projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security: permisiva. No hay login real; el acceso se protege
-- manteniendo privado el enlace de la app (decision explicita del proyecto).
alter table members enable row level security;
alter table projects enable row level security;
alter table clients enable row level security;
alter table tasks enable row level security;

create policy "public access" on members for all using (true) with check (true);
create policy "public access" on projects for all using (true) with check (true);
create policy "public access" on clients for all using (true) with check (true);
create policy "public access" on tasks for all using (true) with check (true);
