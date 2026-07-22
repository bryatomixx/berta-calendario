'use client';

import { useState } from 'react';
import { Landmark, PiggyBank, TrendingUp, Scale } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import {
  fmtCOP,
  fmtShort,
  fmtPct,
  normalizar,
  type InformeAnual as InformeAnualData,
  type FilaMatriz,
  type ItemMulti,
} from '@/lib/informes';
import {
  C,
  fmtNum,
  Card,
  BigNum,
  DonutCard,
  CompareBars,
  GroupLabel,
  StRowMulti,
  Detail,
} from './ui';

/* Informe de cierre anual con columnas comparativas (p. ej. 2022 vs 2021).
   No hay meses ni caja: se trabaja sobre balance y estado de resultados con
   una celda por año. */

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'eri', label: 'Resultados' },
  { id: 'balance', label: 'Balance' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function fila(filas: FilaMatriz[], nombre: string): FilaMatriz | undefined {
  const key = normalizar(nombre);
  return filas.find((f) => normalizar(f.concepto).startsWith(key));
}
function filaEq(filas: FilaMatriz[], nombre: string): FilaMatriz | undefined {
  const key = normalizar(nombre);
  return filas.find((f) => normalizar(f.concepto) === key);
}

export function InformeAnualView({ data: D }: { data: InformeAnualData }) {
  const [tab, setTab] = useState<TabId>('resumen');

  const cols = D.columnas;
  const ingresos = fila(D.resultados.filas, 'industrias manufactureras') ?? fila(D.resultados.filas, 'ingresos') ?? fila(D.resultados.filas, 'servicios');
  const gananciaBruta = fila(D.resultados.filas, 'ganancia bruta');
  const utilidadOper = fila(D.resultados.filas, 'utilidad operacional');
  const resultado = fila(D.resultados.filas, 'resultado del periodo');

  const ctx = { D, cols, ingresos, gananciaBruta, utilidadOper, resultado };

  return (
    <>
      <div className="mb-6 -mx-1 flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'shrink-0 px-4 py-2 rounded-[var(--radius-full)] text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40',
                active
                  ? 'bg-teal-600 text-white font-semibold shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] font-medium',
              ].join(' ')}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'resumen' && <ResumenTab {...ctx} />}
      {tab === 'eri' && <ResultadosTab D={D} />}
      {tab === 'balance' && <BalanceTab D={D} />}
    </>
  );
}

type Ctx = {
  D: InformeAnualData;
  cols: string[];
  ingresos?: FilaMatriz;
  gananciaBruta?: FilaMatriz;
  utilidadOper?: FilaMatriz;
  resultado?: FilaMatriz;
};

/** Variacion porcentual col actual (0) vs anterior (1). */
function variacion(vals?: (number | null)[]): number | null {
  if (!vals || vals[1] == null || vals[1] === 0 || vals[0] == null) return null;
  return (vals[0] - vals[1]) / Math.abs(vals[1]);
}
function trendTxt(vals?: (number | null)[]): { trend: string; up: boolean } {
  const v = variacion(vals);
  if (v == null) return { trend: 'Sin comparativo', up: true };
  return { trend: `${v >= 0 ? '▲' : '▼'} ${fmtPct(Math.abs(v))} vs. año anterior`, up: v >= 0 };
}

/* ======================================================================
   RESUMEN
   ====================================================================== */
function ResumenTab({ D, cols, ingresos, gananciaBruta, resultado }: Ctx) {
  const b = D.balance;
  const margenBruto = (ingresos?.valores[0] ?? 0) ? (gananciaBruta?.valores[0] ?? 0) / (ingresos?.valores[0] ?? 1) : 0;
  const margenNeto = (ingresos?.valores[0] ?? 0) ? (resultado?.valores[0] ?? 0) / (ingresos?.valores[0] ?? 1) : 0;

  const tIng = trendTxt(ingresos?.valores);
  const tRes = trendTxt(resultado?.valores);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`Ingresos ${cols[0]}`} value={fmtShort(ingresos?.valores[0])} icon={TrendingUp} iconBg="bg-teal-50" iconColor="text-teal-600" trend={tIng.trend} trendUp={tIng.up} />
        <StatCard label={`Resultado ${cols[0]}`} value={fmtShort(resultado?.valores[0])} icon={PiggyBank} iconBg={(resultado?.valores[0] ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-rose-50'} iconColor={(resultado?.valores[0] ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'} trend={tRes.trend} trendUp={tRes.up} />
        <StatCard label="Margen bruto" value={fmtPct(margenBruto)} icon={Scale} iconBg="bg-slate-100" iconColor="text-slate-600" trend={`Margen neto ${fmtPct(margenNeto)}`} trendUp={margenNeto >= 0} />
        <StatCard label={`Total activo ${cols[0]}`} value={fmtShort(b.totalActivo.valores[0])} icon={Landmark} iconBg="bg-slate-100" iconColor="text-slate-600" trend={`Corte ${D.corte}`} trendUp />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ingresos y resultado" subtitle={`Comparativo ${cols.join(' vs. ')}`}>
          <CompareBars columnas={cols} series={[{ label: 'Ingresos', values: ingresos?.valores ?? [] }, { label: 'Resultado del periodo', values: resultado?.valores ?? [] }]} />
        </Card>
        <DonutCard
          title="Estructura de financiación"
          subtitle={`Cómo se financia la empresa (${cols[0]})`}
          data={[
            { label: 'Pasivo', value: b.totalPasivo.valores[0] ?? 0, color: C.slate },
            { label: 'Patrimonio', value: b.totalPatrimonio.valores[0] ?? 0, color: C.emerald },
          ]}
          centerLabel="Patrimonio"
          centerValue={fmtPct((b.totalPatrimonio.valores[0] ?? 0) / ((b.totalPasivo.valores[0] ?? 0) + (b.totalPatrimonio.valores[0] ?? 0) || 1))}
        />
      </div>
    </div>
  );
}

