# Centro de Comando de Clientes - Especificacion Visual UI

**Stack:** Next.js 16.2.6 App Router, TypeScript, Tailwind CSS v4, Plus Jakarta Sans, lucide-react, @dnd-kit  
**Audiencia:** Equipo interno de agencia (3-10 personas). Desktop-first. Sin auth publica.  
**Objetivo:** Pasar de "funcional y plano" a "herramienta premium que da orgullo usar".

---

## Diagnostico del estado actual

Problemas concretos identificados en las capturas:

1. **Navegacion horizontal en topbar** - rompe el patron mental de apps de trabajo serias; no hay jerarquia visual clara entre la marca y los links.
2. **Fondo gris liso (`bg-slate-50`)** - correcto pero sin estructura; el contenido "flota" sin delimitacion.
3. **Lista de clientes: tabla desnuda** - 3 columnas numericas sin contexto visual. No se siente como un CRM.
4. **Detalle de cliente: dos tablas planas apiladas** - la seccion mas importante de la app. Sin stat cards, sin barra de progreso, sin avatar de responsable. Se lee como un Excel.
5. **Reportes: tres tablas iguales en grid** - el unico elemento diferenciador es el titulo. Sin mini-barras, sin coloreo, sin total destacado.
6. **Portal del cliente: pagina centralizada sin identidad** - carece de logotipo o color de marca de la agencia. El formulario se ve como un wireframe.
7. **Tipografia plana** - todos los textos estan a peso 400 o 600 sin una escala de jerarquia clara. Faltan los niveles display, body-sm, caption.
8. **Sin estados de interaccion en la sidebar** - no existe sidebar todavia; la topbar no tiene indicador de focus visible (solo el color del boton activo).

---

## 1. Design Tokens (para `@theme` en `app/globals.css`)

### Paleta

La direccion es **indigo refinado con matices de slate profundo**. Se mantiene el acento indigo existente pero se enriquece la escala neutral y se introduce un canvas blanco puro para el sidebar vs. gris muy suave para el body.

```css
@import "tailwindcss";

@theme {
  /* ----- Color: Neutrales ----- */
  --color-canvas:      #FFFFFF;
  --color-surface:     #F8F9FC;   /* body background */
  --color-surface-2:   #F1F3F9;   /* hover rows, inputs */
  --color-border:      #E4E7EF;   /* bordes generales */
  --color-border-soft: #EFF1F7;   /* separadores internos */

  /* ----- Color: Texto ----- */
  --color-text-primary:   #0F172A;   /* slate-900 */
  --color-text-secondary: #475569;   /* slate-600 */
  --color-text-muted:     #94A3B8;   /* slate-400 */
  --color-text-disabled:  #CBD5E1;   /* slate-300 */

  /* ----- Color: Acento indigo (refinado) ----- */
  --color-indigo-50:  #EEF2FF;
  --color-indigo-100: #E0E7FF;
  --color-indigo-200: #C7D2FE;
  --color-indigo-500: #6366F1;
  --color-indigo-600: #4F46E5;  /* CTA principal */
  --color-indigo-700: #4338CA;  /* hover CTA */
  --color-indigo-900: #312E81;  /* texto sidebar activo */

  /* ----- Color: Estados semanticos ----- */
  --color-pendiente-bg:    #FFFBEB;
  --color-pendiente-border:#FDE68A;
  --color-pendiente-text:  #92400E;
  --color-pendiente-chip:  #FEF3C7;

  --color-proceso-bg:    #F0F9FF;
  --color-proceso-border:#BAE6FD;
  --color-proceso-text:  #075985;
  --color-proceso-chip:  #E0F2FE;

  --color-hecho-bg:    #F0FDF4;
  --color-hecho-border:#BBF7D0;
  --color-hecho-text:  #14532D;
  --color-hecho-chip:  #DCFCE7;

  /* ----- Color: Categorias (badges) ----- */
  --color-cat-landing-bg:    #DBEAFE;
  --color-cat-landing-text:  #1E40AF;
  --color-cat-anuncios-bg:   #FFEDD5;
  --color-cat-anuncios-text: #9A3412;
  --color-cat-seo-bg:        #DCFCE7;
  --color-cat-seo-text:      #14532D;
  --color-cat-diseno-bg:     #FCE7F3;
  --color-cat-diseno-text:   #831843;
  --color-cat-copy-bg:       #F3E8FF;
  --color-cat-copy-text:     #6B21A8;
  --color-cat-devweb-bg:     #CFFAFE;
  --color-cat-devweb-text:   #164E63;
  --color-cat-reunion-bg:    #FEF9C3;
  --color-cat-reunion-text:  #713F12;
  --color-cat-otro-bg:       #F1F5F9;
  --color-cat-otro-text:     #475569;

  /* ----- Tipografia ----- */
  --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;

  --text-display: 1.75rem;   /* 28px - titulos de pagina */
  --text-xl:      1.25rem;   /* 20px - subtitulos de seccion */
  --text-lg:      1.125rem;  /* 18px - stat card value */
  --text-base:    0.9375rem; /* 15px - body principal */
  --text-sm:      0.8125rem; /* 13px - labels, metadata */
  --text-xs:      0.6875rem; /* 11px - badges, timestamps */

  --leading-tight:  1.2;
  --leading-normal: 1.5;
  --leading-relaxed:1.65;

  /* ----- Espaciado ----- */
  --sidebar-w:       240px;
  --topbar-h:        56px;  /* solo en mobile */
  --content-max-w:   1100px;
  --page-px:         32px;   /* padding horizontal del area de contenido */
  --page-py:         28px;   /* padding vertical */
  --section-gap:     24px;   /* espacio entre secciones */
  --card-p:          20px;   /* padding interno de cards */
  --card-p-sm:       14px;   /* cards compactas */

  /* ----- Radios ----- */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   18px;
  --radius-full: 9999px;

  /* ----- Sombras ----- */
  --shadow-xs:   0 1px 2px 0 rgba(15,23,42,0.05);
  --shadow-sm:   0 1px 3px 0 rgba(15,23,42,0.06), 0 1px 2px -1px rgba(15,23,42,0.04);
  --shadow-card: 0 1px 2px 0 rgba(15,23,42,0.04), 0 4px 12px -2px rgba(15,23,42,0.06);
  --shadow-card-hover: 0 2px 4px 0 rgba(15,23,42,0.05), 0 12px 24px -4px rgba(15,23,42,0.09);
  --shadow-modal: 0 20px 60px -12px rgba(15,23,42,0.22), 0 4px 16px -4px rgba(15,23,42,0.10);

  /* ----- Transiciones ----- */
  --duration-fast:   150ms;
  --duration-normal: 200ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

> Los tokens `shadow-card` y `shadow-card-hover` del CSS existente se reemplazan con estas versiones mas ricas que ya estan declaradas arriba como custom properties. Las clases utilitarias `.shadow-card` y `.shadow-card-hover` se mantienen en el bloque de utilities para no romper el codigo existente.

---

## 2. Primitivos compartidos (componentes a crear)

### 2.1 `Button`

**Archivo sugerido:** `components/ui/Button.tsx`

```
Props:
  variant:  'primary' | 'secondary' | 'ghost' | 'danger'
  size:     'sm' | 'md' (default)
  icon?:    ReactNode  (lucide, aparece a la izquierda)
  iconOnly?: boolean
  disabled?: boolean
  loading?:  boolean
  children: ReactNode
