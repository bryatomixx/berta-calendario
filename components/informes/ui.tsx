'use client';

import { ChevronDown } from 'lucide-react';
import { fmtCOP, fmtShort, fmtPct, type FilaMatriz } from '@/lib/informes';

/* -------------------------------------------------------------------------
   Piezas visuales compartidas por los informes (mensual y anual).
   Paleta: rojo de marca BVR + grises, mas semanticos para signo.
   ---------------------------------------------------------------------- */

export const C = {
  brand: '#E71F22',
  b1: '#EB5557',
  b2: '#F08486',
  b3: '#F6AEAF',
  slate: '#94A3B8',
  slate2: '#CBD5E1',
  ink: '#64748B',
  emerald: '#10B981',
  rose: '#FB7185',
};

// Paleta categorica DISTINGUIBLE para donas multi-categoria (no todos rojos):
// rojo de marca para el dominante, luego grafito / ambar / teal.
export const CAT = ['#E71F22', '#334155', '#D97706', '#0D9488'];

const nf = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
export const fmtNum = (n: number | null | undefined): string => (n == null ? '·' : nf.format(n));

/** "TOTAL INGRESOS" -> "Total ingresos" */
export function cap(s: string): string {
  const t = s.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function Card({
  title,
  subtitle,
  children,
  right,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-card p-5 sm:p-6">
      {(title || right) && (
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function BigNum({ label, value, color, hero }: { label: string; value: string; color: string; hero?: boolean }) {
  return (
    <div className={`bg-white rounded-[var(--radius-xl)] border shadow-card p-5 ${hero ? 'border-[var(--color-teal-200)]' : 'border-[var(--color-border)]'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-1 font-bold tracking-tight tabular-nums ${hero ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} ${color}`}>{value}</p>
    </div>
  );
}

export function Donut({ data, size = 176, thickness = 26 }: { data: { label: string; value: number; color: string }[]; size?: number; thickness?: number }) {
  const total = data.reduce((a, d) => a + Math.max(0, d.value), 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const len = (Math.max(0, d.value) / total) * circ;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-acc} strokeLinecap="butt" />
          );
          acc += len;
          return el;
        })}
      </g>
    </svg>
  );
}

