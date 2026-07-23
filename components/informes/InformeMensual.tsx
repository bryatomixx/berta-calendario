'use client';

import { useState } from 'react';
import { Wallet, TrendingUp, Landmark, PiggyBank, ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import {
  fmtCOP,
  fmtShort,
  fmtPct,
  normalizar,
  buscarFila,
  buscarLinea,
  type InformeMensual as InformeMensualData,
  type FilaMatriz,
  type Item,
} from '@/lib/informes';
import {
  C,
  CAT,
  cap,
  fmtNum,
  Card,
  BigNum,
  DonutCard,
  AreaLine,
  MonthlyBars,
  SignedBars,
  GroupLabel,
  StRow,
  Seg,
  Detail,
  MatrixTable,
} from './ui';

/* Informe de periodo abierto (meses): caja y bancos, ERI contable, vision y
   ERI fiscal. Todo se deriva del informe recibido, sin estado global. */

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'eri', label: 'Resultados' },
  { id: 'vision', label: 'Por Visión' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'balance', label: 'Balance' },
  { id: 'caja', label: 'Caja y Bancos' },
] as const;
type TabId = (typeof TABS)[number]['id'];

/** Match exacto: hace falta porque "TOTAL INGRESOS" y "TOTAL INGRESOS OPERA"
    conviven en el mismo ERI y el match por prefijo tomaria la equivocada. */
function filaExacta(filas: FilaMatriz[], nombre: string): FilaMatriz | undefined {
  const key = normalizar(nombre);
  return filas.find((f) => normalizar(f.concepto) === key);
}

export function InformeMensualView({ data: D }: { data: InformeMensualData }) {
  const [tab, setTab] = useState<TabId>('resumen');

  const ingresosRow = filaExacta(D.eriMensual, 'TOTAL INGRESOS');
  const egresosRow = filaExacta(D.eriMensual, 'TOTAL EGRESOS');
  const utilidadRow = buscarFila(D.eriMensual, 'utilidad');
  const operRow = buscarFila(D.eriMensual, 'total ingresos opera');

  const totalIngresos = ingresosRow?.total ?? 0;
  const totalEgresos = Math.abs(egresosRow?.total ?? 0);
  const utilidadNeta = utilidadRow?.total ?? 0;
  const costos = Math.abs(filaExacta(D.eriMensual, 'COSTOS')?.total ?? 0);
  const gastos = Math.abs(buscarFila(D.eriMensual, 'gastos operacionales')?.total ?? 0);

  const gananciaBruta = buscarLinea(D.resultados.lineas, 'ganancia bruta')?.valor ?? 0;
  const ingresosOper = operRow?.total ?? 0;
  const margenBruto = ingresosOper ? gananciaBruta / ingresosOper : 0;
  const margenNeto = totalIngresos ? utilidadNeta / totalIngresos : 0;

  const cajaS = D.cajaBancos.caja.saldo;
  const bancoS = D.cajaBancos.banco.saldo;
  const disponible = (cajaS.acumulado ?? 0) + (bancoS.acumulado ?? 0);
  const totalActivo = D.balance.totalActivo.valor ?? 0;

  // Saldo disponible acumulado (Inicio -> ultimo mes)
  const saldoInicio = (cajaS.saldoAnterior ?? 0) + (bancoS.saldoAnterior ?? 0);
  const saldoAcum: number[] = [];
  {
    let run = saldoInicio;
    for (let i = 0; i < D.meses.length; i++) {
      run += (cajaS.meses[i] ?? 0) + (bancoS.meses[i] ?? 0);
      saldoAcum.push(run);
    }
  }
  const saldoLineValues = [saldoInicio, ...saldoAcum];
  const saldoLineLabels = ['Inicio', ...D.meses.map((m) => m.slice(0, 3))];

  const ctx = {
    D,
    ingresosRow,
    egresosRow,
    utilidadRow,
    totalIngresos,
    totalEgresos,
    utilidadNeta,
    costos,
    gastos,
    margenBruto,
    margenNeto,
    disponible,
    totalActivo,
    saldoLineValues,
    saldoLineLabels,
  };

  return (
    <>
      <div className="no-print mb-6 -mx-1 flex items-center gap-1 overflow-x-auto pb-1">
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

      {/* Todas las pestañas se renderizan siempre: en pantalla se ve solo la
          activa, pero al imprimir (Descargar PDF) se muestran todas, cada una
          en su propia página, para un informe completo. */}
      <Panel id="resumen" tab={tab} title="Resumen"><ResumenTab {...ctx} /></Panel>
      <Panel id="eri" tab={tab} title="Estado de resultados"><ResultadosTab {...ctx} /></Panel>
      <Panel id="vision" tab={tab} title="Por visión"><VisionTab D={D} /></Panel>
      <Panel id="fiscal" tab={tab} title="Fiscal"><FiscalTab D={D} /></Panel>
      <Panel id="balance" tab={tab} title="Balance"><BalanceTab D={D} /></Panel>
      <Panel id="caja" tab={tab} title="Caja y bancos"><CajaTab {...ctx} /></Panel>
    </>
  );
}

