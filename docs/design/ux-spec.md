# Centro de Comando de Clientes: Especificacion de UX

**Version:** 1.0  
**Fecha:** 2026-06-23  
**Rol:** UX Designer  
**Destinatario:** Desarrollador Next.js

---

## 0. Contexto y problema de diseno

La herramienta existe para que un equipo de agencia registre todo lo que se le hace a cada cliente (tareas, horas, categorias, responsables) y lo tenga visible en un solo lugar. El dueno dice que se ve "feo y basico". El diagnostico tecnico es preciso: la estructura de datos ya soporta todo lo necesario, pero la jerarquia visual no refleja la importancia de cada elemento.

**Problema central:** El detalle de cliente, que es la pantalla de mayor valor informativo (la bitacora), se muestra como una tabla plana sin peso visual. No hay contexto inmediato sobre el estado del cliente ni sobre que tipo de trabajo se ha hecho. Las KPIs del home no existen, por lo que el Tablero arranca sin contexto del mes.

**Principio rector:** Cada pixel de espacio debe responder a "¿que necesita saber el usuario ahora mismo?". Para el equipo interno, la respuesta mas frecuente es: (a) que tareas tiene pendientes hoy, (b) cuanto trabajo se le ha hecho a X cliente, (c) cuantas horas lleva el equipo este mes.

---

## 1. Arquitectura de Informacion y Navegacion

### 1.1 Shell actual vs. shell propuesto

**Estado actual:** Barra de navegacion horizontal en la parte superior con logo + tabs (Tablero, Clientes, Reportes) + avatar de miembro a la derecha. No hay sidebar.

**Cambio de IA propuesto:** Convertir de topnav a sidebar izquierdo. Razon: la barra horizontal mezcla navegacion con identidad del usuario en el mismo nivel jerarquico, y no escala cuando se agregan secciones. El sidebar separa estructura (izquierda, persistente) de contenido (derecha, cambiante), que es el patron dominante en herramientas internas de este tipo.

### 1.2 Sidebar izquierdo: estructura

```
[Logo: Centro de Comando]  <- h1 de la app, 16px bold

Navegacion principal:
  [ ] Tablero          <- icono: layout-grid o kanban
  [ ] Clientes         <- icono: users
  [ ] Reportes         <- icono: bar-chart

---  (separador visual)

Zona inferior:
  [Avatar + Nombre del miembro actual]
  [Cambiar miembro]  <- texto-link, 12px, discret
```

**Ancho del sidebar:** 220 px fijo en desktop. En pantallas < 768 px, colapsado a iconos (64 px) o drawer con hamburguesa si el uso movil es relevante (no confirmado, pendiente de validacion).

**Indicador de pagina activa:** Fondo indigo-50 + borde izquierdo indigo-500 (2 px) en el item activo. No solo cambio de color en el texto, porque ese cambio falla el contraste minimo WCAG 4.5:1 con el texto gris actual.

**Miembro actual (zona inferior):**
- Avatar con inicial y color del miembro.
- Nombre del miembro en 14px.
- Link "Cambiar miembro" en 12px, color slate-500. Al hacer clic dispara el flujo de seleccion (ver seccion 6.4).
- Tooltip al hover: "Sesion de [Nombre]. Clic para cambiar."

### 1.3 Jerarquia de pantallas

```
/              -> Tablero (kanban + KPIs)
/clientes      -> Lista de clientes
/clientes/[id] -> Detalle del cliente (bitacora) **PANTALLA ESTRELLA**
/reportes      -> Reportes por rango de fecha
/portal/[tok]  -> Portal del cliente (externo, fuera del shell)
```

El portal es la unica pantalla que NO usa el sidebar. Es una pantalla publica (acceso por token) y debe verse desconectada del contexto interno del equipo.

---

## 2. KPIs: Definicion exacta y formula de calculo

Todas las metricas derivan de los campos existentes en `Task`: `status`, `hours`, `task_date`, `client_id`, `source`.

### 2.1 Tira de KPIs en el Tablero (home)

Se ubica entre el titulo "Tablero" y el kanban. Cuatro tarjetas en fila horizontal. Cada tarjeta tiene: numero grande (24-28px bold), etiqueta descriptiva (12px, slate-500), e icono SVG a la izquierda.

