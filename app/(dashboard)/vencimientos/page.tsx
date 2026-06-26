'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, Timer, CalendarDays, Mail, MessageCircle } from 'lucide-react';
import { getClients } from '@/lib/db/clients';
import { obtenerVencimientosFuturos, estadoSemaforo } from '@/lib/tributario/calendario';
import { generarEnviosSimulados } from '@/lib/tributario/notificaciones';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SemaforoBadge, SemaforoDot } from '@/components/SemaforoBadge';
import { FechaGrande, fechaCorta, diaSemanaLargo } from '@/components/FechaDisplay';
import calendarioData from '@/data/calendario_2026.json';
import type { Cliente, Calendario, VencimientoCalculado } from '@/lib/tributario/types';

const calendar = calendarioData as unknown as Calendario;

type Fila = { cliente: Cliente; vencimiento: VencimientoCalculado };

type TipoFiltro = 'todos' | 'renta' | 'iva' | 'retefuente' | 'consumo' | 'rst';

const TIPOS: Array<{ id: TipoFiltro; label: string; obligaciones: string[] }> = [
  { id: 'todos',      label: 'Todos',       obligaciones: [] },
  { id: 'renta',      label: 'Renta',       obligaciones: ['renta_juridica', 'renta_natural'] },
  { id: 'iva',        label: 'IVA',         obligaciones: ['iva_bimestral', 'iva_cuatrimestral'] },
  { id: 'retefuente', label: 'Retefuente',  obligaciones: ['retefuente'] },
  { id: 'consumo',    label: 'Consumo',     obligaciones: ['consumo'] },
  { id: 'rst',        label: 'RST',         obligaciones: ['rst_consolidada', 'rst_anticipo'] },
];

function aplicarFiltro(filas: Fila[], tipo: TipoFiltro): Fila[] {
  if (tipo === 'todos') return filas;
  const ids = TIPOS.find((t) => t.id === tipo)!.obligaciones;
  return filas.filter((f) => ids.includes(f.vencimiento.obligacionId));
}

