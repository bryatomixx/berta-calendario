'use client';

import { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  Landmark,
  PiggyBank,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import {
  informes as D,
  fmtCOP,
  fmtShort,
  filaMensual,
  lineaResultado,
  type FilaMensual,
  type FilaVision,
  type Item,
} from '@/lib/informes';

/* ---------- Derivados (a nivel de modulo: la data es estatica) ---------- */
const nf = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const fmtNum = (n: number | null | undefined): string => (n == null ? '·' : nf.format(n));
const pctFmt = (x: number): string => `${(x * 100).toFixed(0)}%`;

const ingresosRow = filaMensual('total ingresos');
const egresosRow = filaMensual('total egresos');
const utilidadRow = filaMensual('utilidad');

const totalIngresos = ingresosRow?.total ?? 0;
const utilidadNeta = utilidadRow?.total ?? 0;
const gananciaBruta = lineaResultado('ganancia bruta')?.valor ?? 0;
const ingresosOper = lineaResultado('servicios')?.valor ?? 0;
const margenBruto = ingresosOper ? gananciaBruta / ingresosOper : 0;
const margenNeto = totalIngresos ? utilidadNeta / totalIngresos : 0;
const disponible =
  (D.cajaBancos.caja.saldo.acumulado ?? 0) + (D.cajaBancos.banco.saldo.acumulado ?? 0);
const totalActivo = D.balance.totalActivo.valor ?? 0;

const periodoLabel = `${D.meses[0]} a ${D.meses[D.meses.length - 1].toLowerCase()} de 2026`;

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'eri', label: 'Resultados' },
  { id: 'vision', label: 'Por Visión' },
  { id: 'balance', label: 'Balance' },
  { id: 'caja', label: 'Caja y Bancos' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function InformesPage() {
  const [tab, setTab] = useState<TabId>('resumen');

  return (
    <div className="animate-slide-up-fade">
      <PageHeader
        title="Informes Financieros"
        subtitle={`${D.empresa} · ${periodoLabel}`}
        actions={
          <span className="hidden sm:inline-flex items-center rounded-[var(--radius-full)] bg-[var(--color-teal-50)] px-3 py-1.5 text-xs font-semibold text-[var(--color-teal-700)]">
            Corte {D.corte}
          </span>
        }
      />

      {/* Tabs */}
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

      {tab === 'resumen' && <ResumenTab />}
      {tab === 'eri' && <ResultadosTab />}
      {tab === 'vision' && <VisionTab />}
      {tab === 'balance' && <BalanceTab />}
      {tab === 'caja' && <CajaTab />}

      <p className="mt-8 text-center text-[11px] text-[var(--color-text-muted)]">
        Cifras en pesos colombianos (COP). Fuente: reportes contables del cliente.
        <br />
        © BVR Asesorias · Informe generado para revisión interna.
      </p>
    </div>
  );
}

/* ======================================================================
   TAB · RESUMEN
   ====================================================================== */
function ResumenTab() {
  const ingresosMes = ingresosRow?.meses ?? [];
  const egresosMes = egresosRow?.meses ?? [];
  const utilidadMes = utilidadRow?.meses ?? [];

  const ingresosLinea = D.eriMensual.filter(
    (f) =>
      ['entrenamiento', 'otros', 'capacitacion', 'finanzas'].some((k) =>
        f.concepto.toLowerCase().startsWith(k),
      ) && (f.total ?? 0) > 0,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ingresos del periodo"
          value={fmtShort(totalIngresos)}
          icon={TrendingUp}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          trend={`${fmtCOP(totalIngresos)} totales`}
          trendUp
        />
        <StatCard
          label="Utilidad neta"
          value={fmtShort(utilidadNeta)}
          icon={PiggyBank}
          iconBg={utilidadNeta >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}
          iconColor={utilidadNeta >= 0 ? 'text-emerald-600' : 'text-rose-600'}
          trend={`Margen neto ${pctFmt(margenNeto)}`}
          trendUp={utilidadNeta >= 0}
        />
        <StatCard
          label="Disponible caja + bancos"
          value={fmtShort(disponible)}
          icon={Wallet}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          trend="Saldo acumulado a junio"
          trendUp
        />
        <StatCard
          label="Total activo"
          value={fmtShort(totalActivo)}
          icon={Landmark}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          trend={`Margen bruto ${pctFmt(margenBruto)}`}
          trendUp
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ingresos vs. egresos" subtitle="Movimiento mensual del periodo">
          <MonthlyBars
            months={D.meses}
            series={[
              { label: 'Ingresos', values: ingresosMes, cls: 'bg-teal-600' },
              { label: 'Egresos', values: egresosMes, cls: 'bg-slate-300' },
            ]}
          />
        </Card>

        <Card title="Utilidad por mes" subtitle="Resultado neto mensual (verde positivo, rojo negativo)">
          <SignedBars months={D.meses} values={utilidadMes} />
        </Card>
      </div>

      <Card title="Ingresos por línea de negocio" subtitle="Composición del ingreso total del periodo">
        <div className="space-y-3.5">
          {ingresosLinea.map((f) => (
            <HBar
              key={f.concepto}
              label={cap(f.concepto)}
              value={f.total}
              pct={totalIngresos ? ((f.total ?? 0) / totalIngresos) * 100 : 0}
              cls="bg-teal-600"
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ======================================================================
   TAB · RESULTADOS (ERI)
   ====================================================================== */
function ResultadosTab() {
  const line = (name: string): Item | undefined => lineaResultado(name);
  const waterfall: { label: string; item?: Item; op: '' | '+' | '(-)' | '='; strong?: boolean; result?: boolean }[] = [
    { label: 'Ingresos operacionales', item: line('servicios'), op: '' },
    { label: 'Costo de ventas', item: line('costo'), op: '(-)' },
    { label: 'Ganancia bruta', item: line('ganancia bruta'), op: '=', strong: true },
    { label: 'Gastos ordinarios', item: line('gastos'), op: '(-)' },
    { label: 'Utilidad operacional', item: line('utilidad operacional'), op: '=', strong: true },
    { label: 'Otros ingresos', item: line('otros'), op: '+' },
    { label: 'Resultado del periodo', item: line('resultado'), op: '=', result: true },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Estado de Resultados"
        subtitle={`${D.empresa} · corte ${D.corte}`}
        right={
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Margen bruto
            </p>
            <p className="text-lg font-bold text-teal-600 tabular-nums">{pctFmt(margenBruto)}</p>
          </div>
        }
      >
        <div className="divide-y divide-[var(--color-border-soft)]">
          {waterfall.map((w) => {
            const v = w.item?.valor ?? null;
            const neg = (v ?? 0) < 0;
            return (
              <div
                key={w.label}
                className={[
                  'flex items-center justify-between gap-4 py-3',
                  w.result ? 'mt-1' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 shrink-0 text-xs font-semibold text-[var(--color-text-muted)] tabular-nums">
                    {w.op}
                  </span>
                  <span
                    className={
                      w.result
                        ? 'text-base font-bold text-[var(--color-text-primary)]'
                        : w.strong
                          ? 'text-sm font-semibold text-[var(--color-text-primary)]'
                          : 'text-sm text-[var(--color-text-secondary)]'
                    }
                  >
                    {w.label}
                  </span>
                </div>
                <span
                  className={[
                    'tabular-nums shrink-0',
                    w.result ? 'text-lg font-bold' : w.strong ? 'text-sm font-bold' : 'text-sm font-medium',
                    neg ? 'text-rose-600' : w.result ? 'text-emerald-600' : 'text-[var(--color-text-primary)]',
                  ].join(' ')}
                >
                  {fmtCOP(v)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Detalle mensual (P&G)" subtitle="Ingresos, costos, gastos y resultado por mes">
        <MatrixTable columns={D.meses.map((m) => m.slice(0, 3))} rows={mensualAdapter(D.eriMensual)} />
      </Card>
    </div>
  );
}

/* ======================================================================
   TAB · POR VISIÓN
   ====================================================================== */
function VisionTab() {
  const filas = D.eriVision.filas;
  const segs = D.eriVision.segmentos;
  const totalIng = filas.find((f) => f.concepto.toLowerCase().startsWith('total ingresos'))?.total ?? 0;
  const ingresos = filas.filter((f) =>
    ['empezar', 'crear', 'obtener', 'noche'].some((k) => f.concepto.toLowerCase().startsWith(k)),
  );
  const utilidad = filas.find((f) => f.concepto.toLowerCase().startsWith('utilidad'));
  const maxUtil = Math.max(1, ...(utilidad?.valores ?? []).map((v) => Math.abs(v || 0)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ingresos por programa" subtitle="Participación en el ingreso total">
          <div className="space-y-3.5">
            {ingresos.map((f) => (
              <HBar
                key={f.concepto}
                label={cap(f.concepto)}
                value={f.total}
                pct={totalIng ? ((f.total ?? 0) / totalIng) * 100 : 0}
                cls="bg-teal-600"
              />
            ))}
          </div>
        </Card>

        <Card title="Utilidad por visión" subtitle="Resultado de cada cohorte (ECO)">
          <div className="space-y-3.5">
            {segs.map((s, i) => {
              const v = utilidad?.valores[i] ?? 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-[var(--color-text-secondary)]">{s}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${v >= 0 ? 'bg-emerald-500' : 'bg-rose-400'}`}
                      style={{ width: `${(Math.abs(v) / maxUtil) * 100}%` }}
                    />
                  </div>
                  <span
                    className={`w-28 text-right text-sm font-medium tabular-nums ${v < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}
                  >
                    {fmtCOP(v)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Detalle por visión" subtitle="Ingresos, egresos y utilidad por cohorte ECO">
        <MatrixTable columns={segs} rows={visionAsMatrix(filas)} />
      </Card>
    </div>
  );
}

/* ======================================================================
   TAB · BALANCE (ESF)
   ====================================================================== */
function BalanceTab() {
  const b = D.balance;
  const ac = b.totalActivoCorriente.valor ?? 0;
  const anc = b.totalActivoNoCorriente.valor ?? 0;
  const pas = b.totalPasivo.valor ?? 0;
  const pat = b.totalPatrimonio.valor ?? 0;
  const totalFin = pas + pat || 1;
  const totalAct = ac + anc || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activo */}
        <Card title="Activo" subtitle={`Total ${fmtCOP(b.totalActivo.valor)}`}>
          <div className="text-sm">
            <GroupLabel>Activo corriente</GroupLabel>
            {b.activoCorriente.map((it) => (
              <StRow key={it.concepto} label={it.concepto} value={it.valor} />
            ))}
            <StRow label="Total activo corriente" value={b.totalActivoCorriente.valor} sub />
            <GroupLabel>Activo no corriente</GroupLabel>
            {b.activoNoCorriente.map((it) => (
              <StRow key={it.concepto} label={it.concepto} value={it.valor} />
            ))}
            <StRow label="Total activo no corriente" value={b.totalActivoNoCorriente.valor} sub />
            <StRow label="Total activo" value={b.totalActivo.valor} total />
          </div>
        </Card>

        {/* Pasivo + Patrimonio */}
        <Card title="Pasivo y patrimonio" subtitle={`Total ${fmtCOP(b.totalPasivoPatrimonio.valor)}`}>
          <div className="text-sm">
            <GroupLabel>Pasivo corriente</GroupLabel>
            {b.pasivoCorriente.map((it) => (
              <StRow key={it.concepto} label={it.concepto} value={it.valor} />
            ))}
            <StRow label="Total pasivo corriente" value={b.totalPasivoCorriente.valor} sub />
            <StRow label="Total pasivo" value={b.totalPasivo.valor} sub />
            <GroupLabel>Patrimonio</GroupLabel>
            {b.patrimonio.map((it) => (
              <StRow key={it.concepto} label={it.concepto} value={it.valor} />
            ))}
            <StRow label="Total patrimonio" value={b.totalPatrimonio.valor} sub />
            <StRow label="Total pasivo y patrimonio" value={b.totalPasivoPatrimonio.valor} total />
          </div>
        </Card>
      </div>

      <Card title="Estructura financiera" subtitle="Cómo se compone el activo y cómo se financia">
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1.5">
              <span>Composición del activo</span>
            </div>
            <div className="flex h-7 rounded-[var(--radius-md)] overflow-hidden">
              <Seg w={(ac / totalAct) * 100} cls="bg-teal-600" label="Corriente" pct={ac / totalAct} />
              <Seg w={(anc / totalAct) * 100} cls="bg-teal-300" label="No corriente" pct={anc / totalAct} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1.5">
              <span>Estructura de financiación</span>
            </div>
            <div className="flex h-7 rounded-[var(--radius-md)] overflow-hidden">
              <Seg w={(pas / totalFin) * 100} cls="bg-slate-400" label="Pasivo" pct={pas / totalFin} />
              <Seg w={(pat / totalFin) * 100} cls="bg-emerald-500" label="Patrimonio" pct={pat / totalFin} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ======================================================================
   TAB · CAJA Y BANCOS
   ====================================================================== */
function CajaTab() {
  const cb = D.cajaBancos;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Saldo en caja (jun)" value={fmtShort(cb.caja.saldo.acumulado)} icon={Wallet} iconBg="bg-teal-50" iconColor="text-teal-600" />
        <StatCard label="Saldo en bancos (jun)" value={fmtShort(cb.banco.saldo.acumulado)} icon={Landmark} iconBg="bg-teal-50" iconColor="text-teal-600" />
        <StatCard label="Disponible total" value={fmtShort(disponible)} icon={PiggyBank} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      <FlujoBlock titulo="Caja" flujo={cb.caja} />
      <FlujoBlock titulo="Bancos" flujo={cb.banco} />
    </div>
  );
}

function FlujoBlock({ titulo, flujo }: { titulo: string; flujo: (typeof D.cajaBancos)['caja'] }) {
  return (
    <Card
      title={titulo}
      subtitle={`Saldo acumulado a junio: ${fmtCOP(flujo.saldo.acumulado)}`}
      right={
        <span
          className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${(flujo.saldo.total ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
        >
          {(flujo.saldo.total ?? 0) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {fmtCOP(flujo.saldo.total)} en el periodo
        </span>
      }
    >
      <MonthlyBars
        months={D.meses}
        series={[
          { label: 'Ingresos', values: flujo.ingresos.meses, cls: 'bg-teal-600' },
          { label: 'Egresos', values: flujo.egresos.meses, cls: 'bg-slate-300' },
        ]}
      />
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[var(--color-text-muted)]">
              <th className="text-left font-semibold py-2 pr-4 sticky left-0 bg-white">Concepto</th>
              {D.meses.map((m) => (
                <th key={m} className="text-right font-semibold py-2 px-2 whitespace-nowrap">{m.slice(0, 3)}</th>
              ))}
              <th className="text-right font-semibold py-2 pl-3 whitespace-nowrap">Total</th>
            </tr>
          </thead>
          <tbody>
            <FlujoRow label="Ingresos" flujo={flujo.ingresos} />
            <FlujoRow label="Egresos" flujo={flujo.egresos} />
            <FlujoRow label="Saldo neto" flujo={flujo.saldo} bold />
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function FlujoRow({ label, flujo, bold }: { label: string; flujo: { meses: (number | null)[]; total: number | null }; bold?: boolean }) {
  return (
    <tr className={`border-t border-[var(--color-border-soft)] ${bold ? 'font-semibold' : ''}`}>
      <td className={`text-left py-2 pr-4 sticky left-0 bg-white ${bold ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{label}</td>
      {flujo.meses.map((v, i) => (
        <td key={i} className={`text-right py-2 px-2 tabular-nums whitespace-nowrap ${(v ?? 0) < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>
          {fmtNum(v)}
        </td>
      ))}
      <td className={`text-right py-2 pl-3 tabular-nums whitespace-nowrap font-semibold ${(flujo.total ?? 0) < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>
        {fmtNum(flujo.total)}
      </td>
    </tr>
  );
}

/* ======================================================================
   Componentes reutilizables
   ====================================================================== */
function Card({
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

function MonthlyBars({
  months,
  series,
}: {
  months: string[];
  series: { label: string; values: (number | null)[]; cls: string }[];
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.values.map((v) => Math.abs(v || 0))));
  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-4 h-48">
        {months.map((m, i) => (
          <div key={m} className="flex-1 flex flex-col items-center gap-2 h-full min-w-0">
            <div className="w-full flex-1 flex items-end justify-center gap-1">
              {series.map((s) => {
                const v = Math.abs(s.values[i] || 0);
                return (
                  <div
                    key={s.label}
                    title={`${s.label}: ${fmtCOP(s.values[i])}`}
                    className={`w-2.5 sm:w-4 rounded-t ${s.cls}`}
                    style={{ height: `${(v / max) * 100}%` }}
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">{m.slice(0, 3)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-5 mt-3">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <span className={`w-2.5 h-2.5 rounded-sm ${s.cls}`} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SignedBars({ months, values }: { months: string[]; values: (number | null)[] }) {
  const max = Math.max(1, ...values.map((v) => Math.abs(v || 0)));
  return (
    <div className="flex items-stretch gap-2 sm:gap-4 h-52">
      {months.map((m, i) => {
        const v = values[i] || 0;
        const h = (Math.abs(v) / max) * 100;
        return (
          <div key={m} className="flex-1 flex flex-col items-center min-w-0">
            <div className="flex-1 w-full flex items-end justify-center">
              {v > 0 && <div className="w-3.5 sm:w-5 rounded-t bg-emerald-500" style={{ height: `${h}%` }} title={fmtCOP(v)} />}
            </div>
            <div className="w-full h-px bg-[var(--color-border)]" />
            <div className="flex-1 w-full flex items-start justify-center">
              {v < 0 && <div className="w-3.5 sm:w-5 rounded-b bg-rose-400" style={{ height: `${h}%` }} title={fmtCOP(v)} />}
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] mt-1">{m.slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

function HBar({ label, value, pct, cls }: { label: string; value: number | null; pct: number; cls: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 sm:w-44 text-sm text-[var(--color-text-secondary)] truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 h-2.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
        <div className={`h-full rounded-full ${cls}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <span className="w-24 sm:w-28 text-right text-sm font-medium tabular-nums text-[var(--color-text-primary)]">
        {fmtCOP(value)}
      </span>
      <span className="w-9 text-right text-xs text-[var(--color-text-muted)] tabular-nums">{Math.round(pct)}%</span>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mt-4 first:mt-0 mb-1">
      {children}
    </p>
  );
}

function StRow({ label, value, sub, total }: { label: string; value: number | null; sub?: boolean; total?: boolean }) {
  const neg = (value ?? 0) < 0;
  return (
    <div
      className={[
        'flex items-center justify-between gap-4 py-1.5',
        total ? 'mt-1 border-t-2 border-[var(--color-border)] pt-2.5' : sub ? 'border-t border-[var(--color-border-soft)] pt-2 mt-1' : '',
      ].join(' ')}
    >
      <span
        className={
          total
            ? 'text-sm font-bold text-[var(--color-text-primary)]'
            : sub
              ? 'text-sm font-semibold text-[var(--color-text-primary)]'
              : 'text-sm text-[var(--color-text-secondary)]'
        }
      >
        {label}
      </span>
      <span
        className={[
          'tabular-nums shrink-0',
          total ? 'text-base font-bold text-teal-700' : sub ? 'text-sm font-semibold' : 'text-sm font-medium',
          neg ? 'text-rose-600' : total ? 'text-teal-700' : 'text-[var(--color-text-primary)]',
        ].join(' ')}
      >
        {fmtCOP(value)}
      </span>
    </div>
  );
}

function Seg({ w, cls, label, pct }: { w: number; cls: string; label: string; pct: number }) {
  if (w <= 0) return null;
  return (
    <div
      className={`${cls} flex items-center justify-center text-white text-[11px] font-semibold`}
      style={{ width: `${w}%` }}
      title={`${label}: ${pctFmt(pct)}`}
    >
      {w > 12 ? `${label} ${pctFmt(pct)}` : ''}
    </div>
  );
}

/* Tabla matriz generica: concepto + N columnas + total + %  */
function MatrixTable({ columns, rows }: { columns: string[]; rows: MatrixRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-[var(--color-text-muted)]">
            <th className="text-left font-semibold py-2 pr-4 sticky left-0 bg-white whitespace-nowrap">Concepto</th>
            {columns.map((c) => (
              <th key={c} className="text-right font-semibold py-2 px-2 whitespace-nowrap">{c}</th>
            ))}
            <th className="text-right font-semibold py-2 px-2 whitespace-nowrap">Total</th>
            <th className="text-right font-semibold py-2 pl-2 whitespace-nowrap">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const kind = rowKind(r.concepto);
            const strong = kind === 'subIn' || kind === 'subEg' || kind === 'result';
            const rowCls =
              kind === 'result'
                ? 'bg-[var(--color-teal-50)]/60 font-bold'
                : strong
                  ? 'font-semibold border-t border-[var(--color-border)]'
                  : 'border-t border-[var(--color-border-soft)]';
            return (
              <tr key={r.concepto} className={rowCls}>
                <td
                  className={`text-left py-2 pr-4 sticky left-0 whitespace-nowrap ${kind === 'result' ? 'bg-[#fdf0f0]' : 'bg-white'} ${strong ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}
                >
                  {cap(r.concepto)}
                </td>
                {r.valores.map((v, i) => (
                  <td key={i} className={`text-right py-2 px-2 tabular-nums whitespace-nowrap ${(v ?? 0) < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>
                    {fmtNum(v)}
                  </td>
                ))}
                <td className={`text-right py-2 px-2 tabular-nums whitespace-nowrap font-semibold ${(r.total ?? 0) < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>
                  {fmtNum(r.total)}
                </td>
                <td className="text-right py-2 pl-2 tabular-nums whitespace-nowrap text-[var(--color-text-muted)]">{r.participacion || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- helpers de datos / formato ---------- */
type MatrixRow = { concepto: string; valores: (number | null)[]; total: number | null; participacion: string };

function visionAsMatrix(filas: FilaVision[]): MatrixRow[] {
  return filas
    .filter((f) => f.concepto && (f.total != null || f.valores.some((v) => v != null)))
    .map((f) => ({ concepto: f.concepto, valores: f.valores, total: f.total, participacion: f.participacion }));
}

// Las filas mensuales ya tienen `meses`; MatrixTable espera `valores`.
function mensualAdapter(rows: FilaMensual[]): MatrixRow[] {
  return rows.map((f) => ({ concepto: f.concepto, valores: f.meses, total: f.total, participacion: f.participacion }));
}

function rowKind(c: string): 'subIn' | 'subEg' | 'result' | 'egreso' | 'item' {
  const s = c.toLowerCase();
  if (s.startsWith('total ingresos')) return 'subIn';
  if (s.startsWith('total egresos')) return 'subEg';
  if (s.startsWith('utilidad') || s.includes('pérdida')) return 'result';
  if (s.startsWith('costos') || s.startsWith('gastos')) return 'egreso';
  return 'item';
}

function cap(s: string): string {
  const t = s.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