| # | Metrica | Etiqueta visible | Formula |
|---|---------|-----------------|---------|
| 1 | Clientes activos | Clientes activos | `clients.filter(c => c.status === 'activo').length` |
| 2 | Horas este mes | Horas registradas (mes actual) | `tasks.filter(t => t.task_date starts with YYYY-MM actual && t.hours != null).reduce(sum of t.hours, 0)` |
| 3 | Tareas abiertas | Tareas en curso | `tasks.filter(t => t.status === 'pendiente' || t.status === 'en_proceso').length` |
| 4 | Tareas completadas (mes) | Completadas este mes | `tasks.filter(t => t.status === 'hecho' && t.task_date starts with YYYY-MM actual).length` |

**Calculo del mes actual:** Se compara `task_date.slice(0, 7)` con `new Date().toISOString().slice(0, 7)` (formato `YYYY-MM`). No se requiere zona horaria adicional porque `task_date` ya se almacena como string ISO de 10 caracteres.

**Notas de implementacion:**
- KPI 1 usa la tabla `clients`, las demas usan `tasks`. Los datos ya se cargan juntos en `BoardPage` con `Promise.all`.
- Si `client.status` no esta siendo usado todavia (todos en 'activo' por defecto), el numero mostrara todos los clientes. Documentarlo como estado temporal.
- KPI 2 y KPI 4 filtran por `task_date` del mes, no por `created_at`. Eso refleja cuando se hizo el trabajo, no cuando se registro. Es la metrica correcta para una agencia.

### 2.2 Stat cards en el Detalle de cliente

Se ubican debajo del nombre del cliente, antes de la bitacora. Tres tarjetas compactas.

| # | Metrica | Etiqueta visible | Formula (scope: tareas de este cliente) |
|---|---------|-----------------|---------|
| 1 | Total de horas | Total de horas | `tasks.reduce(sum of t.hours ?? 0, 0)` |
| 2 | Tareas abiertas | Pendiente / En proceso | `tasks.filter(t => t.status !== 'hecho').length` |
| 3 | Tareas completadas | Completadas | `tasks.filter(t => t.status === 'hecho').length` |

Estas reemplazan la linea de texto "13.5 horas en total · 4 tareas" que existe hoy. Esa linea es correcta en contenido pero invisible en jerarquia. Una tarjeta le da peso escaneble.

---

## 3. Estructura de la Pagina de Detalle de Cliente (pantalla estrella)

### 3.1 Orden de secciones de arriba hacia abajo

```
[1] Breadcrumb
[2] Cabecera del cliente
[3] Acciones secundarias
[4] Stat cards (3 metricas)
[5] Desglose por categoria (horas)
[6] Bitacora: todo lo que se le ha hecho (lista de tareas)
```

### 3.2 Especificacion de cada seccion

**[1] Breadcrumb**
- Texto: `< Clientes` (link, 14px, indigo-600)
- Posicion: inmediatamente arriba del nombre.
- Aria: `aria-label="Volver a la lista de clientes"`. No usar solo el simbolo `<`.

**[2] Cabecera del cliente**
- `h1` con el nombre del cliente. 28-32px, bold.
- Indicador de estado: badge pequeno (8px dot + texto) a la derecha del nombre o debajo. Valores: "Activo" (dot verde) / "Inactivo" (dot gris). El campo `client.status` ya existe.

**[3] Acciones secundarias**
- Boton "Copiar link del portal" (ya existe). Mantener a la derecha.
- Boton "+ Nueva tarea" para este cliente (nuevo en esta pantalla). Al abrirse el TaskModal, pre-seleccionar el cliente actual en el campo `client_id`. Razon: el usuario ya esta en el contexto de un cliente, obligarlo a volver a elegirlo es friccion innecesaria.

**[4] Stat cards**
- Tres tarjetas en fila. Contenido descrito en seccion 2.2.
- Layout: `grid-cols-3` en desktop, `grid-cols-1` en mobile.
- Cada tarjeta: borde delgado, fondo blanco, icono + numero + etiqueta.

**[5] Desglose por categoria**
- Titulo de seccion: "Horas por servicio" (mas claro que "por categoria" para quien lee la bitacora).
- Tabla horizontal compacta: Categoria | Tareas | Horas. La columna "Tareas" es nueva y util: muestra la frecuencia, no solo el tiempo. Formula: `tasks.filter(t => t.category === cat).length`.
- Ordenado por horas descendente, para que lo que mas tiempo tomo aparezca primero.
- Excluir categorias con 0 tareas (no mostrarlas). La tabla actual muestra "0 h" para categorias sin trabajo, generando ruido.

