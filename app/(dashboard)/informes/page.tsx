'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FileBarChart2, Building2, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { InformeMensualView } from '@/components/informes/InformeMensual';
import { INFORMES, getInforme } from '@/lib/informes';

/** Expande los <details> del informe y abre el dialogo de impresion del
    navegador (Guardar como PDF). Al terminar, restaura el estado previo. */
function descargarPDF() {
  if (typeof document === 'undefined') return;
  const detalles = Array.from(document.querySelectorAll('details'));
  const previo = detalles.map((d) => d.open);
  detalles.forEach((d) => { d.open = true; });
  const restaurar = () => {
    detalles.forEach((d, i) => { d.open = previo[i]; });
    window.removeEventListener('afterprint', restaurar);
  };
  window.addEventListener('afterprint', restaurar);
  window.print();
}

/* La pagina de informes trabaja SIEMPRE sobre un cliente concreto. El cliente
   activo llega por ?cliente=<id> (desde la ficha del cliente); si no viene, se
   muestra el primero del registro. Arriba hay un selector con las empresas que
   tienen informe cargado. */

function InformesContenido() {
  const params = useSearchParams();
  const clienteId = params.get('cliente');
  const informe = useMemo(() => getInforme(clienteId), [clienteId]);

  const empresas = useMemo(
    () =>
      INFORMES.map((i) => ({ id: i.clienteId, empresa: i.empresa })).sort((a, b) =>
        a.empresa.localeCompare(b.empresa, 'es'),
      ),
    [],
  );

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        title="Informes Financieros"
        subtitle={`${informe.empresa} · ${informe.periodo}`}
        actions={
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center rounded-[var(--radius-full)] bg-[var(--color-teal-50)] px-3 py-1.5 text-xs font-semibold text-[var(--color-teal-700)]">
              Corte {informe.corte}
            </span>
            <button
              type="button"
              onClick={descargarPDF}
              className="no-print inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-text-primary)] px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 cursor-pointer"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Descargar PDF
            </button>
          </div>
        }
      />

      {/* Selector de empresa: solo aparece si hay mas de un informe. */}
      {empresas.length > 1 && (
        <div className="no-print mb-6 -mx-1 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] px-1">
            <Building2 className="w-3.5 h-3.5" />
            Empresa
          </span>
          {empresas.map((e) => {
            const active = e.id === informe.clienteId;
            return (
              <Link
                key={e.id}
                href={`/informes?cliente=${e.id}`}
                className={[
                  'shrink-0 px-3.5 py-2 rounded-[var(--radius-full)] text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40',
                  active
                    ? 'bg-[var(--color-text-primary)] text-white font-semibold shadow-xs'
                    : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] font-medium',
                ].join(' ')}
              >
                {e.empresa}
              </Link>
            );
          })}
        </div>
      )}

      <InformeMensualView data={informe} />

      <FuentesNota fuentes={informe.fuentes} />

      <p className="mt-6 text-center text-[11px] text-[var(--color-text-muted)]">
        Cifras en {informe.moneda === 'COP' ? 'pesos colombianos (COP)' : informe.moneda}. Fuente: reportes contables del cliente.
        <br />© BVR Asesorias · Informe generado para revisión interna.
      </p>
    </div>
  );
}

function FuentesNota({ fuentes }: { fuentes: { archivo: string; hoja: string; seccion: string }[] }) {
  if (!fuentes?.length) return null;
  return (
    <details className="no-print mt-8 group">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-center text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
        Ver archivos fuente ({fuentes.length})
      </summary>
      <div className="mt-3 mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
        <ul className="space-y-1.5">
          {fuentes.map((f, i) => (
            <li key={i} className="flex items-baseline gap-2 text-[11px]">
              <span className="font-semibold text-[var(--color-text-secondary)] shrink-0">{f.seccion}</span>
              <span className="text-[var(--color-text-muted)] truncate">
                {f.archivo}
                {f.hoja ? ` · hoja ${f.hoja}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

export default function InformesPage() {
  return (
    <Suspense fallback={<InformesSkeleton />}>
      <InformesContenido />
    </Suspense>
  );
}

function InformesSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-3">
        <FileBarChart2 className="w-6 h-6 text-slate-200" />
        <div className="h-7 w-56 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-[var(--radius-xl)]" />
        ))}
      </div>
      <div className="h-64 bg-slate-100 rounded-[var(--radius-xl)]" />
    </div>
  );
}