```

**Clases por variante:**

| Variante | Base | Hover | Focus ring | Disabled |
|----------|------|-------|------------|----------|
| `primary` | `bg-indigo-600 text-white shadow-card` | `hover:bg-indigo-700` | `focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2` | `disabled:opacity-40 disabled:cursor-not-allowed` |
| `secondary` | `bg-white text-slate-700 border border-[--color-border] shadow-xs` | `hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700` | misma del primary | misma del primary |
| `ghost` | `text-slate-600 bg-transparent` | `hover:bg-[--color-surface-2] hover:text-slate-900` | misma | misma |
| `danger` | `bg-rose-600 text-white shadow-card` | `hover:bg-rose-700` | `focus-visible:ring-rose-500/40` | misma |

**Tamano:**

| Size | Clases |
|------|--------|
| `md` | `h-9 rounded-[--radius-md] px-4 text-sm font-semibold gap-1.5` |
| `sm` | `h-7 rounded-[--radius-sm] px-3 text-xs font-semibold gap-1` |
| `iconOnly` | `h-8 w-8 rounded-[--radius-md] p-0 justify-center` |

Transicion: `transition-all duration-150 ease-out cursor-pointer`

**Estado loading:** el children se reemplaza por un spinner SVG animado (mismo color que el texto). Boton se deshabilita automaticamente.

---

### 2.2 `Card`

**Archivo:** `components/ui/Card.tsx`

```
Props:
  variant: 'default' | 'flat' | 'highlighted'
  padding: 'md' | 'sm' | 'none'
  children: ReactNode
  className?: string
```

| Variante | Clases base |
|----------|-------------|
| `default` | `bg-white rounded-[--radius-xl] border border-[--color-border] shadow-card` |
| `flat` | `bg-white rounded-[--radius-xl] border border-[--color-border-soft]` |
| `highlighted` | `bg-indigo-50/60 rounded-[--radius-xl] border border-indigo-200/70` |

Padding: `p-[--card-p]` (md) o `p-[--card-p-sm]` (sm) o nada (none).

Hover (cuando es clickable, via prop `as="button"`): `hover:shadow-card-hover hover:-translate-y-px transition-all duration-200`

---

### 2.3 `StatCard`

**Archivo:** `components/ui/StatCard.tsx`

Usado en Tablero (home) y Detalle de cliente.

```
Props:
  label:      string       -- ej. "Horas totales"
  value:      string       -- ej. "42.5 h"
  icon:       LucideIcon
  iconColor?: string       -- clase Tailwind de color, ej. "text-indigo-600"
  iconBg?:    string       -- clase bg, ej. "bg-indigo-50"
  trend?:     string       -- ej. "+3 esta semana" (opcional)
  trendUp?:   boolean      -- true = verde, false = rojo
```

**Estructura HTML:**

```
<div class="bg-white rounded-[--radius-xl] border border-[--color-border] shadow-card p-[--card-p] flex items-start gap-4">
  <div class="shrink-0 w-10 h-10 rounded-[--radius-lg] {iconBg} flex items-center justify-center">
    <Icon class="w-5 h-5 {iconColor}" />
  </div>
  <div class="min-w-0">
    <p class="text-xs font-semibold uppercase tracking-wide text-[--color-text-muted]">{label}</p>
    <p class="mt-0.5 text-xl font-bold tracking-tight text-[--color-text-primary]">{value}</p>
    (si trend) <p class="mt-1 text-xs text-{trendUp?emerald:rose}-600">{trend}</p>
  </div>
</div>
```

---

### 2.4 `Badge` / `Pill`

**Archivo:** `components/ui/Badge.tsx`  
Reemplaza y unifica `CategoryBadge` y `StatusPill`.

```
Props:
  variant: 'category' | 'status' | 'source'
  value:   Category | Status | 'cliente' | 'agencia'
  size:    'sm' | 'xs' (default)