**[6] Bitacora: todo lo que se le ha hecho**

Esta es la seccion principal y el motivo de existencia de la pantalla.

- Titulo de seccion: "Historial de trabajo"
- Subtitulo opcional: "Todo lo que se le ha hecho a este cliente, de mas reciente a mas antiguo."
- Ordenado por `task_date` descendente (mas reciente primero). Rationale: el usuario quiere saber "que se hizo ultimamente", no lo primero que se hizo.

**Estructura de cada fila de tarea:**

```
[Badge de estado]  [Titulo de la tarea]           [Badge de categoria]
[Fecha formateada] [Responsable con avatar]  [Horas: X h]  [Icono de origen]
```

Columnas en la tabla:

| Columna | Contenido | Notas |
|---------|-----------|-------|
| Tarea | Titulo en texto bold | Clic abre TaskModal en modo edicion |
| Categoria | CategoryBadge (ya existe) | |
| Estado | Badge de color: Pendiente (ambar), En proceso (azul), Hecho (verde) | Reemplaza texto plano actual |
| Origen | Icono + texto: "Equipo" o "Solicitado por cliente" | Distingue `source === 'equipo'` de `source === 'cliente'`. Este dato ya existe y hoy NO se muestra en esta pantalla. |
| Responsable | Avatar + nombre. Si `member_id` es null: "Sin asignar" (no guion) | |
| Horas | Numero + " h". Si null: "Sin registrar" (no guion) | |
| Fecha | Formato legible: "4 jun 2026". No el ISO crudo `2026-06-04`. | Usar `toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })` |

**Distincion visual de origen (source):**
- Tareas `source === 'cliente'` muestran un badge discreto "Solicitud del cliente" en indigo-50/indigo-700.
- Tareas `source === 'equipo'` no muestran badge (son la mayoria; el default no necesita marca).
- Razon: el dueno quiere saber que fue proactivo del equipo vs. que pidio el cliente. Este campo ya existe en el modelo.

**Agrupacion temporal (mejora de escaneo):**
- Opcional y de bajo riesgo: agrupar las filas por mes con un separador visual (linea + "Junio 2026", "Mayo 2026"). Razon: una bitacora larga sin separadores se lee como una lista interminable.
- Implementacion: pre-procesar las tareas ordenadas y agregar un encabezado de grupo cuando cambia `task_date.slice(0, 7)`.

---

## 4. Estados por pantalla: microcopy exacto

### 4.1 Pantalla de seleccion de miembro (NamePicker)

| Estado | Microcopy | Notas |
|--------|-----------|-------|
| Loading inicial | "Preparando el equipo..." (reemplazar "Cargando..." actual) | Skeleton de 3 botones rectangulares |
| Sin miembros registrados | "Todavia no hay nadie en el equipo. Agrega tu nombre abajo para empezar." | |
| Error al agregar | "No pudimos agregar tu nombre. Revisa tu conexion e intenta de nuevo." | |
| CTA para agregar | Placeholder del input: "Tu nombre" (ya existe, correcto) | Boton: "Unirme al equipo" (mas claro que "Agregar") |

### 4.2 Tablero

| Estado | Microcopy | Notas |
|--------|-----------|-------|
| Loading | Skeleton de 3 columnas kanban (3 tarjetas fantasma por columna) | Reemplazar `<p>Cargando tablero...</p>` |
| Error de carga | "No pudimos cargar el tablero. Verifica tu conexion." + boton "Reintentar" | |
| Error al mover tarea | "No se pudo mover la tarea. Cambio revertido." (toast de 4 s, rojo discreto) | Ya existe pero como `<p>` inline. Moverlo a toast |
| Columna vacia (Pendiente) | "Sin tareas pendientes. Buen trabajo." | Solo se muestra si la columna activamente tiene 0 items tras filtrar |
| Columna vacia (En proceso) | "Nada en proceso en este momento." | |
| Columna vacia (Hecho) | "Aun no se han completado tareas." | |
| KPI: sin tareas este mes | Los numeros muestran "0". No mostrar mensaje de vacio adicional. | |

