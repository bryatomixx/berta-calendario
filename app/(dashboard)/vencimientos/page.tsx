import Link from "next/link";
import { SemaforoBadge, SemaforoDot } from "@/components/SemaforoBadge";
import { FechaGrande, fechaCorta, diaSemanaLargo } from "@/components/FechaDisplay";
import { cargarClientes, cargarCalendario } from "@/lib/tributario/clientes";
import { obtenerVencimientosFuturos, estadoSemaforo } from "@/lib/tributario/calendario";
import { generarEnviosSimulados } from "@/lib/tributario/notificaciones";
import type { Cliente, VencimientoCalculado } from "@/lib/tributario/types";

export const dynamic = "force-dynamic";

type Fila = { cliente: Cliente; vencimiento: VencimientoCalculado };

type TipoFiltro =
  | "todos"
  | "renta"
  | "iva"
  | "retefuente"
  | "consumo"
  | "rst";

const TIPOS: Array<{ id: TipoFiltro; label: string; obligaciones: string[] }> = [
  { id: "todos", label: "Todos", obligaciones: [] },
  { id: "renta", label: "Renta", obligaciones: ["renta_juridica", "renta_natural"] },
  { id: "iva", label: "IVA", obligaciones: ["iva_bimestral", "iva_cuatrimestral"] },
  { id: "retefuente", label: "Retefuente", obligaciones: ["retefuente"] },
  { id: "consumo", label: "Consumo", obligaciones: ["consumo"] },
  { id: "rst", label: "RST", obligaciones: ["rst_consolidada", "rst_anticipo"] },
];

function tipoValido(t: string | undefined): TipoFiltro {
  return TIPOS.find((x) => x.id === t)?.id ?? "todos";
}