export function DonutCard({
  title,
  subtitle,
  data,
  centerLabel,
  centerValue,
}: {
  title: string;
  subtitle?: string;
  data: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = data.reduce((a, d) => a + Math.max(0, d.value), 0) || 1;
  return (
    <Card title={title} subtitle={subtitle}>
      <div className="flex items-center gap-5 sm:gap-7 flex-col sm:flex-row">
        <div className="relative shrink-0" style={{ width: 176, height: 176 }}>
          <Donut data={data} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">{centerLabel}</span>
            <span className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">{centerValue}</span>
          </div>
        </div>
        <div className="flex-1 w-full min-w-0 space-y-2.5">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />
              <span className="flex-1 text-sm text-[var(--color-text-secondary)] truncate" title={d.label}>{d.label}</span>
              <span className="text-sm font-medium tabular-nums text-[var(--color-text-primary)]">{fmtCOP(d.value)}</span>
              <span className="w-10 text-right text-xs text-[var(--color-text-muted)] tabular-nums">{fmtPct(d.value / total)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function AreaLine({ labels, values }: { labels: string[]; values: number[] }) {
  const W = 620, H = 230, padX = 30, padTop = 22, padBot = 34;
  const min = Math.min(0, ...values);
  const max = Math.max(...values) || 1;
  const range = max - min || 1;
  const x = (i: number) => padX + (i * (W - 2 * padX)) / Math.max(1, values.length - 1);
  const y = (v: number) => H - padBot - ((v - min) / range) * (H - padTop - padBot);
  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${x(0).toFixed(1)},${(H - padBot).toFixed(1)} ${line} ${x(values.length - 1).toFixed(1)},${(H - padBot).toFixed(1)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
      <polygon points={area} fill={C.brand} opacity={0.08} />
      <polyline points={line} fill="none" stroke={C.brand} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r={3.5} fill="#fff" stroke={C.brand} strokeWidth={2} />
          <text x={x(i)} y={H - 12} textAnchor="middle" fontSize={11} fill="var(--color-text-muted)">{labels[i]}</text>
        </g>
      ))}
      <text x={x(values.length - 1)} y={y(values[values.length - 1]) - 10} textAnchor="end" fontSize={12} fontWeight={700} fill={C.brand}>{fmtShort(values[values.length - 1])}</text>
    </svg>
  );
}

export function MonthlyBars({ months, series }: { months: string[]; series: { label: string; values: (number | null)[]; cls: string }[] }) {
  const max = Math.max(1, ...series.flatMap((s) => s.values.map((v) => Math.abs(v || 0))));
  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-4 h-48">
        {months.map((m, i) => (
          <div key={m} className="flex-1 flex flex-col items-center gap-2 h-full min-w-0">
            <div className="w-full flex-1 flex items-end justify-center gap-1">
              {series.map((s) => {
                const v = Math.abs(s.values[i] || 0);
                return <div key={s.label} title={`${s.label}: ${fmtCOP(s.values[i])}`} className={`w-2.5 sm:w-4 rounded-t ${s.cls}`} style={{ height: `${(v / max) * 100}%` }} />;
              })}
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">{m.slice(0, 3)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-5 mt-3">
        {series.map((s) => <span key={s.label} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]"><span className={`w-2.5 h-2.5 rounded-sm ${s.cls}`} />{s.label}</span>)}
      </div>
    </div>
  );
}

export function SignedBars({ months, values }: { months: string[]; values: (number | null)[] }) {
  const max = Math.max(1, ...values.map((v) => Math.abs(v || 0)));
  return (
    <div className="flex items-stretch gap-2 sm:gap-4 h-52">
      {months.map((m, i) => {
        const v = values[i] || 0;
        const h = (Math.abs(v) / max) * 100;
        return (
          <div key={m} className="flex-1 flex flex-col items-center min-w-0">
            <div className="flex-1 w-full flex items-end justify-center">{v > 0 && <div className="w-3.5 sm:w-5 rounded-t bg-emerald-500" style={{ height: `${h}%` }} title={fmtCOP(v)} />}</div>
            <div className="w-full h-px bg-[var(--color-border)]" />
            <div className="flex-1 w-full flex items-start justify-center">{v < 0 && <div className="w-3.5 sm:w-5 rounded-b bg-rose-400" style={{ height: `${h}%` }} title={fmtCOP(v)} />}</div>
            <span className="text-[10px] text-[var(--color-text-muted)] mt-1">{m.slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Barras horizontales comparativas (una barra por columna). */
export function CompareBars({ columnas, series }: { columnas: string[]; series: { label: string; values: (number | null)[] }[] }) {
  const max = Math.max(1, ...series.flatMap((s) => s.values.map((v) => Math.abs(v || 0))));
  const colores = [C.brand, C.slate];
  return (
    <div className="space-y-5">
      {series.map((s) => (
        <div key={s.label}>
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">{s.label}</p>
          <div className="space-y-1.5">
            {columnas.map((col, i) => {
              const v = s.values[i] ?? 0;
              return (
                <div key={col} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-xs tabular-nums text-[var(--color-text-muted)]">{col}</span>
                  <div className="flex-1 h-3 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(Math.abs(v) / max) * 100}%`, background: colores[i % colores.length] }} />
                  </div>
                  <span className="w-32 text-right text-sm font-medium tabular-nums text-[var(--color-text-primary)]">{fmtCOP(v)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mt-4 first:mt-0 mb-1">{children}</p>;
}

export function StRow({ label, value, sub, total }: { label: string; value: number | null; sub?: boolean; total?: boolean }) {
  const neg = (value ?? 0) < 0;
  return (
    <div className={['flex items-center justify-between gap-4 py-1.5', total ? 'mt-1 border-t-2 border-[var(--color-border)] pt-2.5' : sub ? 'border-t border-[var(--color-border-soft)] pt-2 mt-1' : ''].join(' ')}>
      <span className={total ? 'text-sm font-bold text-[var(--color-text-primary)]' : sub ? 'text-sm font-semibold text-[var(--color-text-primary)]' : 'text-sm text-[var(--color-text-secondary)]'}>{label}</span>
      <span className={['tabular-nums shrink-0', total ? 'text-base font-bold text-teal-700' : sub ? 'text-sm font-semibold' : 'text-sm font-medium', neg ? 'text-rose-600' : total ? 'text-teal-700' : 'text-[var(--color-text-primary)]'].join(' ')}>{fmtCOP(value)}</span>
    </div>
  );
}

/** Fila de estado financiero comparativo: una celda por columna. */
export function StRowMulti({ label, values, sub, total }: { label: string; values: (number | null)[]; sub?: boolean; total?: boolean }) {
  return (
    <div className={['flex items-center gap-3 py-1.5', total ? 'mt-1 border-t-2 border-[var(--color-border)] pt-2.5' : sub ? 'border-t border-[var(--color-border-soft)] pt-2 mt-1' : ''].join(' ')}>
      <span className={['flex-1 min-w-0', total ? 'text-sm font-bold text-[var(--color-text-primary)]' : sub ? 'text-sm font-semibold text-[var(--color-text-primary)]' : 'text-sm text-[var(--color-text-secondary)]'].join(' ')}>{label}</span>
      {values.map((v, i) => (
        <span
          key={i}
          className={[
            'w-32 sm:w-40 text-right tabular-nums shrink-0',
            total ? 'text-base font-bold' : sub ? 'text-sm font-semibold' : 'text-sm font-medium',
            (v ?? 0) < 0 ? 'text-rose-600' : total ? 'text-teal-700' : i === 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]',
          ].join(' ')}
        >
          {fmtCOP(v)}
        </span>
      ))}
    </div>
  );
}

export function Seg({ w, color, label, pct }: { w: number; color: string; label: string; pct: number }) {
  if (w <= 0) return null;
  return (
    <div className="flex items-center justify-center text-white text-[11px] font-semibold" style={{ width: `${w}%`, background: color }} title={`${label}: ${fmtPct(pct)}`}>
      {w > 12 ? `${label} ${fmtPct(pct)}` : ''}
    </div>
  );
}

export function Detail({ summary, children, flush }: { summary: string; children: React.ReactNode; flush?: boolean }) {
  return (
    <details className={`group ${flush ? 'mt-5 border-t border-[var(--color-border-soft)]' : 'bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-card'} overflow-hidden`}>
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-1 sm:px-1 py-3.5 flex items-center justify-between text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        <span>{summary}</span>
        <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] transition-transform group-open:rotate-180" />
      </summary>
      <div className={flush ? 'pb-2 pt-1' : 'px-5 sm:px-6 pb-6 pt-1'}>{children}</div>
    </details>
  );
}

/** Tabla matriz generica: concepto x columnas + total + participacion. */
export function MatrixTable({ columns, rows }: { columns: string[]; rows: FilaMatriz[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-[var(--color-text-muted)]">
            <th className="text-left font-semibold py-2 pr-4 sticky left-0 bg-white whitespace-nowrap">Concepto</th>
            {columns.map((c) => (
              <th key={c} className="text-right font-semibold py-2 px-2 whitespace-nowrap">{c}</th>
            ))}
            <th className="text-right font-semibold py-2 px-3 whitespace-nowrap">Total</th>
            <th className="text-right font-semibold py-2 pl-2 whitespace-nowrap">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const esTotal = /^total|^utilidad/i.test(r.concepto);
            const detalle = (r.nivel ?? 0) > 0;
            return (
              <tr key={`${r.concepto}-${ri}`} className={`border-t border-[var(--color-border-soft)] ${esTotal ? 'font-semibold' : ''}`}>
                <td className={`text-left py-2 pr-4 sticky left-0 bg-white whitespace-nowrap ${detalle ? 'pl-4 text-[var(--color-text-muted)] italic' : esTotal ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                  {detalle ? cap(r.concepto) : r.concepto}
                </td>
                {r.valores.map((v, i) => (
                  <td key={i} className={`text-right py-2 px-2 tabular-nums whitespace-nowrap ${(v ?? 0) < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>{fmtNum(v)}</td>
                ))}
                <td className={`text-right py-2 px-3 tabular-nums whitespace-nowrap font-semibold ${(r.total ?? 0) < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>{fmtNum(r.total)}</td>
                <td className="text-right py-2 pl-2 tabular-nums whitespace-nowrap text-[var(--color-text-muted)]">{fmtPct(r.participacion)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
