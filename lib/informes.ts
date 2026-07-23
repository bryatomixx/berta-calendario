import ecoData from '@/data/informes/espacio-consciente-eco-sas.json';

/* -------------------------------------------------------------------------
   Informes financieros por cliente.

   Cada informe pertenece a UN cliente (clienteId = id en la cartera) y se
   genera desde los Excel que manda el cliente con scripts/build-informes.cjs.
   Un informe "mensual" cubre un periodo abierto por meses, con caja y bancos,
   ERI por mes, ERI por vision y ERI fiscal (caso de Espacio Consciente ECO SAS).
   ---------------------------------------------------------------------- */

/** Fila de una matriz concepto x periodos (mes, cohorte o anio). */
export interface FilaMatriz {
  concepto: string;
  /** 0 = linea principal, 1 = desglose de la linea de arriba. */
  nivel?: number;
  valores: (number | null)[];
  total: number | null;
  /** Fraccion sobre el ingreso (0.42), no porcentaje ya formateado. */
  participacion: number | null;
}

export interface Flujo {
  saldoAnterior: number | null;
  meses: (number | null)[];
  total: number | null;
  acumulado: number | null;
}

export interface CajaBancos {
  caja: { ingresos: Flujo; egresos: Flujo; saldo: Flujo };
  banco: { ingresos: Flujo; egresos: Flujo; saldo: Flujo };
}

/** Linea de un estado financiero de una sola columna. */
export interface Item {
  concepto: string;
  valor: number | null;
}

export interface Balance {
  activoCorriente: Item[];
  totalActivoCorriente: Item;
  activoNoCorriente: Item[];
  totalActivoNoCorriente: Item;
  totalActivo: Item;
  pasivoCorriente: Item[];
  totalPasivoCorriente: Item;
  totalPasivoNoCorriente: Item;
  totalPasivo: Item;
  patrimonio: Item[];
  totalPatrimonio: Item;
  totalPasivoPatrimonio: Item;
}

export interface Fuente {
  archivo: string;
  hoja: string;
  seccion: string;
}

interface InformeBase {
  clienteId: string;
  empresa: string;
  periodo: string;
  corte: string;
  moneda: string;
  fuentes: Fuente[];
}

export interface InformeMensual extends InformeBase {
  tipo: 'mensual';
  meses: string[];
  cajaBancos: CajaBancos;
  eriMensual: FilaMatriz[];
  eriVision: { segmentos: string[]; filas: FilaMatriz[] };
  eriFiscal: { meses: string[]; filas: FilaMatriz[] };
  eriFiscalHistorico: { periodos: string[]; filas: FilaMatriz[] };
  balance: Balance;
  resultados: { lineas: Item[] };
}

export type Informe = InformeMensual;

/* ----- Registro ----- */

export const INFORMES: Informe[] = [
  ecoData as unknown as InformeMensual,
];

/** Ids de los clientes que tienen al menos un informe cargado. */
export const CLIENTES_CON_INFORME: string[] = [...new Set(INFORMES.map((i) => i.clienteId))];

export function tieneInforme(clienteId: string): boolean {
  return CLIENTES_CON_INFORME.includes(clienteId);
}

export function informesDeCliente(clienteId: string): Informe[] {
  return INFORMES.filter((i) => i.clienteId === clienteId);
}

/** Informe de un cliente; si no se pasa cliente, el primero del registro. */
export function getInforme(clienteId?: string | null): Informe {
  if (!clienteId) return INFORMES[0];
  return INFORMES.find((i) => i.clienteId === clienteId) ?? INFORMES[0];
}

/* ----- Formato ----- */

const cop0 = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Formato moneda COP completo: 210239305 -> "$ 210.239.305". null -> punto. */
export function fmtCOP(n: number | null | undefined): string {
  if (n == null) return '·';
  return cop0.format(n).replace('COP', '').replace(/ /g, ' ').trim();
}

/** Formato compacto para KPIs: 210239305 -> "$210,2 M". */
export function fmtShort(n: number | null | undefined): string {
  if (n == null) return '·';
  const a = Math.abs(n);
  const s = n < 0 ? '-' : '';
  if (a >= 1_000_000_000) return `${s}$${(a / 1_000_000_000).toFixed(1).replace('.', ',')} MM`;
  if (a >= 1_000_000)     return `${s}$${(a / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (a >= 1_000)         return `${s}$${Math.round(a / 1_000)} K`;
  return fmtCOP(n);
}

/** Fraccion -> porcentaje corto. Debajo del 1% se marca "<1%" y no "0%". */
export function fmtPct(x: number | null | undefined): string {
  if (x == null) return '';
  const p = x * 100;
  if (p !== 0 && Math.abs(p) < 1) return p > 0 ? '<1%' : '>-1%';
  return `${p.toFixed(0)}%`;
}

export const sum = (arr: (number | null)[]): number =>
  arr.reduce<number>((a, b) => a + (b || 0), 0);

/* ----- Busquedas laxas dentro de un informe ----- */

/** Busca una fila de una matriz por nombre (match por prefijo, sin acentos). */
export function buscarFila(filas: FilaMatriz[], nombre: string): FilaMatriz | undefined {
  const key = normalizar(nombre);
  return filas.find((f) => normalizar(f.concepto).startsWith(key));
}

/** Busca una linea de un estado de resultados de una sola columna. */
export function buscarLinea(lineas: Item[], nombre: string): Item | undefined {
  const key = normalizar(nombre);
  return lineas.find((l) => normalizar(l.concepto).startsWith(key));
}

export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}