```

Clases base: `inline-flex items-center rounded-[--radius-full] font-medium leading-none whitespace-nowrap`

| size | clases |
|------|--------|
| `xs` | `px-2 py-0.5 text-[11px]` |
| `sm` | `px-2.5 py-1 text-xs` |

Los colores de categoria usan exactamente las variables de token definidas en seccion 1. Ejemplo:
- `Landing page`: `bg-[--color-cat-landing-bg] text-[--color-cat-landing-text]`
- Status `pendiente`: `bg-[--color-pendiente-chip] text-[--color-pendiente-text]`

Badge `source='cliente'` (el ticket de solicitud del cliente):
- `bg-amber-100 text-amber-800` con icono `Ticket` (lucide) a la izquierda, `w-3 h-3`

---

### 2.5 `EmptyState`

**Archivo:** `components/ui/EmptyState.tsx`

```
Props:
  icon:     LucideIcon
  title:    string
  body?:    string
  action?:  ReactNode  -- boton opcional
```

Estructura:
```
<div class="py-12 px-6 flex flex-col items-center text-center gap-3">
  <div class="w-12 h-12 rounded-[--radius-xl] bg-slate-100 flex items-center justify-center">
    <Icon class="w-6 h-6 text-[--color-text-muted]" />
  </div>
  <p class="text-sm font-semibold text-[--color-text-secondary]">{title}</p>
  (si body) <p class="text-xs text-[--color-text-muted] max-w-xs">{body}</p>
  (si action) {action}
</div>
```

---

### 2.6 `PageHeader`

**Archivo:** `components/ui/PageHeader.tsx`

```
Props:
  title:    string
  subtitle?: string
  back?:    { href: string; label: string }
  actions?: ReactNode  -- botones del lado derecho
```

Estructura:
```
<div class="mb-6">
  (si back)
  <Link class="inline-flex items-center gap-1 text-xs font-medium text-[--color-text-muted] hover:text-indigo-600 mb-2 transition-colors duration-150">
    <ChevronLeft class="w-3.5 h-3.5" /> {back.label}
  </Link>
  <div class="flex items-end justify-between gap-4">
    <div>
      <h1 class="text-[1.75rem] font-bold tracking-tight leading-[1.2] text-[--color-text-primary]">{title}</h1>
      (si subtitle) <p class="mt-1 text-sm text-[--color-text-secondary]">{subtitle}</p>
    </div>
    (si actions) <div class="flex items-center gap-2 shrink-0">{actions}</div>
  </div>
</div>
```

---

### 2.7 `SectionTitle`

**Archivo:** `components/ui/SectionTitle.tsx`

Titulo de subseccion dentro de una pagina.

```
Props:
  children: ReactNode
  action?:  ReactNode
```

```
<div class="flex items-center justify-between mb-3">
  <h2 class="text-xs font-bold uppercase tracking-widest text-[--color-text-muted]">{children}</h2>
  (si action) {action}
</div>
```

---

### 2.8 `DataRow`

**Archivo:** `components/ui/DataRow.tsx`

Reemplaza los `<tr>` de tablas genericas con un componente que añade hover y estructura consistente.

```
Props:
  cells:  ReactNode[]  -- celdas en orden
  href?:  string       -- si existe, toda la fila es clickable
  last?:  boolean
```

Clase base de la fila:
```
border-t border-[--color-border-soft] transition-colors duration-[--duration-fast]
hover:bg-[--color-surface-2] cursor-pointer (si href)
```

Primera celda (nombre): `text-sm font-medium text-[--color-text-primary]`  
Celdas secundarias: `text-sm text-[--color-text-secondary]`  
Celda numerica: `text-sm tabular-nums font-medium text-[--color-text-primary]`

---

### 2.9 `MiniBar` (barra de progreso pura CSS)

**Archivo:** `components/ui/MiniBar.tsx`

Sin libreria de charts. Para las horas por categoria en detalle de cliente.

```
Props:
  value:    number  -- horas reales
  max:      number  -- horas maximas del grupo
  color?:   string  -- clase Tailwind, default 'bg-indigo-500'
  label?:   string
```

```
<div class="flex items-center gap-3">
  (si label) <span class="text-sm text-[--color-text-secondary] w-32 shrink-0">{label}</span>
  <div class="flex-1 h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden">
    <div
      class="{color} h-full rounded-full transition-all duration-500 ease-out"
      style="width: {Math.round((value/max)*100)}%"
    />
  </div>
  <span class="text-xs tabular-nums font-medium text-[--color-text-secondary] w-10 text-right">{value} h</span>
</div>
```

---

### 2.10 `Avatar` (refinado)

El componente `Avatar.tsx` existente es correcto en logica. Se refina el estilo:

- Borde blanco de 1.5px (para cuando se apilan avatares): `ring-1 ring-white`
- Sombra tiny: `shadow-xs`
- El `fontSize` interno cambia a `size * 0.38` para mejor legibilidad en tamanos chicos.
- Tamanos estandar: 24px (tabla), 28px (sidebar), 32px (card encabezado)

---

## 3. Sidebar shell

### Estructura de layout

Se reemplaza la topbar horizontal actual por un **layout de dos columnas fijas**:

```
RootLayout (body bg-[--color-surface])
  └── DashboardLayout (flex h-screen overflow-hidden)
        ├── Sidebar  (w-[240px] shrink-0 h-full flex flex-col border-r border-[--color-border] bg-white)
        └── main     (flex-1 overflow-y-auto)
              └── contenido con max-w-[--content-max-w] mx-auto px-[--page-px] py-[--page-py]