**KPIs en estado de carga:** Cuatro rectangulos placeholder (skeleton) de 80 x 60 px en fila mientras carga.

### 4.3 Lista de clientes

| Estado | Microcopy | Notas |
|--------|-----------|-------|
| Loading | Skeleton de tabla (3 filas fantasma) | Reemplazar `<p>Cargando clientes...</p>` |
| Sin clientes | Icono users + "Todavia no hay clientes. Agrega el primero." + boton "+ Agregar cliente" | El boton debe hacer focus en el input, no abrir modal |
| Error de carga | "No pudimos cargar los clientes. Intenta recargar la pagina." | |
| Error al agregar | "No se pudo agregar el cliente. Intenta de nuevo." (ya existe, correcto) | |
| Exito al agregar | No se requiere toast. La fila aparece en la tabla. Eso es feedback suficiente. | |
| Input vacio al agregar | El boton "+ Agregar cliente" debe estar deshabilitado si el input esta vacio. Actualmente no lo esta (el handler si valida, pero el boton no refleja el estado). | Riesgo de usabilidad |

**Placeholder del input:** "Nombre del cliente" (ya existe, correcto).

### 4.4 Detalle de cliente

| Estado | Microcopy | Notas |
|--------|-----------|-------|
| Loading | Skeleton: rect de 200 px para nombre, 3 stat cards fantasma, tabla fantasma de 4 filas | Reemplazar `<p>Cargando...</p>` |
| Cliente no encontrado | Icono de advertencia + "No encontramos este cliente." + link "Volver a clientes" | Reemplazar `<p>Cliente no encontrado.</p>` |
| Sin tareas (nuevo cliente) | Icono de checklist vacio + "Todavia no hay tareas para este cliente." + boton "+ Nueva tarea" (pre-selecciona este cliente) | La tabla muestra esto en colSpan. Mejor reemplazarlo con un estado de vacio mas visual |
| Portal link copiado | "Enlace copiado" (ya existe como "!Copiado!" -- correcto, mantener) | |

### 4.5 Reportes

| Estado | Microcopy | Notas |
|--------|-----------|-------|
| Loading | Skeleton: 3 tarjetas de tabla fantasma | Reemplazar `<p>Cargando reportes...</p>` |
| Sin tareas en el rango | Dentro de cada tabla: "Sin actividad en este periodo." | Reemplazar "Sin datos." actual |
| Rango invalido (desde > hasta) | Mensaje inline entre los date pickers: "La fecha de inicio debe ser anterior a la fecha final." | Riesgo de usabilidad: actualmente no se valida |
| Contador de tareas | "11 tareas en el rango" -> mejorar a "11 tareas del [fecha] al [fecha]" para que sea mas informativo | |

### 4.6 Portal del cliente

| Estado | Microcopy | Notas |
|--------|-----------|-------|
| Loading | "Verificando tu enlace..." (reemplazar "Cargando...") | |
| Token invalido | "Este enlace no es valido." + "Si crees que hay un error, contacta a tu equipo." (mejorado sobre "Verifica con tu equipo") | |
| Enviando solicitud | Boton: "Enviando..." (ya existe, correcto). Deshabilitar boton durante envio. | Ya funciona |
| Exito al enviar | "Recibimos tu solicitud. Tu equipo la vera pronto." (mejorado sobre "!Recibimos tu solicitud! Tu equipo ya la vera.") | El punto de exclamacion de apertura es innecesario en este contexto; tono mas calmado |
| Error al enviar | "No pudimos enviar tu solicitud. Revisa tu conexion e intenta de nuevo." | |
| Sin solicitudes previas | "Aqui apareceran tus solicitudes una vez que las envies." (mejorado sobre "Aun no has enviado solicitudes.") | Explica para que sirve la seccion |
| Solicitud en estado Pendiente | Badge: "Recibida" (mas claro para el cliente que "Pendiente") | Solo en el portal del cliente. El equipo interno sigue viendo "Pendiente" |
| Solicitud en estado En proceso | Badge: "En proceso" (correcto, mantener) | |
| Solicitud en estado Hecho | Badge: "Completada" (mas claro que "Hecho" para el cliente) | |

---

## 5. Microcopy completo: titulos, labels, botones, tooltips

### 5.1 Navegacion (sidebar)