/** Contenedor de pestaña: en pantalla solo se muestra la activa; al imprimir,
    todas (cada una arranca en página nueva vía la clase informe-panel). */
function Panel({ id, tab, title, children }: { id: TabId; tab: TabId; title: string; children: React.ReactNode }) {
  const active = id === tab;
  return (
    <section className={`informe-panel ${active ? 'block' : 'hidden print:block'}`}>
      <h2 className="hidden print:block text-xl font-bold text-[var(--color-text-primary)] mb-4 pb-2 border-b border-[var(--color-border)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

type Ctx = {
  D: InformeMensualData;
  ingresosRow?: FilaMatriz;
  egresosRow?: FilaMatriz;
  utilidadRow?: FilaMatriz;
  totalIngresos: number;
  totalEgresos: number;
  utilidadNeta: number;
  costos: number;
  gastos: number;
  margenBruto: number;
  margenNeto: number;
  disponible: number;
  totalActivo: number;
  saldoLineValues: number[];
  saldoLineLabels: string[];
};

/* ======================================================================
   RESUMEN
   ====================================================================== */
function ResumenTab({ D, ingresosRow, egresosRow, utilidadRow, totalIngresos, utilidadNeta, margenBruto, margenNeto, disponible, totalActivo, saldoLineValues, saldoLineLabels }: Ctx) {
  // Lineas de ingreso: todo lo que esta antes del total operacional, mas la
  // bolsa de otros ingresos. Se muestran las 4 mayores y el resto agrupado.
  const iOper = D.eriMensual.findIndex((f) => normalizar(f.concepto).startsWith('total ingresos opera'));
  const otros = D.eriMensual.find((f) => normalizar(f.concepto) === 'otros ingresos');
  const candidatas = [
    ...D.eriMensual.slice(0, iOper < 0 ? 0 : iOper).filter((f) => (f.nivel ?? 0) === 0 && (f.total ?? 0) > 0),
    ...(otros && (otros.total ?? 0) > 0 ? [otros] : []),
  ].sort((a, b) => (b.total ?? 0) - (a.total ?? 0));

  const top = candidatas.slice(0, 4).map((f, i) => ({ label: cap(f.concepto), value: f.total ?? 0, color: CAT[i % CAT.length] }));
  const restoTotal = candidatas.slice(4).reduce((a, f) => a + (f.total ?? 0), 0);
  const lineas = restoTotal > 0 ? [...top, { label: 'Otras líneas', value: restoTotal, color: C.slate2 }] : top;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ingresos del periodo" value={fmtShort(totalIngresos)} icon={TrendingUp} iconBg="bg-teal-50" iconColor="text-teal-600" trend={`Margen bruto ${fmtPct(margenBruto)}`} trendUp />
        <StatCard label="Utilidad neta" value={fmtShort(utilidadNeta)} icon={PiggyBank} iconBg={utilidadNeta >= 0 ? 'bg-emerald-50' : 'bg-rose-50'} iconColor={utilidadNeta >= 0 ? 'text-emerald-600' : 'text-rose-600'} trend={`Margen neto ${fmtPct(margenNeto)}`} trendUp={utilidadNeta >= 0} />
        <StatCard label="Disponible caja + bancos" value={fmtShort(disponible)} icon={Wallet} iconBg="bg-teal-50" iconColor="text-teal-600" trend={`Saldo a ${D.meses[D.meses.length - 1].toLowerCase()}`} trendUp />
        <StatCard label="Total activo" value={fmtShort(totalActivo)} icon={Landmark} iconBg="bg-slate-100" iconColor="text-slate-600" trend={`Corte ${D.corte}`} trendUp />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ingresos vs. egresos" subtitle="Movimiento mensual del periodo">
          <MonthlyBars months={D.meses} series={[{ label: 'Ingresos', values: ingresosRow?.valores ?? [], cls: 'bg-teal-600' }, { label: 'Egresos', values: egresosRow?.valores ?? [], cls: 'bg-slate-300' }]} />
        </Card>
        <Card title="Utilidad por mes" subtitle="Resultado neto mensual">
          <SignedBars months={D.meses} values={utilidadRow?.valores ?? []} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutCard title="Ingresos por línea" subtitle="De dónde viene el ingreso" data={lineas} centerLabel="Ingresos" centerValue={fmtShort(totalIngresos)} />
        <Card title="Saldo disponible" subtitle="Evolución de caja + bancos en el periodo">
          <AreaLine labels={saldoLineLabels} values={saldoLineValues} />
        </Card>
      </div>
    </div>
  );
}

/* ======================================================================
   RESULTADOS (ERI contable)
   ====================================================================== */
function ResultadosTab({ D, utilidadRow, totalIngresos, totalEgresos, utilidadNeta, costos, gastos, margenNeto }: Ctx) {
  const destino = [
    { label: 'Costos', value: costos, color: C.slate },
    { label: 'Gastos', value: gastos, color: C.brand },
    { label: 'Utilidad', value: utilidadNeta, color: C.emerald },
  ];
  const base = totalIngresos || 1;

  const line = (name: string): Item | undefined => buscarLinea(D.resultados.lineas, name);
  const estado: { label: string; item?: Item; op: '' | '+' | '(-)' | '='; strong?: boolean; result?: boolean }[] = [
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BigNum label="Ingresos" value={fmtCOP(totalIngresos)} color="text-[var(--color-text-primary)]" />
        <BigNum label="Egresos (costos + gastos)" value={fmtCOP(totalEgresos)} color="text-rose-600" />
        <BigNum label="Resultado del periodo" value={fmtCOP(utilidadNeta)} color={utilidadNeta >= 0 ? 'text-emerald-600' : 'text-rose-600'} hero />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutCard title="Destino de cada peso de ingreso" subtitle="Cómo se reparte el ingreso total" data={destino} centerLabel="Utilidad" centerValue={fmtPct(margenNeto)} />
        <Card title="Utilidad por mes" subtitle="Resultado neto mensual">
          <SignedBars months={D.meses} values={utilidadRow?.valores ?? []} />
        </Card>
      </div>

      <Card title="Cómo se consume el ingreso" subtitle="Barra proporcional del ingreso total del periodo">
        <div className="flex h-9 rounded-[var(--radius-md)] overflow-hidden">
          <Seg w={(costos / base) * 100} color={C.slate} label="Costos" pct={costos / base} />
          <Seg w={(gastos / base) * 100} color={C.brand} label="Gastos" pct={gastos / base} />
          <Seg w={(utilidadNeta / base) * 100} color={C.emerald} label="Utilidad" pct={utilidadNeta / base} />
        </div>
      </Card>

      <Detail summary="Ver estado de resultados detallado">
        <div className="divide-y divide-[var(--color-border-soft)]">
          {estado.map((w) => {
            const v = w.item?.valor ?? null;
            const neg = (v ?? 0) < 0;
            return (
              <div key={w.label} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 shrink-0 text-xs font-semibold text-[var(--color-text-muted)] tabular-nums">{w.op}</span>
                  <span className={w.result ? 'text-base font-bold text-[var(--color-text-primary)]' : w.strong ? 'text-sm font-semibold text-[var(--color-text-primary)]' : 'text-sm text-[var(--color-text-secondary)]'}>{w.label}</span>
                </div>
                <span className={['tabular-nums shrink-0', w.result ? 'text-lg font-bold' : w.strong ? 'text-sm font-bold' : 'text-sm font-medium', neg ? 'text-rose-600' : w.result ? 'text-emerald-600' : 'text-[var(--color-text-primary)]'].join(' ')}>{fmtCOP(v)}</span>
              </div>
            );
          })}
        </div>
      </Detail>

      <Detail summary="Ver detalle mensual (P&G)">
        <MatrixTable columns={D.meses.map((m) => m.slice(0, 3))} rows={D.eriMensual} />
      </Detail>
    </div>
  );
}

/* ======================================================================
   POR VISIÓN
   ====================================================================== */
function VisionTab({ D }: { D: InformeMensualData }) {
  const filas = D.eriVision.filas;
  const segs = D.eriVision.segmentos;
  const totalIng = buscarFila(filas, 'total ingresos')?.total ?? 0;
  const ingresos = filas
    .filter((f) => ['empezar', 'crear', 'obtener', 'noche'].some((k) => normalizar(f.concepto).startsWith(k)))
    .map((f, i) => ({ label: cap(f.concepto), value: f.total ?? 0, color: CAT[i % CAT.length] }));
  const utilidad = buscarFila(filas, 'utilidad');
  const maxUtil = Math.max(1, ...(utilidad?.valores ?? []).map((v) => Math.abs(v || 0)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutCard title="Ingresos por programa" subtitle="Participación en el ingreso total" data={ingresos} centerLabel="Ingresos" centerValue={fmtShort(totalIng)} />
        <Card title="Utilidad por visión" subtitle="Resultado de cada cohorte (ECO)">
          <div className="space-y-3.5">
            {segs.map((s, i) => {
              const v = utilidad?.valores[i] ?? 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-[var(--color-text-secondary)]">{s}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                    <div className={`h-full rounded-full ${v >= 0 ? 'bg-emerald-500' : 'bg-rose-400'}`} style={{ width: `${(Math.abs(v) / maxUtil) * 100}%` }} />
                  </div>
                  <span className={`w-28 text-right text-sm font-medium tabular-nums ${v < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>{fmtCOP(v)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Detail summary="Ver detalle por visión (tabla)">
        <MatrixTable columns={segs} rows={filas} />
      </Detail>
    </div>
  );
}

/* ======================================================================
   FISCAL (ERI fiscal del periodo + historico por anio)
   ====================================================================== */
function FiscalTab({ D }: { D: InformeMensualData }) {
  const fiscal = D.eriFiscal.filas;
  const hist = D.eriFiscalHistorico.filas;

  const ingFiscal = buscarFila(fiscal, 'total ingresos');
  const utilFiscal = buscarFila(fiscal, 'utilidad');
  const egrFiscal = buscarFila(fiscal, 'total egresos');

  const utilHist = buscarFila(hist, 'utilidad');
  const ingHist = buscarFila(hist, 'total ingresos');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BigNum label="Ingresos fiscales del periodo" value={fmtCOP(ingFiscal?.total)} color="text-[var(--color-text-primary)]" />
        <BigNum label="Egresos fiscales" value={fmtCOP(Math.abs(egrFiscal?.total ?? 0))} color="text-rose-600" />
        <BigNum label="Resultado fiscal" value={fmtCOP(utilFiscal?.total)} color={(utilFiscal?.total ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'} hero />
      </div>

      <Card
        title="Contable vs. fiscal"
        subtitle="La diferencia entre lo que muestra la contabilidad y lo que se declara"
        right={<Scale className="w-5 h-5 text-[var(--color-text-muted)]" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Ingresos contables</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--color-text-primary)]">{fmtCOP(buscarFila(D.eriMensual, 'total ingresos opera')?.total)}</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Ingresos fiscales</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--color-text-primary)]">{fmtCOP(ingFiscal?.total)}</p>
          </div>
        </div>
      </Card>

      <Card title="Resultado fiscal por mes" subtitle="Utilidad o pérdida fiscal mensual">
        <SignedBars months={D.eriFiscal.meses} values={utilFiscal?.valores ?? []} />
      </Card>

      <Detail summary="Ver ERI fiscal mensual (tabla)">
        <MatrixTable columns={D.eriFiscal.meses.map((m) => m.slice(0, 3))} rows={fiscal} />
      </Detail>

      <Card title="Histórico fiscal" subtitle={`Ingresos y resultado por año (${D.eriFiscalHistorico.periodos.join(', ')})`}>
        <div className="space-y-4">
          {D.eriFiscalHistorico.periodos.map((p, i) => {
            const ing = ingHist?.valores[i] ?? 0;
            const util = utilHist?.valores[i] ?? 0;
            const maxIng = Math.max(1, ...(ingHist?.valores ?? []).map((v) => Math.abs(v || 0)));
            return (
              <div key={p} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-[var(--color-text-secondary)]">{cap(p)}</span>
                <div className="flex-1 h-3 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${(Math.abs(ing) / maxIng) * 100}%` }} />
                </div>
                <span className="w-32 text-right text-sm font-medium tabular-nums text-[var(--color-text-primary)]">{fmtNum(ing)}</span>
                <span className={`w-32 text-right text-sm font-semibold tabular-nums ${util < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtNum(util)}</span>
              </div>
            );
          })}
          <p className="text-[11px] text-[var(--color-text-muted)] text-right">Barra e importe: ingresos. Última columna: resultado del año.</p>
        </div>
      </Card>

      <Detail summary="Ver histórico fiscal (tabla)">
        <MatrixTable columns={D.eriFiscalHistorico.periodos} rows={hist} />
      </Detail>
    </div>
  );
}

/* ======================================================================
   BALANCE (ESF)
   ====================================================================== */
function BalanceTab({ D }: { D: InformeMensualData }) {
  const b = D.balance;
  const ac = b.totalActivoCorriente.valor ?? 0;
  const anc = b.totalActivoNoCorriente.valor ?? 0;
  const pas = b.totalPasivo.valor ?? 0;
  const pat = b.totalPatrimonio.valor ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BigNum label="Total activo" value={fmtCOP(b.totalActivo.valor)} color="text-teal-700" hero />
        <BigNum label="Total pasivo" value={fmtCOP(b.totalPasivo.valor)} color="text-slate-600" />
        <BigNum label="Total patrimonio" value={fmtCOP(b.totalPatrimonio.valor)} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutCard title="Composición del activo" subtitle="Corriente vs. no corriente" data={[{ label: 'Corriente', value: ac, color: C.brand }, { label: 'No corriente', value: anc, color: C.slate }]} centerLabel="Activo" centerValue={fmtShort(b.totalActivo.valor)} />
        <DonutCard title="Estructura de financiación" subtitle="Cómo se financia la empresa" data={[{ label: 'Pasivo', value: pas, color: C.slate }, { label: 'Patrimonio', value: pat, color: C.emerald }]} centerLabel="Patrimonio" centerValue={fmtPct(pat / (pas + pat || 1))} />
      </div>

      <Detail summary="Ver balance detallado (Estado de Situación Financiera)">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="text-sm">
            <GroupLabel>Activo corriente</GroupLabel>
            {b.activoCorriente.map((it) => <StRow key={it.concepto} label={it.concepto} value={it.valor} />)}
            <StRow label="Total activo corriente" value={b.totalActivoCorriente.valor} sub />
            <GroupLabel>Activo no corriente</GroupLabel>
            {b.activoNoCorriente.map((it) => <StRow key={it.concepto} label={it.concepto} value={it.valor} />)}
            <StRow label="Total activo no corriente" value={b.totalActivoNoCorriente.valor} sub />
            <StRow label="Total activo" value={b.totalActivo.valor} total />
          </div>
          <div className="text-sm">
            <GroupLabel>Pasivo corriente</GroupLabel>
            {b.pasivoCorriente.map((it) => <StRow key={it.concepto} label={it.concepto} value={it.valor} />)}
            <StRow label="Total pasivo corriente" value={b.totalPasivoCorriente.valor} sub />
            <StRow label="Total pasivo" value={b.totalPasivo.valor} sub />
            <GroupLabel>Patrimonio</GroupLabel>
            {b.patrimonio.map((it) => <StRow key={it.concepto} label={it.concepto} value={it.valor} />)}
            <StRow label="Total patrimonio" value={b.totalPatrimonio.valor} sub />
            <StRow label="Total pasivo y patrimonio" value={b.totalPasivoPatrimonio.valor} total />
          </div>
        </div>
      </Detail>
    </div>
  );
}

/* ======================================================================
   CAJA Y BANCOS
   ====================================================================== */
function CajaTab({ D, disponible, saldoLineValues, saldoLineLabels }: Ctx) {
  const cb = D.cajaBancos;
  const ultimo = D.meses[D.meses.length - 1].toLowerCase();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BigNum label={`Saldo en caja (${ultimo})`} value={fmtCOP(cb.caja.saldo.acumulado)} color="text-teal-700" />
        <BigNum label={`Saldo en bancos (${ultimo})`} value={fmtCOP(cb.banco.saldo.acumulado)} color="text-teal-700" />
        <BigNum label="Disponible total" value={fmtCOP(disponible)} color="text-emerald-600" hero />
      </div>

      <Card title="Saldo disponible" subtitle="Evolución de caja + bancos en el periodo">
        <AreaLine labels={saldoLineLabels} values={saldoLineValues} />
      </Card>

      <FlujoBlock titulo="Caja" meses={D.meses} flujo={cb.caja} />
      <FlujoBlock titulo="Bancos" meses={D.meses} flujo={cb.banco} />
    </div>
  );
}

type FlujoGrupo = InformeMensualData['cajaBancos']['caja'];

function FlujoBlock({ titulo, meses, flujo }: { titulo: string; meses: string[]; flujo: FlujoGrupo }) {
  return (
    <Card
      title={titulo}
      subtitle={`Saldo acumulado a ${meses[meses.length - 1].toLowerCase()}: ${fmtCOP(flujo.saldo.acumulado)}`}
      right={
        <span className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${(flujo.saldo.total ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {(flujo.saldo.total ?? 0) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {fmtCOP(flujo.saldo.total)} en el periodo
        </span>
      }
    >
      <MonthlyBars months={meses} series={[{ label: 'Ingresos', values: flujo.ingresos.meses, cls: 'bg-teal-600' }, { label: 'Egresos', values: flujo.egresos.meses, cls: 'bg-slate-300' }]} />
      <Detail summary="Ver tabla mensual" flush>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="text-left font-semibold py-2 pr-4 sticky left-0 bg-white">Concepto</th>
                {meses.map((m) => <th key={m} className="text-right font-semibold py-2 px-2 whitespace-nowrap">{m.slice(0, 3)}</th>)}
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
      </Detail>
    </Card>
  );
}

function FlujoRow({ label, flujo, bold }: { label: string; flujo: { meses: (number | null)[]; total: number | null }; bold?: boolean }) {
  return (
    <tr className={`border-t border-[var(--color-border-soft)] ${bold ? 'font-semibold' : ''}`}>
      <td className={`text-left py-2 pr-4 sticky left-0 bg-white ${bold ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{label}</td>
      {flujo.meses.map((v, i) => <td key={i} className={`text-right py-2 px-2 tabular-nums whitespace-nowrap ${(v ?? 0) < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>{fmtNum(v)}</td>)}
      <td className={`text-right py-2 pl-3 tabular-nums whitespace-nowrap font-semibold ${(flujo.total ?? 0) < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>{fmtNum(flujo.total)}</td>
    </tr>
  );
}