/* ======================================================================
   RESULTADOS (ERI comparativo)
   ====================================================================== */
function ResultadosTab({ D }: { D: InformeAnualData }) {
  const cols = D.resultados.columnas;
  const ingresos = fila(D.resultados.filas, 'industrias manufactureras') ?? fila(D.resultados.filas, 'ingresos');
  const costo = fila(D.resultados.filas, 'costo de mercancia');
  const bruta = fila(D.resultados.filas, 'ganancia bruta');
  const gastosAdmin = fila(D.resultados.filas, 'total gastos de administracion');
  const gastosVentas = fila(D.resultados.filas, 'total gastos de ventas');
  const gastosOrd = fila(D.resultados.filas, 'total gastos ordinarios');
  const oper = fila(D.resultados.filas, 'utilidad operacional');
  const resultado = fila(D.resultados.filas, 'resultado del periodo');

  const linea = (
    label: string,
    row?: FilaMatriz,
    op: '' | '+' | '(-)' | '=' = '',
    strong?: boolean,
    result?: boolean,
  ) => ({ label, row, op, strong, result });

  const estado = [
    linea('Ingresos ordinarios', ingresos, ''),
    linea('Costo de ventas', costo, '(-)'),
    linea('Ganancia bruta', bruta, '=', true),
    linea('Gastos de administración', gastosAdmin, '(-)'),
    linea('Gastos de ventas', gastosVentas, '(-)'),
    linea('Total gastos ordinarios', gastosOrd, '=', true),
    linea('Utilidad operacional', oper, '=', true),
    linea('Resultado del periodo', resultado, '=', false, true),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BigNum label={`Ingresos ${cols[0]}`} value={fmtCOP(ingresos?.valores[0])} color="text-[var(--color-text-primary)]" />
        <BigNum label={`Ganancia bruta ${cols[0]}`} value={fmtCOP(bruta?.valores[0])} color="text-teal-700" />
        <BigNum label={`Resultado ${cols[0]}`} value={fmtCOP(resultado?.valores[0])} color={(resultado?.valores[0] ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'} hero />
      </div>

      <Card title="Estado de resultados" subtitle={`Comparativo ${cols.join(' vs. ')}`}>
        <div className="mb-3 flex items-center justify-end gap-6 pr-1">
          {cols.map((c, i) => (
            <span key={c} className={`w-32 sm:w-40 text-right text-xs font-semibold uppercase tracking-wide ${i === 0 ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'}`}>{c}</span>
          ))}
        </div>
        <div className="divide-y divide-[var(--color-border-soft)]">
          {estado.map((w) => (
            <div key={w.label} className="flex items-center gap-3 py-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="w-7 shrink-0 text-xs font-semibold text-[var(--color-text-muted)] tabular-nums">{w.op}</span>
                <span className={w.result ? 'text-base font-bold text-[var(--color-text-primary)]' : w.strong ? 'text-sm font-semibold text-[var(--color-text-primary)]' : 'text-sm text-[var(--color-text-secondary)]'}>{w.label}</span>
              </div>
              {(w.row?.valores ?? [null, null]).map((v, i) => (
                <span key={i} className={['w-32 sm:w-40 text-right tabular-nums shrink-0', w.result ? 'text-lg font-bold' : w.strong ? 'text-sm font-bold' : 'text-sm font-medium', (v ?? 0) < 0 ? 'text-rose-600' : w.result && i === 0 ? 'text-emerald-600' : i === 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'].join(' ')}>{fmtCOP(v)}</span>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Detail summary="Ver estado de resultados detallado">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="text-left font-semibold py-2 pr-4 sticky left-0 bg-white whitespace-nowrap">Concepto</th>
                {cols.map((c) => <th key={c} className="text-right font-semibold py-2 px-3 whitespace-nowrap">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {D.resultados.filas.map((r) => {
                const esTotal = /^total|^utilidad|^resultado|^ganancia/i.test(r.concepto);
                const detalle = (r.nivel ?? 0) > 0;
                return (
                  <tr key={r.concepto} className={`border-t border-[var(--color-border-soft)] ${esTotal ? 'font-semibold' : ''}`}>
                    <td className={`text-left py-2 pr-4 sticky left-0 bg-white whitespace-nowrap ${detalle ? 'pl-4 text-[var(--color-text-muted)] italic' : esTotal ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{r.concepto}</td>
                    {r.valores.map((v, i) => <td key={i} className={`text-right py-2 px-3 tabular-nums whitespace-nowrap ${(v ?? 0) < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>{fmtNum(v)}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Detail>
    </div>
  );
}

/* ======================================================================
   BALANCE (ESF comparativo)
   ====================================================================== */
function BalanceTab({ D }: { D: InformeAnualData }) {
  const b = D.balance;
  const cols = D.columnas;
  const ac = b.totalActivoCorriente.valores[0] ?? 0;
  const anc = b.totalActivoNoCorriente.valores[0] ?? 0;
  const pas = b.totalPasivo.valores[0] ?? 0;
  const pat = b.totalPatrimonio.valores[0] ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BigNum label={`Total activo ${cols[0]}`} value={fmtCOP(b.totalActivo.valores[0])} color="text-teal-700" hero />
        <BigNum label={`Total pasivo ${cols[0]}`} value={fmtCOP(b.totalPasivo.valores[0])} color="text-slate-600" />
        <BigNum label={`Total patrimonio ${cols[0]}`} value={fmtCOP(b.totalPatrimonio.valores[0])} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutCard title="Composición del activo" subtitle={`Corriente vs. no corriente (${cols[0]})`} data={[{ label: 'Corriente', value: ac, color: C.brand }, { label: 'No corriente', value: anc, color: C.slate }]} centerLabel="Activo" centerValue={fmtShort(b.totalActivo.valores[0])} />
        <DonutCard title="Estructura de financiación" subtitle={`Cómo se financia la empresa (${cols[0]})`} data={[{ label: 'Pasivo', value: pas, color: C.slate }, { label: 'Patrimonio', value: pat, color: C.emerald }]} centerLabel="Patrimonio" centerValue={fmtPct(pat / (pas + pat || 1))} />
      </div>

      <Detail summary="Ver balance detallado (Estado de Situación Financiera)">
        <div className="mb-3 flex items-center gap-3 pr-1">
          <span className="flex-1" />
          {cols.map((c, i) => (
            <span key={c} className={`w-32 sm:w-40 text-right text-xs font-semibold uppercase tracking-wide ${i === 0 ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'}`}>{c}</span>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8">
          <div className="text-sm">
            <GroupLabel>Activo corriente</GroupLabel>
            {b.activoCorriente.map((it: ItemMulti) => <StRowMulti key={it.concepto} label={it.concepto} values={it.valores} />)}
            <StRowMulti label="Total activo corriente" values={b.totalActivoCorriente.valores} sub />
            <GroupLabel>Activo no corriente</GroupLabel>
            {b.activoNoCorriente.map((it: ItemMulti) => <StRowMulti key={it.concepto} label={it.concepto} values={it.valores} />)}
            <StRowMulti label="Total activo no corriente" values={b.totalActivoNoCorriente.valores} sub />
            <StRowMulti label="Total activo" values={b.totalActivo.valores} total />
          </div>
          <div className="text-sm">
            <GroupLabel>Pasivo corriente</GroupLabel>
            {b.pasivoCorriente.map((it: ItemMulti) => <StRowMulti key={it.concepto} label={it.concepto} values={it.valores} />)}
            <StRowMulti label="Total pasivo corriente" values={b.totalPasivoCorriente.valores} sub />
            {b.pasivoNoCorriente.length > 0 && (
              <>
                <GroupLabel>Pasivo no corriente</GroupLabel>
                {b.pasivoNoCorriente.map((it: ItemMulti) => <StRowMulti key={it.concepto} label={it.concepto} values={it.valores} />)}
                <StRowMulti label="Total pasivo no corriente" values={b.totalPasivoNoCorriente.valores} sub />
              </>
            )}
            <StRowMulti label="Total pasivo" values={b.totalPasivo.valores} sub />
            <GroupLabel>Patrimonio</GroupLabel>
            {b.patrimonio.map((it: ItemMulti) => <StRowMulti key={it.concepto} label={it.concepto} values={it.valores} />)}
            <StRowMulti label="Total patrimonio" values={b.totalPatrimonio.valores} sub />
            <StRowMulti label="Total pasivo y patrimonio" values={b.totalPasivoPatrimonio.valores} total />
          </div>
        </div>
      </Detail>
    </div>
  );
}