```

El `DashboardLayout` existe como `app/(dashboard)/layout.tsx`.

### Sidebar - estructura interna

```
<aside class="w-[240px] shrink-0 h-full flex flex-col border-r border-[--color-border] bg-white">

  <!-- Marca -->
  <div class="px-5 py-5 border-b border-[--color-border-soft]">
    <div class="flex items-center gap-2.5">
      <div class="w-7 h-7 rounded-[--radius-md] bg-indigo-600 flex items-center justify-center shrink-0">
        <Command class="w-4 h-4 text-white" />   <!-- icono lucide: Command -->
      </div>
      <span class="text-sm font-bold tracking-tight text-[--color-text-primary]">Centro de Comando</span>
    </div>
  </div>

  <!-- Nav principal -->
  <nav class="flex-1 px-3 py-4 flex flex-col gap-0.5">
    <NavItem href="/"          icon={LayoutDashboard} label="Tablero" />
    <NavItem href="/clientes"  icon={Users}            label="Clientes" />
    <NavItem href="/reportes"  icon={BarChart2}         label="Reportes" />
  </nav>

  <!-- Member switcher (abajo) -->
  <div class="px-3 py-4 border-t border-[--color-border-soft]">
    <button class="w-full flex items-center gap-3 rounded-[--radius-lg] px-2 py-2 text-left
                   transition-colors duration-[--duration-fast] hover:bg-[--color-surface-2]
                   focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none">
      <Avatar name={member.name} color={member.color} size={32} />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-[--color-text-primary] truncate">{member.name}</p>
        <p class="text-xs text-[--color-text-muted]">Cambiar persona</p>
      </div>
      <ChevronsUpDown class="w-3.5 h-3.5 text-[--color-text-muted] shrink-0" />
    </button>
  </div>

</aside>
```

### NavItem - estados

```
Props: href, icon (LucideIcon), label, active (auto por pathname)
```

| Estado | Clases |
|--------|--------|
| Inactivo | `flex items-center gap-3 rounded-[--radius-md] px-3 py-2 text-sm font-medium text-[--color-text-secondary] transition-all duration-[--duration-fast] hover:bg-[--color-surface-2] hover:text-[--color-text-primary]` |
| Activo | `... bg-indigo-50 text-indigo-700 font-semibold` + icono `text-indigo-600` |
| Focus | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40` |

El icono siempre es `w-4 h-4`. En estado inactivo: `text-[--color-text-muted]`. En activo: `text-indigo-600`.

### Responsive (pantallas < 1024px)

La app es desktop-first interna. En pantallas < 1024px la sidebar **se colapsa a una barra superior** de 56px:

```
lg:hidden -- topbar mobile de 56px, flex, items-center, px-4, justify-between
  - Logo mark (el div indigo con el icono Command)
  - Nombre "Centro de Comando"
  - Boton hamburger (Menu icon) que abre la sidebar como drawer con overlay
```

El drawer mobile tiene `z-50`, entra desde la izquierda con `translate-x-0` vs `translate-x-[-240px]`, transicion 200ms ease-out. Overlay `bg-black/30` backdrop-blur-sm.

---

## 4. Especificacion por pantalla

### 4.1 Tablero (`/`)

**Layout:**
```
<PageHeader title="Tablero" actions={<FilterRow /> + <Button primary icon={Plus}>Nueva tarea</Button>} />
<StatRow />   -- 4 stat cards en grid-cols-4 gap-4 mb-6
<Board />     -- grid-cols-3 gap-4
```

**StatRow - 4 tarjetas:**

| Label | Value | Icono | iconBg | iconColor |
|-------|-------|-------|--------|-----------|
| Total de tareas | count | `ClipboardList` | `bg-slate-100` | `text-slate-500` |
| En proceso | count | `Loader2` | `bg-sky-50` | `text-sky-600` |
| Pendientes | count | `Clock` | `bg-amber-50` | `text-amber-600` |
| Horas este mes | suma | `Timer` | `bg-indigo-50` | `text-indigo-600` |

Los valores se calculan con los datos de `tasks` ya disponibles en `BoardPage`.

**FilterRow** (donde estan los selects actuales):
- Los selects se reemplazan por `<select>` estilizados o por un par de componentes `FilterChip` (pill con chevron).
- Clases del select: `h-9 rounded-[--radius-md] border border-[--color-border] bg-white pl-3 pr-8 text-sm text-[--color-text-secondary] shadow-xs transition-colors duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none appearance-none`
- Cursor: `cursor-pointer`

**Columnas del Kanban - ajustes visuales:**

Las columnas ya tienen los colores tonales correctos. Refinamientos:

- Encabezado de columna: icono de estado a la izquierda del label.
  - Pendiente: `Circle` icon (amber-700)
  - En proceso: `CircleDot` icon (sky-700)
  - Hecho: `CircleCheck` icon (emerald-700)
- Chip de conteo: ya es correcto en forma; ajustar a `rounded-full px-2 py-0.5 text-[11px] font-bold`
- La zona droppable vacia tiene `min-h-[120px]` para que sea un area razonable.
- Empty state de columna: `EmptyState` con icono `InboxIcon`, sin titulo largo, solo `text-xs text-[--color-text-muted] py-8 text-center`.

**TaskCard - refinamientos:**

