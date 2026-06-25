# BVR Asesorías

Centro de control interno de la firma, en una sola app. Combina dos módulos:

## Equipo (board de tareas)
Board interno del equipo (Berta + las trabajadoras) con roles.
- **Tablero** kanban (Pendiente / En proceso / Hecho) con prioridad alta/media/baja.
- **Actividad** por día y por persona.
- **Proyectos** internos.
- **Equipo** (solo admin) y **Reportes**.
- Roles: Berta es admin (crea y asigna); las trabajadoras ven y actualizan lo suyo.

## Tributario (calendario DIAN)
Calendario tributario 2026 por cliente.
- **Vencimientos** DIAN en el radar, con semáforo de urgencia.
- **Calendario** mensual de vencimientos.
- **Clientes** con su NIT, régimen y obligaciones; los vencimientos se calculan por el dígito del NIT según el calendario 2026.

## Stack
Next.js 16.2 (App Router) + React 19 + Tailwind CSS v4 + TypeScript.

## Correr en local
```bash
npm install
npm run dev
```
Arranca en modo demo (datos de ejemplo en memoria) gracias a `NEXT_PUBLIC_USE_MOCK=true` en `.env`. No requiere base de datos. La pantalla inicial pide elegir quién eres (Berta o una trabajadora) para fijar el rol.

## Conectar la base real (fase 2)
El esquema está en `supabase/schema.sql`. Define las variables de Supabase en un `.env.local` y quita `NEXT_PUBLIC_USE_MOCK`. El calendario tributario lee sus datos demo de `data/*.json`.
