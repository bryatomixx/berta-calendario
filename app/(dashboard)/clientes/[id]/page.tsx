'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileX2 } from 'lucide-react';
import { getClient } from '@/lib/db/clients';
import { obtenerVencimientosFuturos, estadoSemaforo } from '@/lib/tributario/calendario';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/Avatar';
import { SemaforoBadge } from '@/components/SemaforoBadge';
import calendarioData from '@/data/calendario_2026.json';
import type { Cliente, Calendario } from '@/lib/tributario/types';

const calendar = calendarioData as unknown as Calendario;

const AVATAR_COLORS = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];
function avatarColor(name: string): string {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

const REGIMEN_LABEL: Record<string, string> = {
  no_aplica: 'Sin IVA',
  bimestral: 'Bimestral',
  cuatrimestral: 'Cuatrimestral',
};

const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-slate-100 shrink-0" />
        <div className="space-y-3 flex-1">
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-7 bg-slate-100 rounded w-64" />
          <div className="h-3 bg-slate-100 rounded w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function ClienteDetalle() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getClient(id)
      .then((c) => {
        if (!c) setNotFound(true);
        else setCliente(c);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const hoy = useMemo(() => new Date(), []);

  const vencimientos = useMemo(() => {
    if (!cliente || !cliente.nit || cliente.obligacionesActivas.length === 0) return [];
    return obtenerVencimientosFuturos(cliente, calendar, hoy);
  }, [cliente, hoy]);

  const porMes = useMemo(() => {
    return vencimientos.reduce<Record<string, typeof vencimientos>>((acc, v) => {
      const k = `${v.fecha.getFullYear()}-${String(v.fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[k]) acc[k] = [];
      acc[k].push(v);
      return acc;
    }, {});
  }, [vencimientos]);

  if (loading) return <PageSkeleton />;

  if (notFound || !cliente) {
    return (
      <EmptyState
        icon={FileX2}
        title="Cliente no encontrado"
        body="No existe un cliente con ese identificador."
      />
    );
  }

  const tipoLabel =
    cliente.tipoPersona === 'natural'
      ? 'Persona natural'
      : cliente.tipoPersona === 'juridica'
      ? 'Persona juridica'
      : null;

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        title={cliente.nombre}
        subtitle={tipoLabel ?? undefined}
        back={{ href: '/clientes', label: 'Clientes' }}
      />

      {/* Avatar + datos basicos */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar name={cliente.nombre} color={avatarColor(cliente.nombre)} size={56} />
        <div className="min-w-0">
          {cliente.nit ? (
            <p className="text-sm tabular-nums text-[var(--color-text-muted)]">
              NIT {cliente.nit}
              {cliente.digitoVerificacion ? `-${cliente.digitoVerificacion}` : ''}
            </p>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">Sin NIT registrado</p>
          )}
        </div>
      </div>

      {/* Grid de datos del cliente */}
      {(cliente.regimenIva ||
        cliente.obligacionesActivas.length >= 0 ||
        cliente.email ||
        cliente.telefono) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {cliente.regimenIva && (
            <InfoTile
              label="Regimen IVA"
              value={REGIMEN_LABEL[cliente.regimenIva] ?? cliente.regimenIva}
            />
          )}
          <InfoTile
            label="Obligaciones"
            value={String(cliente.obligacionesActivas.length)}
            mono
          />
          {cliente.email && (
            <InfoTile label="Email" value={cliente.email} small />
          )}
          {cliente.telefono && (
            <InfoTile label="WhatsApp" value={cliente.telefono} mono />
          )}
        </div>
      )}

      {/* Timeline de vencimientos */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
            Vencimientos
          </h2>
          <span className="text-sm tabular-nums font-semibold text-teal-600">
            {vencimientos.length}
          </span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-muted)]">resto de 2026</span>
        </div>

        {vencimientos.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] px-6 py-10 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Sin vencimientos pendientes en 2026.
            </p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-xl)] bg-white border border-[var(--color-border)] shadow-card overflow-hidden">
            {Object.entries(porMes).map(([mesKey, vs], iMes) => {
              const [anioStr, mesStr] = mesKey.split('-');
              const anio = Number(anioStr);
              const mes = Number(mesStr);
              return (
                <div
                  key={mesKey}
                  className={iMes > 0 ? 'border-t border-[var(--color-border-soft)]' : ''}
                >
                  <div className="flex items-baseline gap-4 px-6 pt-5 pb-3">
                    <span className="font-semibold text-base text-[var(--color-text-primary)]">
                      {MESES_LARGO[mes - 1]}
                    </span>
                    <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                      {anio}
                    </span>
                    <span className="ml-auto text-[11px] tabular-nums text-[var(--color-text-muted)]">
                      {vs.length} {vs.length === 1 ? 'vencimiento' : 'vencimientos'}
                    </span>
                  </div>
                  <ul className="divide-y divide-[var(--color-border-soft)]">
                    {vs.map((v) => (
                      <li
                        key={`${v.obligacionId}-${v.fecha.toISOString()}`}
                        className="flex items-center gap-5 px-6 py-4"
                      >
                        <div className="shrink-0 w-10 text-center">
                          <p className="text-2xl tabular-nums font-bold text-[var(--color-text-primary)] leading-none">
                            {v.fecha.getDate()}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            {v.obligacionNombre}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                            {v.etapa}
                            <span className="text-[var(--color-text-muted)]"> · periodo </span>
                            {v.periodo}
                          </p>
                        </div>
                        <SemaforoBadge
                          estado={estadoSemaforo(v.diasFaltantes)}
                          diasFaltantes={v.diasFaltantes}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Tile de datos del cliente
   ---------------------------------------------------------------------- */

function InfoTile({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
        {label}
      </p>
      <p
        className={[
          'text-[var(--color-text-primary)] truncate',
          mono ? 'tabular-nums font-medium' : '',
          small ? 'text-xs' : 'text-sm font-medium',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </p>
    </div>
  );
}