- El nombre del cliente: mantener `text-[11px] font-bold uppercase tracking-widest` pero cambiar color a `text-[--color-text-muted]` (un poco mas oscuro que el actual `text-slate-400`).
- Titulo de tarea: `text-sm font-semibold text-[--color-text-primary]` (subir de medium a semibold).
- Footer de la card: badge de categoria a la izquierda, `{ horas + avatar }` a la derecha.
- Horas: `text-[11px] font-bold tabular-nums text-[--color-text-secondary]` con icono `Clock` de `w-3 h-3` antes del numero.
- El badge de `source='cliente'` (ticket de solicitud) se coloca en la esquina superior derecha como una etiqueta pequena, no como parte del header.
- Hover: `hover:-translate-y-0.5 hover:shadow-card-hover` ya existe. Anadir `hover:border-slate-300/80` para feedback adicional.
- Dragging: `opacity-60 scale-[1.02] shadow-modal` (el card se "levanta").

---

### 4.2 Clientes - lista (`/clientes`)

**Layout:**
```
<PageHeader
  title="Clientes"
  subtitle="{n} clientes activos"
  actions={<InputInline placeholder="Nombre del cliente" /> + <Button primary icon={Plus}>Agregar</Button>}
/>
<Card variant="flat" padding="none">
  <ClientTable />
</Card>
```

**ClientTable - columnas enriquecidas:**

Reemplazar la tabla plana con filas ricas. Cada fila tiene:

```
columna 1 (flex-1): Avatar(32) + nombre en semibold + tag "portal activo" (Badge xs ghost)
columna 2 (w-32):   Horas totales con icono Timer, valor en tabular-nums font-bold
columna 3 (w-24):   "{n} abiertas" con dot amber-500 antes
columna 4 (w-24):   "{n} hechas" con dot emerald-500 antes
columna 5 (w-10):   ChevronRight icon (aparece en hover de la fila)
```

Encabezado de tabla:
```
<thead class="border-b border-[--color-border]">
  <tr>
    <th class="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[--color-text-muted]">
```

Fila hover: `hover:bg-[--color-surface-2] cursor-pointer transition-colors duration-[--duration-fast]`

La celda de nombre tiene el avatar con iniciales de color (el mismo `MEMBER_COLORS` se puede reusar asignando un color por indice al cliente, o se genera un color desde un hash del `client.id`).

Empty state (sin clientes): `EmptyState` con `Users` icon, "Aun no hay clientes", body "Agrega tu primer cliente para comenzar.", accion `Button secondary` "Agregar cliente".

---

### 4.3 Detalle de cliente (`/clientes/[id]`) -- la pagina estrella

**Layout:**
```
<PageHeader
  title={client.name}
  back={{ href: '/clientes', label: 'Clientes' }}
  actions={<Button secondary icon={Link2}>Copiar link del portal</Button>}
/>
<StatGrid />     -- 4 stat cards en grid-cols-4 gap-4 mb-8
<div class="grid grid-cols-5 gap-6">
  <div class="col-span-2">
    <CategoryBreakdown />   -- mini barras por categoria
  </div>
  <div class="col-span-3">
    <TaskTimeline />        -- lista de tareas ordenadas por fecha desc
  </div>
</div>
```

**StatGrid - 4 tarjetas:**

| Label | Value | Icono | iconBg | iconColor |
|-------|-------|-------|--------|-----------|
| Horas totales | "{n} h" | `Timer` | `bg-indigo-50` | `text-indigo-600` |
| Tareas hechas | count | `CircleCheck` | `bg-emerald-50` | `text-emerald-600` |
| En proceso | count | `CircleDot` | `bg-sky-50` | `text-sky-600` |
| Pendientes | count | `Clock` | `bg-amber-50` | `text-amber-600` |

**CategoryBreakdown:**

```
<SectionTitle>Horas por area</SectionTitle>
<Card variant="default" padding="md">
  <div class="flex flex-col gap-4">
    {byCategory.map(row => (
      <MiniBar
        key={row.key}
        label={row.key}
        value={row.hours}
        max={maxHoursAcrossCategories}
        color={CATEGORY_BAR_COLOR[row.key]}   -- ver tabla abajo
      />
    ))}
  </div>
</Card>
```

Colores de barra por categoria:

| Categoria | color class |
|-----------|------------|
| Landing page | `bg-blue-500` |
| Anuncios | `bg-orange-500` |
| SEO | `bg-emerald-500` |
| Diseno | `bg-pink-500` |
| Contenido/Copy | `bg-purple-500` |
| Desarrollo web | `bg-cyan-500` |
| Reunion | `bg-amber-500` |
| Otro | `bg-slate-400` |

**TaskTimeline:**

No es una tabla; es una lista vertical tipo bitacora. Cada item:

```
<SectionTitle>Bitacora de trabajo</SectionTitle>
<div class="flex flex-col">
  {tasks_sorted_by_date_desc.map(task => (
    <TaskLogItem task={task} member={memberById.get(task.member_id)} />
  ))}
</div>
```

`TaskLogItem` estructura:
```
<div class="flex gap-4 py-4 border-b border-[--color-border-soft] last:border-b-0 group">

  <!-- Linea de tiempo lateral -->
  <div class="flex flex-col items-center gap-1 pt-0.5 shrink-0">
    <StatusDot status={task.status} />   -- circulo de 8px con color segun status
    <div class="w-px flex-1 bg-[--color-border-soft] group-last:hidden" />
  </div>

  <!-- Contenido -->
  <div class="flex-1 min-w-0 pb-2">
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm font-semibold text-[--color-text-primary] leading-snug">{task.title}</p>
      <Badge variant="status" value={task.status} size="xs" />
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2">
      <Badge variant="category" value={task.category} size="xs" />
      {task.member_id && (
        <span class="flex items-center gap-1.5 text-xs text-[--color-text-muted]">
          <Avatar name={member.name} color={member.color} size={16} />
          {member.name}
        </span>
      )}
      {task.hours != null && (
        <span class="flex items-center gap-1 text-xs font-medium tabular-nums text-[--color-text-secondary]">
          <Clock class="w-3 h-3" />
          {task.hours} h
        </span>
      )}
      <span class="text-xs text-[--color-text-muted] ml-auto">{formatted_date}</span>
    </div>
  </div>

</div>
```

