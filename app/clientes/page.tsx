import Link from "next/link";
import { Shell } from "@/components/Header";

export const dynamic = "force-dynamic";

import { SemaforoBadge } from "@/components/SemaforoBadge";
import { fechaCorta } from "@/components/FechaDisplay";
import { cargarClientes, cargarCalendario } from "@/lib/clientes";
import { obtenerVencimientosFuturos, estadoSemaforo } from "@/lib/calendario";
import type { Cliente } from "@/lib/types";

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter((p) => /^[A-ZÁÉÍÓÚÑ]/.test(p))
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

const REGIMEN_LABEL: Record<string, string> = {
  no_aplica: "Sin IVA",
  bimestral: "Bimestral",
  cuatrimestral: "Cuatrimestral",
};

const POR_PAGINA = 30;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const sp = await searchParams;
  const [clientes, calendario] = await Promise.all([
    cargarClientes(),
    cargarCalendario(),
  ]);
  const hoy = new Date();

  const items = clientes.map((c) => {
    const vs = obtenerVencimientosFuturos(c, calendario, hoy);
    const proximo = vs[0] ?? null;
    const totalObligaciones = c.obligacionesActivas.length;
    return { cliente: c, proximo, totalObligaciones, totalVencimientos: vs.length };
  });

  const naturales = items
    .filter((i) => i.cliente.tipoPersona === "natural")
    .sort((a, b) => a.cliente.nombre.localeCompare(b.cliente.nombre, "es"));
  const juridicas = items
    .filter((i) => i.cliente.tipoPersona === "juridica")
    .sort((a, b) => a.cliente.nombre.localeCompare(b.cliente.nombre, "es"));

  const totalPaginas = Math.max(1, Math.ceil(naturales.length / POR_PAGINA));
  const pSolicitada = sp.p ? Math.max(1, parseInt(sp.p, 10) || 1) : 1;
  const paginaActual = Math.min(pSolicitada, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const naturalesPagina = naturales.slice(inicio, inicio + POR_PAGINA);

  return (
    <Shell>
      <div className="px-8 md:px-16 lg:px-20 py-12 max-w-6xl">
        <header className="mb-12">
          <p className="tracker text-ink-muted mb-3">Tu cartera</p>
          <h1 className="font-serif text-5xl text-ink leading-none tracking-tight">
            Clientes
            <span className="serif-italic text-terracotta tabular ml-3">
              {clientes.length}
            </span>
          </h1>
          <p className="mt-4 text-ink-soft max-w-md">
            <span className="tabular">{juridicas.length}</span> personas jurídicas y{" "}
            <span className="tabular">{naturales.length}</span> personas naturales
            registradas.
          </p>
        </header>

        <Grupo titulo="Personas jurídicas" items={juridicas} />
        <div className="h-12" />
        <Grupo
          titulo="Personas naturales"
          items={naturalesPagina}
          totalGrupo={naturales.length}
          paginacion={
            totalPaginas > 1
              ? { paginaActual, totalPaginas, porPagina: POR_PAGINA, total: naturales.length }
              : undefined
          }
        />
      </div>
    </Shell>
  );
}