| Elemento | Texto | Notas |
|----------|-------|-------|
| Logo / nombre app | "Centro de Comando" | Sin subtitulo |
| Item nav 1 | "Tablero" | |
| Item nav 2 | "Clientes" | |
| Item nav 3 | "Reportes" | |
| Tooltip miembro actual | "Sesion de [Nombre]" | |
| Link cambiar miembro | "Cambiar miembro" | 12px, discret |
| Tooltip cambiar | "Hacer clic para elegir otro miembro del equipo" | |

### 5.2 Tablero

| Elemento | Texto | Notas |
|----------|-------|-------|
| Titulo pagina | "Tablero" | |
| KPI 1 label | "Clientes activos" | |
| KPI 2 label | "Horas este mes" | |
| KPI 3 label | "Tareas en curso" | |
| KPI 4 label | "Completadas este mes" | |
| Filtro cliente | "Todos los clientes" (default) | |
| Filtro miembro | "Todo el equipo" (default) | |
| CTA nuevo | "+ Nueva tarea" | |
| Columna 1 | "Pendiente" | |
| Columna 2 | "En proceso" | |
| Columna 3 | "Hecho" | |
| Tooltip tarjeta | "Clic para editar" (al hover sobre tarjeta) | |
| Tooltip badge cliente en tarjeta | "Solicitud del cliente" (cuando source === 'cliente') | |
| Badge origen tarjeta | "Cliente" (mantener el badge actual) | |

### 5.3 Modal de tarea

| Elemento | Texto actual | Texto propuesto | Razon |
|----------|-------------|-----------------|-------|
| Titulo crear | "Nueva tarea" | "Nueva tarea" (correcto) | |
| Titulo editar | "Editar tarea" | "Editar tarea" (correcto) | |
| Label cliente | "Cliente" | "Cliente" (correcto) | |
| Placeholder cliente | "-- Elige --" | "Selecciona un cliente" | Mas descriptivo |
| Label titulo | "Titulo" | "Titulo de la tarea" | Mas especifico |
| Placeholder titulo | (vacio) | "Ej: Diseno de flyer para junio" | Reduce friccion |
| Label descripcion | "Descripcion" | "Descripcion (opcional)" | Reduce ansiedad |
| Label categoria | "Categoria" | "Tipo de servicio" | Mas claro para el contexto |
| Label responsable | "Responsable" | "Responsable" (correcto) | |
| Placeholder responsable | "-- Elige --" | "Selecciona un miembro" | |
| Label estado | "Estado" | "Estado" (correcto) | |
| Label horas | "Horas" | "Horas trabajadas" | Mas preciso |
| Placeholder horas | (vacio) | "Ej: 2.5" | |
| Label fecha | "Fecha" | "Fecha del trabajo" | Distingue de fecha de creacion |
| Boton cancelar | "Cancelar" | "Cancelar" (correcto) | |
| Boton guardar | "Guardar" | "Guardar tarea" | Mas especifico |
| Boton guardando | "Guardando..." | "Guardando..." (correcto) | |
| Error guardar | "No se pudo guardar. Intenta de nuevo." | Correcto. Agregar: "+ Si el error persiste, recarga la pagina." | |

### 5.4 Prompt de horas (HoursPrompt)

| Elemento | Texto actual | Texto propuesto | Razon |
|----------|-------------|-----------------|-------|
| Titulo | "Cuantas horas tomo?" | "Cuantas horas tomo esta tarea?" | Mas claro |
| Descripcion | Nombre de la tarea | Mantener | |
| Placeholder input | "Ej: 1.5" | "Ej: 2.5" | 2.5 es mas representativo |
| Boton confirmar | "Guardar" | "Confirmar y mover" | Describe la accion completa |
| Boton cancelar | "Cancelar" | "Cancelar" (correcto) | |
| Nota de ayuda | (no existe) | "Puedes dejar en 0 si no aplica." | Reduce confusion cuando el campo queda vacio |

### 5.5 Lista de clientes

| Elemento | Texto | Notas |
|----------|-------|-------|
| Titulo pagina | "Clientes" | |
| Placeholder input | "Nombre del cliente" | |
| Boton agregar | "+ Agregar cliente" | |
| Columna 1 | "Cliente" | |
| Columna 2 | "Horas totales" | |
| Columna 3 | "Abiertas" -> "En curso" | Mas claro: "En curso" engloba pendiente + en_proceso |
| Columna 4 | "Hechas" -> "Completadas" | Tono mas formal |