`StatusDot`:
- `pendiente`: `w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-100`
- `en_proceso`: `w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-100`
- `hecho`: `w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100`

Empty state (sin tareas): `EmptyState` icon=`ClipboardList`, "Sin tareas registradas", body "Cuando agregues tareas para este cliente apareceran aqui."

---

### 4.4 Reportes (`/reportes`)

**Layout:**
```
<PageHeader title="Reportes" />
<DateRangeBar />   -- fila con los date inputs + chip de conteo
<div class="grid grid-cols-3 gap-5">
  <ReportPanel title="Por cliente"   rows={...} />
  <ReportPanel title="Por categoria" rows={...} />
  <ReportPanel title="Por persona"   rows={...} />
</div>
```

**DateRangeBar:**

Los inputs de fecha se agrupan en una `Card variant="flat" padding="sm"` horizontal:
```
<div class="flex items-center gap-4 bg-white rounded-[--radius-lg] border border-[--color-border] px-5 py-3 shadow-xs mb-6">
  <CalendarDays class="w-4 h-4 text-[--color-text-muted] shrink-0" />
  <label>
    <span class="text-[11px] font-semibold uppercase tracking-wide text-[--color-text-muted]">Desde</span>
    <input type="date" class="block mt-0.5 text-sm font-medium text-[--color-text-primary] bg-transparent border-none outline-none cursor-pointer" />
  </label>
  <div class="w-px h-6 bg-[--color-border]" />
  <label>
    <span class="text-[11px] font-semibold uppercase tracking-wide text-[--color-text-muted]">Hasta</span>
    <input type="date" class="block mt-0.5 text-sm font-medium text-[--color-text-primary] bg-transparent border-none outline-none cursor-pointer" />
  </label>
  <div class="ml-auto">
    <span class="text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-full px-3 py-1">
      {n} tareas
    </span>
  </div>
</div>
```

**ReportPanel - estructura por panel:**

```
<Card variant="default" padding="none">
  <!-- Encabezado del panel -->
  <div class="px-5 py-4 border-b border-[--color-border-soft]">
    <h2 class="text-xs font-bold uppercase tracking-widest text-[--color-text-muted]">{title}</h2>
  </div>
  <!-- Filas -->
  <div class="divide-y divide-[--color-border-soft]">
    {rows.map(r => (
      <div class="px-5 py-3 flex items-center gap-3 hover:bg-[--color-surface-2] transition-colors duration-[--duration-fast]">
        <span class="flex-1 text-sm font-medium text-[--color-text-primary] truncate">{label}</span>
        <!-- Mini barra de relleno proporcional al max de horas en el grupo -->
        <div class="w-20 h-1 bg-[--color-surface-2] rounded-full overflow-hidden">
          <div class="h-full bg-indigo-400 rounded-full" style="width:{pct}%" />
        </div>
        <span class="text-xs tabular-nums font-bold text-[--color-text-secondary] w-10 text-right">{r.hours}h</span>
        <span class="text-xs text-[--color-text-muted] w-6 text-right">{r.taskCount}</span>
      </div>
    ))}
    {rows.length === 0 && <EmptyState icon={BarChart2} title="Sin datos en este rango" />}
  </div>
  <!-- Footer total -->
  {rows.length > 0 && (
    <div class="px-5 py-3 border-t border-[--color-border] bg-slate-50/60 flex justify-between">
      <span class="text-xs font-bold text-[--color-text-secondary]">Total</span>
      <span class="text-xs font-bold tabular-nums text-[--color-text-primary]">{totalHours} h</span>
    </div>
  )}
</Card>
```

---

### 4.5 Portal del cliente (`/portal/[token]`)

El portal no tiene sidebar (es publico/externo). Tiene su propio layout minimalista.

**Shell del portal:**

```
<div class="min-h-screen bg-[--color-surface]">
  <!-- Header de marca del portal -->
  <header class="border-b border-[--color-border] bg-white px-6 py-4">
    <div class="max-w-xl mx-auto flex items-center gap-2.5">
      <div class="w-6 h-6 rounded-[--radius-sm] bg-indigo-600 flex items-center justify-center">
        <Command class="w-3.5 h-3.5 text-white" />
      </div>
      <span class="text-sm font-semibold text-[--color-text-secondary]">Portal de cliente</span>
    </div>
  </header>
  <!-- Contenido -->
  <main class="max-w-xl mx-auto px-4 py-8 animate-slide-up-fade">
    ...
  </main>
</div>
```

**PageHeader del portal:**

```
<div class="mb-6">
  <h1 class="text-2xl font-bold tracking-tight text-[--color-text-primary]">Solicitudes</h1>
  <p class="mt-1 text-sm text-[--color-text-secondary]">{client.name}</p>
</div>
```

**Formulario de nueva solicitud:**

