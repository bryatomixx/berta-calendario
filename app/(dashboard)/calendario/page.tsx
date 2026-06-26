'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getClients } from '@/lib/db/clients';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import calendarioData from '@/data/calendario_2026.json';
import type { Cliente, Calendario } from '@/lib/tributario/types';

const calendar = calendarioData as unknown as Calendario;

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const NOMBRES_MES_CORTO = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

type Evento = {
  clienteId: string;
  clienteNombre: string;
  obligacionId: string;
  obligacionNombre: string;
};

function calcularPorDia(
  clientes: Cliente[],
  mes: number,
  anio: number,
): Record<number, Evento[]> {
  const porDia: Record<number, Evento[]> = {};
  for (const cliente of clientes) {
    const nit = cliente.nit;
    if (!nit) continue;
    for (const obligacion of calendar.obligaciones) {
      if (!cliente.obligacionesActivas.includes(obligacion.id)) continue;
      for (const v of obligacion.vencimientos) {
        if (v.mes !== mes || v.anio !== anio) continue;
        const clave =
          obligacion.calculo === 'ultimo_1'
            ? nit.slice(-1)
            : (() => {
                const soloDigitos = nit.replace(/\D/g, '');
                const dos = soloDigitos.slice(-2).padStart(2, '0');
                if (dos === '00') return '99-00';
                const n = parseInt(dos, 10);
                return n % 2 === 0
                  ? `${String(n - 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`
                  : `${String(n).padStart(2, '0')}-${String(n + 1).padStart(2, '0')}`;
              })();
        const dia = v.fechas[clave];
        if (dia === undefined) continue;
        if (!porDia[dia]) porDia[dia] = [];
        porDia[dia].push({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          obligacionId: obligacion.id,
          obligacionNombre: obligacion.nombre,
        });
      }
    }
  }
  return porDia;
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-slate-100 rounded-[var(--radius-md)]" />
      <div className="rounded-[var(--radius-xl)] bg-slate-50 border border-slate-100 p-4">
        <div className="grid grid-cols-7 gap-px mb-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CalendarioPage() {
  const hoy = useMemo(() => new Date(), []);
  const [mes, setMes] = useState(() => hoy.getMonth() + 1);
  const [anio, setAnio] = useState(() => hoy.getFullYear());
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClients()
      .then(setClientes)
      .finally(() => setLoading(false));
  }, []);

  const porDia = useMemo(
    () => calcularPorDia(clientes, mes, anio),
    [clientes, mes, anio],
  );

  const totalEventos = useMemo(
    () => Object.values(porDia).reduce((s, arr) => s + arr.length, 0),
    [porDia],
  );

  const celdas = useMemo(() => {
    const offset = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const cs: Array<{ dia: number | null; eventos: Evento[]; esHoy: boolean }> = [];
    for (let i = 0; i < offset; i++) cs.push({ dia: null, eventos: [], esHoy: false });
    for (let d = 1; d <= diasEnMes; d++) {
      const esHoy =
        anio === hoy.getFullYear() && mes === hoy.getMonth() + 1 && d === hoy.getDate();
      cs.push({ dia: d, eventos: porDia[d] ?? [], esHoy });
    }
    return cs;
  }, [anio, mes, porDia, hoy]);

  const mesAntNum = mes === 1 ? 12 : mes - 1;
  const anioAntNum = mes === 1 ? anio - 1 : anio;
  const mesSigNum = mes === 12 ? 1 : mes + 1;
  const anioSigNum = mes === 12 ? anio + 1 : anio;

  function irAMes(m: number, a: number) {
    setMes(m);
    setAnio(a);
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        title={`${NOMBRES_MES[mes - 1]} ${anio}`}
        subtitle={`${totalEventos} vencimientos · DIAN`}
        actions={
          <div className="flex items-center gap-1">
            <button
              onClick={() => irAMes(mesAntNum, anioAntNum)}
              className="h-9 w-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 cursor-pointer"
              aria-label={`Ir a ${NOMBRES_MES_CORTO[mesAntNum - 1]}`}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => irAMes(hoy.getMonth() + 1, hoy.getFullYear())}
              className="h-9 px-4 rounded-[var(--radius-md)] bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={() => irAMes(mesSigNum, anioSigNum)}
              className="h-9 w-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 cursor-pointer"
              aria-label={`Ir a ${NOMBRES_MES_CORTO[mesSigNum - 1]}`}
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        }
      />

      {/* Grid del calendario */}
      <div className="rounded-[var(--radius-xl)] bg-white border border-[var(--color-border)] shadow-card overflow-hidden">
        {/* Cabecera de dias */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((d, i) => (
            <div
              key={d}
              className={[
                'px-3 py-3 text-[11px] font-semibold uppercase tracking-wide',
                i >= 5
                  ? 'text-[var(--color-text-disabled)]'
                  : 'text-[var(--color-text-muted)]',
              ].join(' ')}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7">
          {celdas.map((c, i) => {
            const esFinde = i % 7 >= 5;
            return (
              <div
                key={i}
                className={[
                  'min-h-28 p-3 border-r border-b border-[var(--color-border-soft)]',
                  esFinde ? 'bg-[var(--color-surface)]' : '',
                  c.esHoy ? 'ring-2 ring-inset ring-teal-500/40' : '',
                ].join(' ')}
              >
                {c.dia !== null && (
                  <>
                    <div className="flex items-baseline justify-between mb-2">
                      <span
                        className={[
                          'text-lg tabular-nums leading-none',
                          c.esHoy
                            ? 'font-bold text-teal-600'
                            : esFinde
                            ? 'font-medium text-[var(--color-text-disabled)]'
                            : 'font-semibold text-[var(--color-text-primary)]',
                        ].join(' ')}
                      >
                        {c.dia}
                      </span>
                      {c.eventos.length > 0 && (
                        <span className="text-[9px] tabular-nums text-[var(--color-text-muted)] font-medium">
                          {c.eventos.length}
                        </span>
                      )}
                    </div>
                    {c.eventos.length > 0 && (
                      <ul className="space-y-1">
                        {c.eventos.slice(0, 3).map((e, j) => (
                          <li key={j}>
                            <Link
                              href={`/clientes/${e.clienteId}`}
                              className="block truncate text-[11px] text-[var(--color-text-secondary)] hover:text-teal-600 transition-colors focus-visible:outline-none focus-visible:underline"
                              title={`${e.clienteNombre} — ${e.obligacionNombre}`}
                            >
                              <span className="text-teal-500 mr-1" aria-hidden="true">·</span>
                              {e.clienteNombre.split(' ')[0]}
                            </Link>
                          </li>
                        ))}
                        {c.eventos.length > 3 && (
                          <li className="text-[10px] text-[var(--color-text-muted)]">
                            + {c.eventos.length - 3} mas
                          </li>
                        )}
                      </ul>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Atajos de mes */}
      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Saltar
        </span>
        {[5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
          <button
            key={m}
            onClick={() => irAMes(m, 2026)}
            className={[
              'text-xs tabular-nums font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 rounded px-1',
              m === mes && anio === 2026
                ? 'text-teal-600'
                : 'text-[var(--color-text-muted)] hover:text-teal-600',
            ].join(' ')}
          >
            {NOMBRES_MES_CORTO[m - 1]}
          </button>
        ))}
      </div>
    </div>
  );
}
