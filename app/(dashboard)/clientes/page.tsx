'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Users, Building2, User } from 'lucide-react';
import { getClients } from '@/lib/db/clients';
import { obtenerVencimientosFuturos, estadoSemaforo } from '@/lib/tributario/calendario';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/Avatar';
import { SemaforoBadge } from '@/components/SemaforoBadge';
import { fechaCorta } from '@/components/FechaDisplay';
import calendarioData from '@/data/calendario_2026.json';
import type { Cliente, Calendario, VencimientoCalculado } from '@/lib/tributario/types';

const calendar = calendarioData as unknown as Calendario;

const REGIMEN_LABEL: Record<string, string> = {
  no_aplica: 'Sin IVA',
  bimestral: 'Bimestral',
  cuatrimestral: 'Cuatrimestral',
};

const AVATAR_COLORS = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];

function avatarColor(name: string): string {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

const POR_PAGINA = 30;

type ItemCliente = {
  cliente: Cliente;
  proximo: VencimientoCalculado | null;
  totalObligaciones: number;
};

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 bg-slate-100 rounded-[var(--radius-md)]" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-[var(--card-p)] flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-2.5 bg-slate-100 rounded w-3/4" />
              <div className="h-5 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [paginaNaturales, setPaginaNaturales] = useState(1);

  useEffect(() => {
    getClients()
      .then((cs) => setClientes(cs))
      .finally(() => setLoading(false));
  }, []);

  const hoy = useMemo(() => new Date(), []);

  const items = useMemo<ItemCliente[]>(() => {
    return clientes.map((c) => {
      const vs =
        c.nit && c.obligacionesActivas.length > 0
          ? obtenerVencimientosFuturos(c, calendar, hoy)
          : [];
      return {
        cliente: c,
        proximo: vs[0] ?? null,
        totalObligaciones: c.obligacionesActivas.length,
      };
    });
  }, [clientes, hoy]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.cliente.nombre.toLowerCase().includes(q) ||
        (i.cliente.nit ?? '').includes(q),
    );
  }, [items, busqueda]);

  const totalJuridicas = useMemo(
    () => items.filter((i) => i.cliente.tipoPersona === 'juridica').length,
    [items],
  );
  const totalNaturales = useMemo(
    () => items.filter((i) => i.cliente.tipoPersona === 'natural').length,
    [items],
  );

  const juridicas = useMemo(
    () =>
      filtrados
        .filter((i) => i.cliente.tipoPersona === 'juridica')
        .sort((a, b) => a.cliente.nombre.localeCompare(b.cliente.nombre, 'es')),
    [filtrados],
  );
  const naturales = useMemo(
    () =>
      filtrados
        .filter((i) => i.cliente.tipoPersona === 'natural')
        .sort((a, b) => a.cliente.nombre.localeCompare(b.cliente.nombre, 'es')),
    [filtrados],
  );
  const sinClasificar = useMemo(
    () =>
      filtrados
        .filter((i) => !i.cliente.tipoPersona)
        .sort((a, b) => a.cliente.nombre.localeCompare(b.cliente.nombre, 'es')),
    [filtrados],
  );

  const totalPaginasNat = Math.max(1, Math.ceil(naturales.length / POR_PAGINA));
  const paginaActualNat = Math.min(paginaNaturales, totalPaginasNat);
  const naturalesPagina = naturales.slice(
    (paginaActualNat - 1) * POR_PAGINA,
    paginaActualNat * POR_PAGINA,
  );

  if (loading) return <PageSkeleton />;

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        title="Clientes"
        subtitle={`${clientes.length} clientes en la cartera`}
        actions={
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)] pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar cliente o NIT"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaNaturales(1);
              }}
              className="h-9 w-56 pl-8 pr-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] shadow-xs transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
              aria-label="Buscar cliente o NIT"
            />
          </div>
        }
      />

      {/* KPIs: siempre muestran totales del universo completo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total clientes"
          value={String(clientes.length)}
          icon={Users}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          label="Personas juridicas"
          value={String(totalJuridicas)}
          icon={Building2}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          label="Personas naturales"
          value={String(totalNaturales)}
          icon={User}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {filtrados.length === 0 && (
        <EmptyState
          icon={Users}
          title="Sin resultados"
          body="No hay clientes que coincidan con tu busqueda."
        />
      )}

      {juridicas.length > 0 && (
        <GrupoClientes titulo="Personas juridicas" items={juridicas} />
      )}

      {naturales.length > 0 && (
        <div className={juridicas.length > 0 ? 'mt-8' : ''}>
          <GrupoClientes
            titulo="Personas naturales"
            items={naturalesPagina}
            totalGrupo={naturales.length}
          />
          {totalPaginasNat > 1 && (
            <PaginacionCliente
              paginaActual={paginaActualNat}
              totalPaginas={totalPaginasNat}
              porPagina={POR_PAGINA}
              total={naturales.length}
              onCambio={(p) => {
                setPaginaNaturales(p);
                if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </div>
      )}

      {sinClasificar.length > 0 && (
        <div className={juridicas.length > 0 || naturales.length > 0 ? 'mt-8' : ''}>
          <GrupoClientes titulo="Sin clasificar" items={sinClasificar} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Grupo de clientes
   ---------------------------------------------------------------------- */

function GrupoClientes({
  titulo,
  items,
  totalGrupo,
}: {
  titulo: string;
  items: ItemCliente[];
  totalGrupo?: number;
}) {
  const cuenta = totalGrupo ?? items.length;
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] shrink-0">
          {titulo}
        </h2>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-xs tabular-nums text-[var(--color-text-muted)] shrink-0">
          {cuenta}
        </span>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(({ cliente, proximo, totalObligaciones }) => (
          <li key={cliente.id}>
            <Link
              href={`/clientes/${cliente.id}`}
              className="group block rounded-[var(--radius-xl)] bg-white border border-[var(--color-border)] shadow-card p-[var(--card-p)] hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
            >
              <div className="flex items-start gap-3">
                <Avatar name={cliente.nombre} color={avatarColor(cliente.nombre)} size={40} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-teal-600 transition-colors leading-tight truncate">
                    {cliente.nombre}
                  </h3>
                  {cliente.nit ? (
                    <p className="text-[11px] tabular-nums text-[var(--color-text-muted)] mt-0.5">
                      NIT {cliente.nit}
                      {cliente.digitoVerificacion ? `-${cliente.digitoVerificacion}` : ''}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {cliente.regimenIva && (
                      <>
                        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                          {REGIMEN_LABEL[cliente.regimenIva] ?? cliente.regimenIva}
                        </span>
                        <span className="text-[var(--color-text-disabled)]">·</span>
                      </>
                    )}
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {totalObligaciones > 0
                        ? `${totalObligaciones} oblig.`
                        : 'Sin vencimientos'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--color-border-soft)]">
                {proximo ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-[var(--color-text-muted)] mb-0.5">
                        Proximo vencimiento
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {proximo.obligacionNombre}
                        <span className="ml-1.5 tabular-nums text-[var(--color-text-muted)]">
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
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Sin vencimientos pendientes
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------
   Paginacion (client-side)
   ---------------------------------------------------------------------- */

function PaginacionCliente({
  paginaActual,
  totalPaginas,
  porPagina,
  total,
  onCambio,
}: {
  paginaActual: number;
  totalPaginas: number;
  porPagina: number;
  total: number;
  onCambio: (p: number) => void;
}) {
  const desde = (paginaActual - 1) * porPagina + 1;
  const hasta = Math.min(paginaActual * porPagina, total);

  const inicio = Math.max(1, paginaActual - 2);
  const fin = Math.min(totalPaginas, paginaActual + 2);
  const paginasVisibles: number[] = [];
  for (let i = inicio; i <= fin; i++) paginasVisibles.push(i);

  const btnBase =
    'inline-flex items-center justify-center h-8 min-w-8 px-2.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 cursor-pointer';

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-between gap-4"
      aria-label="Paginacion de clientes"
    >
      <p className="text-xs tabular-nums text-[var(--color-text-muted)]">
        {desde}-{hasta} de {total}
      </p>
      <div className="flex items-center gap-1">
        {paginaActual > 1 && (
          <button
            onClick={() => onCambio(paginaActual - 1)}
            className={`${btnBase} bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] shadow-xs`}
          >
            Anterior
          </button>
        )}
        {inicio > 1 && (
          <>
            <button
              onClick={() => onCambio(1)}
              className={`${btnBase} text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]`}
            >
              1
            </button>
            {inicio > 2 && (
              <span className="px-1 text-xs text-[var(--color-text-muted)]">…</span>
            )}
          </>
        )}
        {paginasVisibles.map((p) =>
          p === paginaActual ? (
            <span
              key={p}
              className={`${btnBase} bg-teal-600 text-white`}
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onCambio(p)}
              className={`${btnBase} text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]`}
            >
              {p}
            </button>
          ),
        )}
        {fin < totalPaginas && (
          <>
            {fin < totalPaginas - 1 && (
              <span className="px-1 text-xs text-[var(--color-text-muted)]">…</span>
            )}
            <button
              onClick={() => onCambio(totalPaginas)}
              className={`${btnBase} text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]`}
            >
              {totalPaginas}
            </button>
          </>
        )}
        {paginaActual < totalPaginas && (
          <button
            onClick={() => onCambio(paginaActual + 1)}
            className={`${btnBase} bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] shadow-xs`}
          >
            Siguiente
          </button>
        )}
      </div>
    </nav>
  );
}