```
<Card variant="default" padding="md">
  <SectionTitle>Nueva solicitud</SectionTitle>
  <div class="flex flex-col gap-4 mt-3">
    <div>
      <label class="text-xs font-semibold text-[--color-text-secondary] block mb-1.5">
        ¿Que necesitas?
      </label>
      <input
        class="w-full h-10 rounded-[--radius-md] border border-[--color-border] bg-white px-3 text-sm
               placeholder:text-[--color-text-disabled]
               focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
               transition-colors duration-[--duration-fast]"
        placeholder="Ej: Necesito una landing para la promo de junio"
      />
    </div>
    <div>
      <label class="text-xs font-semibold text-[--color-text-secondary] block mb-1.5">
        Detalles <span class="font-normal text-[--color-text-muted]">(opcional)</span>
      </label>
      <textarea
        rows={4}
        class="w-full rounded-[--radius-md] border border-[--color-border] bg-white px-3 py-2.5 text-sm
               placeholder:text-[--color-text-disabled] resize-none
               focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
               transition-colors duration-[--duration-fast]"
        placeholder="Cuentanos mas sobre lo que necesitas"
      />
    </div>
    <Button variant="primary" class="self-start">
      <Send class="w-4 h-4" /> Enviar solicitud
    </Button>
  </div>
</Card>
```

**Lista "Mis solicitudes":**

```
<SectionTitle class="mt-8">Mis solicitudes</SectionTitle>
<Card variant="flat" padding="none">
  {tickets.map(t => (
    <div class="flex items-center justify-between px-5 py-4 border-b border-[--color-border-soft] last:border-b-0">
      <div>
        <p class="text-sm font-medium text-[--color-text-primary]">{t.title}</p>
        <p class="text-xs text-[--color-text-muted] mt-0.5">
          <CalendarDays class="w-3 h-3 inline mr-1" />{formatted_date}
        </p>
      </div>
      <Badge variant="status" value={t.status} size="xs" />
    </div>
  ))}
  {tickets.length === 0 && (
    <EmptyState icon={Inbox} title="Aun no has enviado solicitudes" />
  )}
</Card>
```

**Estado de exito post-envio:** toast/banner suave encima del formulario.
```
<div class="flex items-center gap-2 rounded-[--radius-md] bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 animate-slide-up-fade">
  <CircleCheck class="w-4 h-4 shrink-0" />
  Recibimos tu solicitud. Tu equipo ya la vera.
</div>
```

---

### 4.6 NamePicker ("¿Quien eres?")

Esta pantalla se muestra antes de entrar al dashboard cuando no hay miembro seleccionado.

**Layout (centrado, sin sidebar):**

```
<div class="min-h-screen bg-[--color-surface] flex items-center justify-center px-4">
  <div class="w-full max-w-sm animate-scale-in">
    <!-- Logo / marca -->
    <div class="text-center mb-8">
      <div class="w-12 h-12 rounded-[--radius-xl] bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-card">
        <Command class="w-6 h-6 text-white" />
      </div>
      <h1 class="text-xl font-bold text-[--color-text-primary]">Centro de Comando</h1>
      <p class="mt-1 text-sm text-[--color-text-secondary]">¿Quien eres hoy?</p>
    </div>
    <!-- Grid de miembros -->
    <div class="grid grid-cols-2 gap-3">
      {members.map(m => (
        <button
          key={m.id}
          onClick={() => selectMember(m.id)}
          class="flex flex-col items-center gap-2.5 rounded-[--radius-xl] border border-[--color-border] bg-white
                 p-5 text-center shadow-xs transition-all duration-[--duration-normal]
                 hover:border-indigo-300 hover:shadow-card hover:-translate-y-0.5
                 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none
                 cursor-pointer"
        >
          <Avatar name={m.name} color={m.color} size={44} />
          <span class="text-sm font-semibold text-[--color-text-primary]">{m.name}</span>
        </button>
      ))}
    </div>
  </div>
</div>
```

---

## 5. Mapa de iconos lucide-react

Todos los iconos usan `lucide-react`. Tamano por defecto: `w-4 h-4` salvo que se indique otra cosa.

| Lugar de uso | Icono lucide | Notas |
|---|---|---|
| Logotipo / marca sidebar | `Command` | w-4 h-4 blanco sobre fondo indigo-600 |
| Logotipo portal | `Command` | w-3.5 h-3.5 |
| Nav: Tablero | `LayoutDashboard` | |
| Nav: Clientes | `Users` | |
| Nav: Reportes | `BarChart2` | |
| Nav: member switcher | `ChevronsUpDown` | w-3.5 h-3.5, muted |
| PageHeader: volver | `ChevronLeft` | w-3.5 h-3.5 |
| Boton: nueva tarea | `Plus` | |
| Boton: agregar cliente | `Plus` | |
| Boton: copiar link portal | `Link2` | |
| Boton: enviar solicitud | `Send` | |
| StatCard: total tareas | `ClipboardList` | |
| StatCard: en proceso | `Loader2` | |
| StatCard: pendientes | `Clock` | |
| StatCard: horas | `Timer` | |
| StatCard: tareas hechas | `CircleCheck` | |
| Columna kanban pendiente | `Circle` | w-3.5 h-3.5 amber-700 |
| Columna kanban en proceso | `CircleDot` | w-3.5 h-3.5 sky-700 |
| Columna kanban hecho | `CircleCheck` | w-3.5 h-3.5 emerald-700 |
| Horas en TaskCard | `Clock` | w-3 h-3 |
| Badge: solicitud de cliente | `Ticket` | w-3 h-3 |
| Fila de cliente: ir al detalle | `ChevronRight` | solo en hover, muted |
| Empty state: tablero | `Inbox` | w-6 h-6 |
| Empty state: clientes | `Users` | w-6 h-6 |
| Empty state: tareas del cliente | `ClipboardList` | w-6 h-6 |
| Empty state: reportes | `BarChart2` | w-6 h-6 |
| Empty state: solicitudes portal | `Inbox` | w-6 h-6 |
| Date range en reportes | `CalendarDays` | w-4 h-4 |
| Fecha en solicitudes portal | `CalendarDays` | w-3 h-3 inline |
| Exito envio portal | `CircleCheck` | w-4 h-4 emerald |
| Modal: cerrar | `X` | w-4 h-4 |
| Modal: drag handle | `GripVertical` | w-3.5 h-3.5 muted, cursor-grab |
| Sidebar mobile: abrir | `Menu` | w-5 h-5 |
| Sidebar mobile: cerrar | `X` | w-5 h-5 |