### 5.6 Detalle de cliente

| Elemento | Texto | Notas |
|----------|-------|-------|
| Breadcrumb | "< Clientes" | |
| Badge activo | "Activo" (dot verde) | |
| Badge inactivo | "Inactivo" (dot gris) | |
| Boton portal | "Copiar enlace del portal" | Mas descriptivo que "Copiar link del portal" |
| Boton portal copiado | "Enlace copiado" | |
| Boton nueva tarea | "+ Nueva tarea" | |
| Stat 1 label | "Total de horas" | |
| Stat 2 label | "Tareas en curso" | |
| Stat 3 label | "Completadas" | |
| Titulo seccion categoria | "Horas por servicio" | |
| Col categoria | "Servicio" | |
| Col tareas | "Tareas" | |
| Col horas | "Horas" | |
| Titulo seccion bitacora | "Historial de trabajo" | |
| Col tarea | "Tarea" | |
| Col categoria | "Servicio" | |
| Col estado | "Estado" | |
| Col origen | "Origen" | |
| Col responsable | "Responsable" | |
| Col horas | "Horas" | |
| Col fecha | "Fecha" | |
| Badge origen cliente | "Solicitud del cliente" | |
| Sin responsable | "Sin asignar" (reemplazar "--") | |
| Sin horas | "Sin registrar" (reemplazar "--") | |

### 5.7 Reportes

| Elemento | Texto actual | Texto propuesto |
|----------|-------------|-----------------|
| Titulo pagina | "Reportes" | "Reportes" (correcto) |
| Label desde | "Desde" | "Desde" (correcto) |
| Label hasta | "Hasta" | "Hasta" (correcto) |
| Contador tareas | "11 tareas en el rango" | "11 tareas del 01 jun al 23 jun" |
| Error rango invalido | (no existe) | "La fecha de inicio no puede ser posterior a la fecha final." |
| Titulo tabla 1 | "Por cliente" | "Por cliente" (correcto) |
| Titulo tabla 2 | "Por categoria" | "Por servicio" |
| Titulo tabla 3 | "Por persona" | "Por miembro del equipo" |
| Col nombre | "Nombre" | "Nombre" (correcto) |
| Col tareas | "Tareas" | "Tareas" (correcto) |
| Col horas | "Horas" | "Horas" (correcto) |
| Vacio | "Sin datos." | "Sin actividad en este periodo." |
| Fila sin responsable | "sin-responsable" (id crudo) | "Sin asignar" |

---

## 6. Flujos paso a paso

### 6.1 Crear una tarea nueva

1. Usuario hace clic en "+ Nueva tarea" en el Tablero o en el Detalle de cliente.
2. Se abre el TaskModal centrado sobre la pantalla con overlay oscuro (ya existe).
3. Si el modal se abrio desde el Detalle de cliente: el campo Cliente viene pre-seleccionado con ese cliente. El foco inicial cae en el campo "Titulo de la tarea".
4. Si el modal se abrio desde el Tablero: el campo Cliente viene vacio. El foco inicial cae en el campo Cliente.
5. Usuario completa los campos obligatorios: Cliente, Titulo, Tipo de servicio, Responsable. Los campos opcionales: Descripcion, Horas, Fecha (defaultea a hoy).
6. Al hacer clic en "Guardar tarea":
   - Si hay errores de validacion: los mensajes aparecen bajo cada campo con error. El foco salta al primer campo con error.
   - Si no hay errores: el boton muestra "Guardando..." y se deshabilita.
   - Exito: el modal se cierra. En el Tablero, la tarjeta aparece en la columna correspondiente al estado elegido (sin reload). En el Detalle de cliente, la fila aparece al inicio de la bitacora.
   - Error de red: el boton vuelve a "Guardar tarea". Aparece el mensaje de error bajo los botones. El modal permanece abierto.
7. Tecla Escape cierra el modal (equivalente a "Cancelar"). No se guarda nada.
8. Clic fuera del modal cierra el modal (mismo efecto). Riesgo: el usuario puede perder datos accidentalmente. Mejora de bajo riesgo: agregar `onMouseDown` que detecte si hay datos ingresados y muestre un confirm nativo antes de cerrar.