function aplicarFiltro(filas: Fila[], tipo: TipoFiltro): Fila[] {
  if (tipo === "todos") return filas;
  const ids = TIPOS.find((t) => t.id === tipo)!.obligaciones;
  return filas.filter((f) => ids.includes(f.vencimiento.obligacionId));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const sp = await searchParams;
  const tipoActivo = tipoValido(sp.tipo);

  const [clientes, calendario] = await Promise.all([
    cargarClientes(),
    cargarCalendario(),
  ]);
  const hoy = new Date();

  const filasTodas: Fila[] = clientes.flatMap((c) =>
    obtenerVencimientosFuturos(c, calendario, hoy).map((v) => ({
      cliente: c,
      vencimiento: v,
    }))
  );

  // Conteos por tab (siempre del set completo)
  const conteos = TIPOS.reduce<Record<TipoFiltro, number>>((acc, t) => {
    acc[t.id] = aplicarFiltro(filasTodas, t.id).length;
    return acc;
  }, {} as Record<TipoFiltro, number>);

  // Set filtrado para todo lo demás
  const filas = aplicarFiltro(filasTodas, tipoActivo);

  const ordenadas = [...filas].sort(
    (a, b) => a.vencimiento.diasFaltantes - b.vencimiento.diasFaltantes
  );
  const proxima = ordenadas[0] ?? null;

  const grupos = {
    hoy: filas.filter((f) => f.vencimiento.diasFaltantes === 0),
    semana: filas.filter(
      (f) => f.vencimiento.diasFaltantes >= 1 && f.vencimiento.diasFaltantes <= 5
    ),
    quince: filas.filter(
      (f) => f.vencimiento.diasFaltantes >= 6 && f.vencimiento.diasFaltantes <= 15
    ),
    mes: filas.filter(
      (f) => f.vencimiento.diasFaltantes >= 16 && f.vencimiento.diasFaltantes <= 30
    ),
  };

  const envios = generarEnviosSimulados(clientes, calendario, hoy);

  return (
    <div className="bg-cream text-ink rounded-[var(--radius-xl)] paper-shadow p-6 md:p-8 -mx-1">
      <div className="px-2 md:px-8 py-4 max-w-6xl">
        {/* Encabezado */}
        <header className="mb-10">
          <p className="tracker text-ink-muted mb-3">
            {diaSemanaLargo(hoy)}
          </p>
          <h1 className="font-serif text-5xl md:text-6xl text-ink leading-[0.95] tracking-tight">
            Buenos días,
            <br />
            <span className="serif-italic text-terracotta">Berta.</span>
          </h1>
          <p className="mt-5 text-ink-soft text-base max-w-md leading-relaxed">
            Estos son los vencimientos DIAN que están en tu radar.
            <span className="text-ink-faint"> Hay </span>
            <span className="font-medium text-ink tabular">{filasTodas.length}</span>
            <span className="text-ink-faint"> en total para los próximos meses.</span>
          </p>
        </header>

        {/* Tabs por tipo de obligación */}
        <Tabs activo={tipoActivo} conteos={conteos} />

        {/* Hero: próximo vencimiento (filtrado) */}
        {proxima ? (
          <ProximoHero fila={proxima} />
        ) : (
          <div className="mb-14 rounded-2xl bg-paper paper-shadow p-10 text-center">
            <p className="serif-italic text-2xl text-ink-faint">
              No hay vencimientos de {tipoLabel(tipoActivo).toLowerCase()} en lo que queda del año.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-rule rounded-xl overflow-hidden paper-shadow mb-14">
          <StatCard
            label="Hoy"
            value={grupos.hoy.length}
            tono={grupos.hoy.length > 0 ? "crimson" : "muted"}
          />
          <StatCard
            label="Esta semana"
            value={grupos.semana.length}
            tono={grupos.semana.length > 0 ? "rust" : "muted"}
          />
          <StatCard
            label="Próximos 15d"
            value={grupos.quince.length}
            tono="amber"
          />
          <StatCard
            label="Próximos 30d"
            value={grupos.mes.length}
            tono="sage"
          />
        </div>

        {/* Listas agrupadas */}
        <div className="space-y-12">
          <Seccion
            titulo="Hoy"
            subtitulo="Cero margen — vencen al cierre del día"
            filas={grupos.hoy}
            vacio="Nada vence hoy. Día tranquilo."
          />
          <Seccion
            titulo="Esta semana"
            subtitulo="Entre 1 y 5 días para llamar al cliente"
            filas={grupos.semana}
            vacio="Sin urgencias inmediatas."
          />
          <Seccion
            titulo="Próximos quince días"
            subtitulo="Tiempo para preparar documentos"
            filas={grupos.quince}
            vacio="Nada planificado en este rango."
          />
        </div>

        {/* Envíos simulados (siempre todos, no filtra por tab) */}
        <section className="mt-16 rounded-xl bg-paper paper-shadow overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-rule">
            <div>
              <p className="tracker text-ink-muted mb-1">Modo demo</p>
              <h2 className="font-serif text-2xl text-ink">
                Envíos simulados de hoy
                <span className="serif-italic text-terracotta tabular ml-2">
                  {envios.length}
                </span>
              </h2>
            </div>
            <Link
              href="/api/envios-simulados"
              className="font-mono text-[11px] tracker text-ink-soft hover:text-terracotta transition-colors"
            >
              Ver JSON →
            </Link>
          </div>
          {envios.length === 0 ? (
            <p className="px-6 py-10 text-center text-ink-faint italic">
              Hoy no se enviaría ningún recordatorio.
            </p>
          ) : (
            <ul className="divide-y divide-rule-soft">
              {envios.slice(0, 5).map((e, i) => (
                <li key={i} className="px-6 py-4 flex items-start gap-4">
                  <span className="font-mono text-[10px] text-ink-faint tabular pt-1 w-8">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                        {e.canal === "email" ? "✉ Email" : "✆ WhatsApp"}
                      </span>
                      <span className="text-ink-faint">·</span>
                      <span className="text-xs text-ink-faint tabular">
                        {e.diasFaltantes === 0
                          ? "vence hoy"
                          : `en ${e.diasFaltantes}d`}
                      </span>
                    </div>
                    <p className="text-sm text-ink truncate">
                      <span className="font-medium">{e.clienteNombre}</span>
                      <span className="text-ink-muted"> · {e.obligacionNombre}</span>
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-ink-faint tabular shrink-0">
                    {fechaCorta(new Date(e.fechaVencimiento))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {envios.length > 5 && (
            <p className="px-6 py-3 text-center text-xs text-ink-faint border-t border-rule-soft">
              + {envios.length - 5} envíos más en el endpoint
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function tipoLabel(t: TipoFiltro): string {
  return TIPOS.find((x) => x.id === t)?.label ?? "Todos";
}

function Tabs({
  activo,
  conteos,
}: {
  activo: TipoFiltro;
  conteos: Record<TipoFiltro, number>;
}) {
  return (
    <div className="mb-10 -mx-2 flex items-center gap-1 overflow-x-auto pb-2">
      {TIPOS.map((tab) => {
        const isActive = tab.id === activo;
        const href = tab.id === "todos" ? "/vencimientos" : `/vencimientos?tipo=${tab.id}`;
        return (
          <Link
            key={tab.id}
            href={href}
            className={`shrink-0 inline-flex items-baseline gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
              isActive
                ? "bg-ink text-cream paper-shadow"
                : "text-ink-soft hover:text-ink hover:bg-paper/60"
            }`}
          >
            <span className={isActive ? "font-medium" : ""}>{tab.label}</span>
            <span
              className={`font-mono text-[10px] tabular ${
                isActive ? "text-cream/60" : "text-ink-faint"
              }`}
            >
              {conteos[tab.id]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function ProximoHero({ fila }: { fila: Fila }) {
  const { cliente, vencimiento } = fila;
  const estado = estadoSemaforo(vencimiento.diasFaltantes);
  return (
    <section className="relative mb-14 rounded-2xl bg-paper paper-shadow-lg overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
      <div className="relative grid grid-cols-1 md:grid-cols-5 gap-8 p-8 md:p-10">
        <div className="md:col-span-3">
          <div className="flex items-center gap-3 mb-6">
            <span className="tracker text-terracotta">El próximo a vencer</span>
            <span className="h-px flex-1 bg-rule" />
            <SemaforoBadge
              estado={estado}
              diasFaltantes={vencimiento.diasFaltantes}
            />
          </div>
          <Link
            href={`/clientes/${cliente.id}`}
            className="block group"
          >
            <h2 className="font-serif text-4xl md:text-5xl text-ink leading-[1.05] tracking-tight group-hover:text-terracotta transition-colors">
              {cliente.nombre}
            </h2>
          </Link>
          <p className="mt-3 text-ink-soft">
            <span className="serif-italic text-lg">{vencimiento.obligacionNombre}</span>
            <span className="text-ink-faint"> · {vencimiento.periodo}</span>
          </p>
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-rule-soft">
            <div>
              <p className="tracker text-ink-faint mb-1">NIT</p>
              <p className="font-mono text-sm text-ink tabular">
                {cliente.nit}-{cliente.digitoVerificacion}
              </p>
            </div>
            <div>
              <p className="tracker text-ink-faint mb-1">Tipo</p>
              <p className="text-sm text-ink">
                {cliente.tipoPersona === "natural" ? "Persona Natural" : "Persona Jurídica"}
              </p>
            </div>
            <div>
              <p className="tracker text-ink-faint mb-1">Etapa</p>
              <p className="text-sm text-ink">{vencimiento.etapa}</p>
            </div>
          </div>
        </div>
        <div className="md:col-span-2 flex md:justify-end items-center md:pl-8 md:border-l border-rule">
          <FechaGrande
            fecha={vencimiento.fecha}
            diasFaltantes={vencimiento.diasFaltantes}
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  tono,
}: {
  label: string;
  value: number;
  tono: "muted" | "amber" | "sage" | "rust" | "crimson";
}) {
  const colorMap = {
    muted: "text-ink-faint",
    amber: "text-amber-deep",
    sage: "text-sage",
    rust: "text-rust",
    crimson: "text-crimson",
  };
  return (
    <div className="bg-paper p-6">
      <p className="tracker text-ink-muted mb-3">{label}</p>
      <p className={`font-serif text-5xl tabular leading-none ${colorMap[tono]}`}>
        {value}
      </p>
      <p className="mt-2 text-[11px] text-ink-faint">
        {value === 1 ? "vencimiento" : "vencimientos"}
      </p>
    </div>
  );
}

function Seccion({
  titulo,
  subtitulo,
  filas,
  vacio,
}: {
  titulo: string;
  subtitulo: string;
  filas: Fila[];
  vacio: string;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="font-serif text-3xl text-ink tracking-tight">
            {titulo}
            <span className="serif-italic text-terracotta tabular ml-3">
              {filas.length}
            </span>
          </h2>
          <p className="text-sm text-ink-muted mt-1">{subtitulo}</p>
        </div>
      </div>
      {filas.length === 0 ? (
        <div className="rounded-xl bg-paper paper-shadow px-6 py-8">
          <p className="text-ink-faint italic text-center">{vacio}</p>
        </div>
      ) : (
        <ul className="rounded-xl bg-paper paper-shadow divide-y divide-rule-soft overflow-hidden">
          {filas.map((f) => (
            <FilaItem key={`${f.cliente.id}-${f.vencimiento.obligacionId}`} fila={f} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FilaItem({ fila }: { fila: Fila }) {
  const { cliente, vencimiento } = fila;
  const estado = estadoSemaforo(vencimiento.diasFaltantes);
  return (
    <li>
      <Link
        href={`/clientes/${cliente.id}`}
        className="flex items-center gap-5 px-6 py-4 hover:bg-cream/40 transition-colors group"
      >
        <SemaforoDot estado={estado} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink group-hover:text-terracotta transition-colors">
            {cliente.nombre}
          </p>
          <p className="text-sm text-ink-muted truncate mt-0.5">
            <span className="serif-italic">{vencimiento.obligacionNombre}</span>
            <span className="text-ink-faint"> · {vencimiento.periodo} · </span>
            <span className="font-mono text-[11px] tabular">
              {cliente.nit}-{cliente.digitoVerificacion}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <span className="font-mono text-xs text-ink-soft tabular">
            {fechaCorta(vencimiento.fecha)}
          </span>
          <SemaforoBadge estado={estado} diasFaltantes={vencimiento.diasFaltantes} />
        </div>
      </Link>
    </li>
  );
}