---

## 6. Microinteracciones y motion

Las animaciones existentes (`ccc-fade-in`, `ccc-scale-in`, `ccc-slide-up-fade`) se mantienen. Se agregan:

```css
@keyframes ccc-dot-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
.animate-dot-pulse { animation: ccc-dot-pulse 1.6s ease-in-out infinite; }
```

Uso: el `StatusDot` de "en_proceso" en el timeline del cliente pulsa sutilmente.

**Reglas generales:**
- Todas las transiciones de color/fondo: `duration-[--duration-fast] ease-out`
- Cards hover (translate + shadow): `duration-[--duration-normal] ease-out`
- Modal entrada: `animate-scale-in` (ya existe)
- Paginas nuevas: `animate-slide-up-fade` (ya existe)
- Barras MiniBar: `transition-[width] duration-500 ease-out` para animar al filtrar por fecha.
- Respetar `prefers-reduced-motion` (ya esta en globals.css).

---

## 7. Accesibilidad

- **Contraste texto principal** (`--color-text-primary` #0F172A sobre `--color-canvas` #FFFFFF): ratio ~19:1. AAA.
- **Contraste texto secundario** (`--color-text-secondary` #475569 sobre blanco): ratio ~7.5:1. AAA.
- **Contraste texto muted** (`--color-text-muted` #94A3B8 sobre blanco): ratio ~3.1:1. Solo para texto decorativo no critico (labels de 11px uppercase). Para texto de informacion real usar al menos `--color-text-secondary`.
- **Botones CTA** (blanco sobre indigo-600 #4F46E5): ratio ~5.1:1. AA.
- **Tamano minimo de toque:** 44x44px en mobile. Los NavItems del sidebar tienen `py-2` = 32px de alto mas el padding; en mobile se hace el drawer con items de `py-3`.
- **Focus visible:** todos los elementos interactivos tienen `focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none`. Los `<a>` de Next.js Link tambien reciben la clase via `className`.
- **Iconos decorativos:** `aria-hidden="true"` en todos los iconos que acompanan texto.
- **Iconos solos (IconButton):** `aria-label` obligatorio.
- **Skip link** en el layout del dashboard: primer elemento del DOM, visible solo en focus.
  ```
  <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold">
    Saltar al contenido principal
  </a>
  ```

---

## 8. Globals.css completo con tokens

El bloque `@theme` de la seccion 1 va al inicio del archivo, justo despues de `@import "tailwindcss"`. El resto del archivo existente (keyframes, clases utilitarias de sombra, reduced-motion) se mantiene sin cambios debajo del bloque `@theme`.

Se agregan al final del archivo las siguientes utilities que Tailwind v4 no genera automaticamente para valores de `@theme`:

```css
/* Sidebar layout */
.sidebar-w { width: var(--sidebar-w); }

/* Sombras utilitarias (reemplazan las existentes con los nuevos valores) */
.shadow-card {
  box-shadow: var(--shadow-card);
}
.shadow-card-hover {
  box-shadow: var(--shadow-card-hover);
}
.shadow-modal {
  box-shadow: var(--shadow-modal);
}
```

---

## Notas de implementacion para el dev

1. **`app/(dashboard)/layout.tsx`** necesita cambiar para incluir el `<Sidebar>` como componente a la izquierda. El layout actual no existe o es transparente; se crea uno.
2. **`components/Nav.tsx`** se convierte en `components/Sidebar.tsx` (o se renombra). Los links del array `LINKS` reciben el icono correspondiente de lucide.
3. Los 4 stat cards del Tablero requieren calcular desde el array de `tasks` ya disponible: total, en proceso, pendientes, suma de horas. Esta logica va en `BoardPage` que ya tiene todos los datos.
4. Los stat cards del Detalle de cliente requieren calcular `doneTasks`, `openTasks`, `inProgressTasks` ademas del `totalHours` ya calculado.
5. La `TaskTimeline` en detalle de cliente reemplaza la tabla de "Todas las tareas". Las tareas se ordenan por `task_date` descendente.
6. **`MiniBar`** usa `Math.round((value / max) * 100)`. Si `max === 0`, ancho = 0 sin division.
7. La instalacion de `lucide-react` se hace con `npm install lucide-react`. Es una dependencia ligera, tree-shakeable.
8. El avatar de color en la lista de clientes: usar `MEMBER_COLORS[index % MEMBER_COLORS.length]` para asignar un color por posicion, o un hash del `client.id` para que sea estable. La segunda opcion es preferible.
9. El `NamePicker` necesita saber si el array de `members` esta cargado. Mientras carga, muestra un skeleton (3 rectangulos con `animate-pulse bg-slate-100 rounded-[--radius-xl] h-24`).
10. La fecha en la `TaskTimeline` se formatea a espanol legible: `new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(t.task_date))` produce "4 jun".