**Riesgo de usabilidad identificado:** El campo `source` (equipo/cliente) no aparece en el TaskModal. Las tareas creadas por el equipo siempre tendrian `source === 'equipo'` por defecto, y las del portal tendrian `source === 'cliente'`. Esto es correcto segun la logica de negocio. No se necesita un campo extra en el modal. Solo confirmar que el valor se asigna en la funcion `addTask`.

### 6.2 Mover una tarea en el Tablero (con o sin prompt de horas)

1. Usuario arrastra una tarjeta de una columna a otra.
2. El sistema evalua si la tarea necesita prompt de horas con `needsHoursPrompt(task, status)`:
   - Si el destino es "Hecho" y la tarea no tiene horas registradas: se abre el HoursPrompt.
   - En cualquier otro caso: el movimiento se aplica inmediatamente.
3. Con HoursPrompt abierto:
   - El foco cae en el input de horas automaticamente (ya existe `autoFocus`).
   - Usuario ingresa horas (o deja en blanco/0 si no aplica).
   - Usuario hace clic en "Confirmar y mover".
   - El sistema mueve la tarea a "Hecho" y registra las horas.
   - Si el usuario hace clic en "Cancelar": la tarea regresa a su columna original. No se pierde nada.
4. Si falla el guardado en la DB: la tarea regresa visualmente a su posicion original y aparece un toast de error (4 s): "No se pudo mover la tarea. Cambio revertido."

**Riesgo identificado:** Si el usuario ingresa "0" en el HoursPrompt, se guarda `hours: 0`. Eso es tecnicamente valido pero puede confundir (una tarea de 0 horas aparecera en los reportes como sin horas efectivas). Mejora: mostrar la nota "Puedes dejar en 0 si no aplica." y tratar `0` como `null` en el guardado. Pendiente de decision del dueno.

### 6.3 Agregar un cliente

1. Usuario esta en /clientes.
2. Escribe el nombre en el input "Nombre del cliente".
3. El boton "+ Agregar cliente" se habilita cuando hay al menos 1 caracter (no solo espacios).
4. Usuario hace clic en "+ Agregar cliente" o presiona Enter.
5. El boton muestra "Agregando..." y se deshabilita.
6. Exito: el input se limpia, el nuevo cliente aparece en la tabla ordenado alfabeticamente. No se requiere recarga.
7. Error: aparece el mensaje "No se pudo agregar el cliente." bajo el input. El input mantiene el texto para que el usuario pueda reintentar.

**Mejora de bajo riesgo:** Agregar `onKeyDown` en el input para que Enter dispare `handleAdd`. Reduce friccion.

### 6.4 Cambiar de miembro (sesion)

1. Usuario hace clic en "Cambiar miembro" en la zona inferior del sidebar.
2. El sistema llama a `clear()` que borra el memberId de localStorage.
3. La pantalla muestra el NamePicker (overlay o reemplazo de contenido).
4. El usuario hace clic en su nombre en la lista o agrega uno nuevo.
5. El sistema guarda el nuevo memberId en localStorage.
6. El NamePicker desaparece y el usuario ve el Tablero con el nuevo miembro activo.

**Mejora de usabilidad:** El NamePicker actual no indica cual era el miembro anterior. Agregar una linea discreta: "Antes: [Nombre anterior]." ayuda a confirmar que el cambio fue intencional.

### 6.5 Flujo del portal del cliente (enviar solicitud)

1. El cliente recibe el enlace `/portal/[token]` copiado por el equipo desde el Detalle de cliente.
2. Abre el enlace en su navegador. No necesita cuenta ni contrasena.
3. Ve la pantalla "Solicitudes" con su nombre y el formulario "Nueva solicitud".
4. Escribe su solicitud en "Que necesitas?" (campo obligatorio) y opcionalmente en "Detalles".
5. El boton "Enviar solicitud" esta deshabilitado si el campo principal esta vacio (ya funciona).
6. Al hacer clic en "Enviar solicitud": el boton muestra "Enviando..." y se deshabilita.
7. Exito: el formulario se limpia. Aparece el mensaje: "Recibimos tu solicitud. Tu equipo la vera pronto." La solicitud aparece inmediatamente en la seccion "Mis solicitudes" con estado "Recibida".
8. Error: aparece el mensaje de error bajo el boton. El formulario mantiene el contenido.
9. En la seccion "Mis solicitudes": el cliente ve sus solicitudes con fecha legible (no ISO) y badge de estado ("Recibida", "En proceso", "Completada").