function tipoLabel(t: TipoFiltro): string {
  return TIPOS.find((x) => x.id === t)?.label ?? 'Todos';
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-slate-100 rounded-[var(--radius-md)]" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function VencimientosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoActivo, setTipoActivo] = useState<TipoFiltro>('todos');

  useEffect(() => {
    getClients()
      .then(setClientes)
      .finally(() => setLoading(false));
  }, []);

  const hoy = useMemo(() => new Date(), []);

  const filasTodas = useMemo<Fila[]>(() => {
    return clientes.flatMap((c) => {
      if (!c.nit || c.obligacionesActivas.length === 0) return [];
      return obtenerVencimientosFuturos(c, calendar, hoy).map((v) => ({
        cliente: c,
        vencimiento: v,
      }));
    });
  }, [clientes, hoy]);

  const conteos = useMemo(() => {
    return TIPOS.reduce<Record<TipoFiltro, number>>((acc, t) => {
      acc[t.id] = aplicarFiltro(filasTodas, t.id).length;
      return acc;
    }, {} as Record<TipoFiltro, number>);
  }, [filasTodas]);

  const filas = useMemo(
    () => aplicarFiltro(filasTodas, tipoActivo),
    [filasTodas, tipoActivo],
  );

  const ordenadas = useMemo(
    () => [...filas].sort((a, b) => a.vencimiento.diasFaltantes - b.vencimiento.diasFaltantes),
    [filas],
  );
  const proxima = ordenadas[0] ?? null;

  const grupos = useMemo(() => ({
    hoy:    filas.filter((f) => f.vencimiento.diasFaltantes === 0),
    semana: filas.filter((f) => f.vencimiento.diasFaltantes >= 1 && f.vencimiento.diasFaltantes <= 5),
    quince: filas.filter((f) => f.vencimiento.diasFaltantes >= 6 && f.vencimiento.diasFaltantes <= 15),
    mes:    filas.filter((f) => f.vencimiento.diasFaltantes >= 16 && f.vencimiento.diasFaltantes <= 30),
  }), [filas]);

  const envios = useMemo(
    () => generarEnviosSimulados(clientes, calendar, hoy),
    [clientes, hoy],
  );

  if (loading) return <PageSkeleton />;

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        title="Vencimientos DIAN"
        subtitle={diaSemanaLargo(hoy)}
      />

      {/* Tabs por tipo de obligacion */}
      <div className="mb-6 -mx-1 flex items-center gap-1 overflow-x-auto pb-1">
        {TIPOS.map((tab) => {
          const isActive = tab.id === tipoActivo;
          return (
            <button
              key={tab.id}
              onClick={() => setTipoActivo(tab.id)}
              className={[
                'shrink-0 inline-flex items-baseline gap-1.5 px-4 py-2 rounded-[var(--radius-full)] text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40',
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]',
              ].join(' ')}
            >
              <span className={isActive ? 'font-semibold' : 'font-medium'}>{tab.label}</span>
              <span
                className={`text-[10px] tabular-nums ${isActive ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`}
              >
                {conteos[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hero: proximo vencimiento */}
      {proxima ? (
        <ProximoHero fila={proxima} />
      ) : (
        <EmptyState
          icon={CalendarDays}
          title={`Sin vencimientos de ${tipoLabel(tipoActivo).toLowerCase()}`}
          body="No quedan vencimientos de este tipo en lo que resta del ano."
        />
      )}

      {/* KPIs de urgencia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Hoy"
          value={String(grupos.hoy.length)}
          icon={AlertCircle}
          iconBg={grupos.hoy.length > 0 ? 'bg-rose-50' : 'bg-slate-50'}
          iconColor={grupos.hoy.length > 0 ? 'text-rose-600' : 'text-slate-400'}
        />
        <StatCard
          label="Esta semana"
          value={String(grupos.semana.length)}
          icon={Clock}
          iconBg={grupos.semana.length > 0 ? 'bg-orange-50' : 'bg-slate-50'}
          iconColor={grupos.semana.length > 0 ? 'text-orange-600' : 'text-slate-400'}
        />
        <StatCard
          label="Proximos 15d"
          value={String(grupos.quince.length)}
          icon={Timer}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Proximos 30d"
          value={String(grupos.mes.length)}
          icon={CalendarDays}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
      </div>

      {/* Listas agrupadas */}
      <div className="space-y-10">
        <Seccion
          titulo="Hoy"
          subtitulo="Cero margen, vencen al cierre del dia"
          filas={grupos.hoy}
          vacio="Nada vence hoy. Dia tranquilo."
        />
        <Seccion
          titulo="Esta semana"
          subtitulo="Entre 1 y 5 dias para llamar al cliente"
          filas={grupos.semana}
          vacio="Sin urgencias inmediatas."
        />
        <Seccion
          titulo="Proximos quince dias"
          subtitulo="Tiempo para preparar documentos"
          filas={grupos.quince}
          vacio="Nada planificado en este rango."
        />
      </div>

      {/* Envios simulados */}
      <section className="mt-14 rounded-[var(--radius-xl)] bg-white border border-[var(--color-border)] shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
              Modo demo
            </p>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Envios simulados de hoy
              <span className="ml-2 tabular-nums font-semibold text-teal-600">
                {envios.length}
              </span>
            </h2>
          </div>
          <Link
            href="/api/envios-simulados"
            className="text-[11px] font-medium text-[var(--color-text-muted)] hover:text-teal-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 rounded"
          >
            Ver JSON
          </Link>
        </div>
        {envios.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[var(--color-text-muted)]">
            Hoy no se enviaria ningun recordatorio.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border-soft)]">
            {envios.slice(0, 5).map((e, i) => (
              <li key={i} className="px-6 py-4 flex items-start gap-4">
                <span className="text-[10px] tabular-nums text-[var(--color-text-muted)] pt-1 w-6 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {e.canal === 'email' ? (
                      <Mail className="w-3 h-3 text-[var(--color-text-muted)]" aria-hidden="true" />
                    ) : (
                      <MessageCircle className="w-3 h-3 text-[var(--color-text-muted)]" aria-hidden="true" />
                    )}
                    <span className="text-xs font-medium text-[var(--color-text-muted)] capitalize">
                      {e.canal}
                    </span>
                    <span className="text-[var(--color-text-disabled)]">·</span>
                    <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                      {e.diasFaltantes === 0 ? 'vence hoy' : `en ${e.diasFaltantes}d`}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)] truncate">
                    <span className="font-medium">{e.clienteNombre}</span>
                    <span className="text-[var(--color-text-secondary)]"> · {e.obligacionNombre}</span>
                  </p>
                </div>
                <span className="text-[11px] tabular-nums text-[var(--color-text-muted)] shrink-0">
                  {fechaCorta(new Date(e.fechaVencimiento))}
                </span>
              </li>
            ))}
          </ul>
        )}
        {envios.length > 5 && (
          <p className="px-6 py-3 text-center text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border-soft)]">
            + {envios.length - 5} envios mas en el endpoint
          </p>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Hero del proximo vencimiento
   ---------------------------------------------------------------------- */

function ProximoHero({ fila }: { fila: Fila }) {
  const { cliente, vencimiento } = fila;
  const estado = estadoSemaforo(vencimiento.diasFaltantes);
  return (
    <section className="relative mb-8 rounded-[var(--radius-xl)] bg-[var(--color-teal-50)]/60 border border-[var(--color-teal-200)]/70 overflow-hidden">
      <div className="relative grid grid-cols-1 md:grid-cols-5 gap-8 p-6 md:p-8">
        <div className="md:col-span-3">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              El proximo a vencer
            </span>
            <div className="flex-1 h-px bg-[var(--color-teal-200)]/60" />
            <SemaforoBadge estado={estado} diasFaltantes={vencimiento.diasFaltantes} />
          </div>
          <Link href={`/clientes/${cliente.id}`} className="block group">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] leading-tight tracking-tight group-hover:text-teal-600 transition-colors">
              {cliente.nombre}
            </h2>
          </Link>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            <span className="font-medium">{vencimiento.obligacionNombre}</span>
            <span className="text-[var(--color-text-muted)]"> · {vencimiento.periodo}</span>
          </p>
          <div className="flex items-center gap-6 mt-5 pt-5 border-t border-[var(--color-teal-200)]/50 flex-wrap">
            {cliente.nit && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-0.5">
                  NIT
                </p>
                <p className="text-sm font-medium tabular-nums text-[var(--color-text-primary)]">
                  {cliente.nit}
                  {cliente.digitoVerificacion ? `-${cliente.digitoVerificacion}` : ''}
                </p>
              </div>
            )}
            {cliente.tipoPersona && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-0.5">
                  Tipo
                </p>
                <p className="text-sm text-[var(--color-text-primary)]">
                  {cliente.tipoPersona === 'natural' ? 'Persona Natural' : 'Persona Juridica'}
                </p>
              </div>
            )}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-0.5">
                Etapa
              </p>
              <p className="text-sm text-[var(--color-text-primary)]">{vencimiento.etapa}</p>
            </div>
          </div>
        </div>
        <div className="md:col-span-2 flex md:justify-end items-center md:pl-8 md:border-l border-[var(--color-teal-200)]/50">
          <FechaGrande
            fecha={vencimiento.fecha}
            diasFaltantes={vencimiento.diasFaltantes}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   Seccion de filas agrupadas
   ---------------------------------------------------------------------- */

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
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">
            {titulo}
            <span className="ml-2 tabular-nums font-semibold text-teal-600">
              {filas.length}
            </span>
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitulo}</p>
        </div>
      </div>
      {filas.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] px-6 py-6 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">{vacio}</p>
        </div>
      ) : (
        <ul className="rounded-[var(--radius-xl)] bg-white border border-[var(--color-border)] shadow-card divide-y divide-[var(--color-border-soft)] overflow-hidden">
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
        className="flex items-center gap-5 px-6 py-4 hover:bg-[var(--color-surface)] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500/40"
      >
        <SemaforoDot estado={estado} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-[var(--color-text-primary)] group-hover:text-teal-600 transition-colors">
            {cliente.nombre}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
            {vencimiento.obligacionNombre}
            <span className="text-[var(--color-text-muted)]"> · {vencimiento.periodo}</span>
            {cliente.nit && (
              <>
                <span className="text-[var(--color-text-muted)]"> · </span>
                <span className="tabular-nums">
                  {cliente.nit}
                  {cliente.digitoVerificacion ? `-${cliente.digitoVerificacion}` : ''}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs tabular-nums text-[var(--color-text-secondary)]">
            {fechaCorta(vencimiento.fecha)}
          </span>
          <SemaforoBadge estado={estado} diasFaltantes={vencimiento.diasFaltantes} />
        </div>
      </Link>
    </li>
  );
}