function Paginacion({
  paginaActual,
  totalPaginas,
  porPagina,
  total,
}: {
  paginaActual: number;
  totalPaginas: number;
  porPagina: number;
  total: number;
}) {
  const desde = (paginaActual - 1) * porPagina + 1;
  const hasta = Math.min(paginaActual * porPagina, total);
  const hrefPara = (p: number) => (p === 1 ? "/clientes" : `/clientes?p=${p}`);

  const paginasVisibles: number[] = [];
  const inicio = Math.max(1, paginaActual - 2);
  const fin = Math.min(totalPaginas, paginaActual + 2);
  for (let i = inicio; i <= fin; i++) paginasVisibles.push(i);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm">
      <p className="font-mono text-xs tabular text-ink-faint">
        {desde}–{hasta} de {total}
      </p>
      <div className="flex items-center gap-1">
        {paginaActual > 1 && (
          <Link
            href={hrefPara(paginaActual - 1)}
            className="font-mono text-xs px-3 py-1.5 rounded-full bg-paper paper-shadow text-ink-soft hover:text-terracotta transition-colors tracker"
          >
            ← Anterior
          </Link>
        )}
        {inicio > 1 && (
          <>
            <Link
              href={hrefPara(1)}
              className="font-mono text-xs tabular px-3 py-1.5 rounded-full text-ink-soft hover:text-terracotta transition-colors"
            >
              1
            </Link>
            {inicio > 2 && <span className="text-ink-faint px-1">…</span>}
          </>
        )}
        {paginasVisibles.map((p) =>
          p === paginaActual ? (
            <span
              key={p}
              className="font-mono text-xs tabular px-3 py-1.5 rounded-full bg-ink text-cream paper-shadow"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={hrefPara(p)}
              className="font-mono text-xs tabular px-3 py-1.5 rounded-full text-ink-soft hover:text-terracotta transition-colors"
            >
              {p}
            </Link>
          )
        )}
        {fin < totalPaginas && (
          <>
            {fin < totalPaginas - 1 && <span className="text-ink-faint px-1">…</span>}
            <Link
              href={hrefPara(totalPaginas)}
              className="font-mono text-xs tabular px-3 py-1.5 rounded-full text-ink-soft hover:text-terracotta transition-colors"
            >
              {totalPaginas}
            </Link>
          </>
        )}
        {paginaActual < totalPaginas && (
          <Link
            href={hrefPara(paginaActual + 1)}
            className="font-mono text-xs px-3 py-1.5 rounded-full bg-paper paper-shadow text-ink-soft hover:text-terracotta transition-colors tracker"
          >
            Siguiente →
          </Link>
        )}
      </div>
    </nav>
  );
}

function Grupo({
  titulo,
  items,
  totalGrupo,
  paginacion,
}: {
  titulo: string;
  items: Array<{
    cliente: Cliente;
    proximo: ReturnType<typeof obtenerVencimientosFuturos>[number] | null;
    totalObligaciones: number;
    totalVencimientos: number;
  }>;
  totalGrupo?: number;
  paginacion?: {
    paginaActual: number;
    totalPaginas: number;
    porPagina: number;
    total: number;
  };
}) {
  if (items.length === 0) return null;
  const cuenta = totalGrupo ?? items.length;
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="font-serif text-2xl text-ink tracking-tight">{titulo}</h2>
        <div className="dotted-rule flex-1 mb-1" />
        <span className="font-mono text-xs tabular text-ink-faint">
          {cuenta}
        </span>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(({ cliente, proximo, totalObligaciones, totalVencimientos }) => (
          <li key={cliente.id}>
            <Link
              href={`/clientes/${cliente.id}`}
              className="block rounded-xl bg-paper paper-shadow p-5 hover:paper-shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-12 w-12 rounded-full bg-cream-deep flex items-center justify-center">
                  <span className="serif-italic text-xl text-terracotta tabular leading-none">
                    {iniciales(cliente.nombre)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-ink group-hover:text-terracotta transition-colors leading-tight">
                    {cliente.nombre}
                  </h3>
                  <p className="font-mono text-[11px] text-ink-faint tabular mt-1">
                    NIT {cliente.nit}-{cliente.digitoVerificacion}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="tracker text-ink-muted">
                      IVA · {REGIMEN_LABEL[cliente.regimenIva]}
                    </span>
                    <span className="text-ink-faint">·</span>
                    <span className="tracker text-ink-muted tabular">
                      {totalObligaciones} oblig.
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-rule-soft">
                {proximo ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-ink-faint mb-0.5">
                        Próximo vencimiento
                      </p>
                      <p className="text-sm text-ink truncate">
                        <span className="serif-italic">{proximo.obligacionNombre}</span>
                        <span className="text-ink-muted font-mono text-xs ml-2 tabular">
                          {fechaCorta(proximo.fecha)}
                        </span>
                      </p>
                    </div>
                    <SemaforoBadge
                      estado={estadoSemaforo(proximo.diasFaltantes)}
                      diasFaltantes={proximo.diasFaltantes}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-ink-faint italic">
                    Sin vencimientos pendientes
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {paginacion && <Paginacion {...paginacion} />}
    </section>
  );
}