**Riesgo de usabilidad:** El cliente no tiene forma de actualizar ni cancelar una solicitud ya enviada. Si esto es un requerimiento futuro, es scope nuevo. Por ahora el flujo es de solo escritura. Documentarlo como limitacion conocida.

**Riesgo de acceso:** El token esta en la URL. Cualquiera con el enlace puede enviar solicitudes en nombre de ese cliente. Para una herramienta interna pequena, esto es aceptable. Si el dueno necesita mas control, se puede agregar un campo de nombre en el formulario del portal.

---

## 7. Riesgos de usabilidad y como validarlos

| # | Riesgo | Impacto | Como validar |
|---|--------|---------|-------------|
| 1 | El sidebar izquierdo es un cambio de patron. El equipo (pocos usuarios, internos) puede desorientarse inicialmente. | Bajo (son usuarios expertos del producto) | Mostrar la nueva version en una sesion de 15 min con 1-2 miembros del equipo. Medir si encuentran las 3 secciones en menos de 30 s. |
| 2 | La tira de KPIs en el Tablero consume espacio vertical y puede empujar el kanban fuera del viewport en laptops pequenas. | Medio | Verificar en viewport de 1024 x 768. Si las 3 columnas del kanban no son visibles sin scroll, reducir la altura de las KPI cards a 56 px o mover los KPIs a un panel lateral. |
| 3 | La agrupacion por mes en la bitacora puede confundir si hay tareas sin fecha o con fechas inconsistentes. | Bajo | Revisar los datos reales: si todas las tareas tienen `task_date` valido, la agrupacion es segura. |
| 4 | El boton "+ Nueva tarea" en el Detalle de cliente pre-selecciona el cliente, pero el dev puede olvidar pasar `defaultClientId` al TaskModal. | Medio (bug funcional) | Probar el flujo: abrir el modal desde el Detalle, verificar que el cliente este pre-seleccionado y que el campo no sea editable o tenga el cliente correcto. |
| 5 | La columna "Origen" en la bitacora puede generar preguntas del equipo sobre la diferencia entre tareas de equipo y solicitudes del cliente. | Bajo | Agregar tooltip explicativo en el encabezado de la columna: "Indica si la tarea fue iniciada por el equipo o solicitada por el cliente." |
| 6 | El rango de fechas invalido en Reportes (desde > hasta) no se valida actualmente. | Medio (genera datos incorrectos silenciosamente) | Agregar validacion en el handler de cambio de fecha. Mostrar el mensaje de error inline. Tambien deshabilitar el boton de exportacion si el rango es invalido (si se agrega ese feature). |
| 7 | Fecha en formato ISO crudo (2026-06-04) en la bitacora es dificil de leer rapidamente. | Bajo/Medio | Cambio de bajo riesgo: aplicar `toLocaleDateString` en el render. Verificar que el formato "4 jun 2026" sea legible en el contexto de la tabla. |
| 8 | No existe un estado de "cargando" visual (skeleton) para ninguna pantalla. Solo hay un texto pequeno gris. En conexiones lentas, la pantalla en blanco puede parecer un error. | Medio | Implementar skeletons minimos (rectangulos grises animados) para las 4 pantallas principales. Medir el tiempo de carga real de la app en el entorno del equipo para confirmar si esto es un problema real. |

---

## Apendice: datos que no estan disponibles y como validarlos si se necesitan

- **Frecuencia de uso por pantalla:** No hay analytics. Si se quiere priorizar mejoras por impacto, agregar `console.time` o un evento simple de Vercel Analytics por ruta.
- **Tamano de pantalla del equipo:** No se sabe si usan laptops de 13" o monitores de 27". El sidebar de 220 px funciona bien desde 1280 px. Validar con el equipo antes de definir el breakpoint de colapse.
- **Uso del portal por los clientes:** No se sabe si los clientes realmente usan el portal o si es solo para mostrarles. Si no lo usan, la prioridad de esa pantalla baja.
- **Frecuencia de cambio de miembro:** Si cada persona usa siempre el mismo dispositivo, el NamePicker es una barrera de entrada que solo se cruza una vez. Si comparten dispositivos, el cambio de miembro es un flujo frecuente y debe ser mas accesible (quizas un boton mas prominente en el sidebar).
