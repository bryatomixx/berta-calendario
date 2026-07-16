import data from '@/data/informes-2026.json';

/* -------------------------------------------------------------------------
   Tipos de los informes financieros (Espacio Consciente ECO SAS, 2026).
   La data viene de data/informes-2026.json, generada a partir de los Excel
   del cliente (Caja/Bancos, ERI mensual, ERI por vision, EEFF corte jun-2026).
   ---------------------------------------------------------------------- */

export interface Flujo {
  saldoAnterior: number | null;
  meses: (number | null)[];
  total: number | null;
  acumulado: number | null;
}

export interface CajaBancos {
  caja:  { ingresos: Flujo; egresos: Flujo; saldo: Flujo };
  banco: { ingresos: Flujo; egresos: Flujo; saldo: Flujo };
}

export interface FilaMensual {
  concepto: string;
  meses: (number | null)[];
  total: number | null;
  participacion: string;
}

export interface FilaVision {
  concepto: string;
  valores: (number | null)[];
  total: number | null;
  participacion: string;
}

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

export interface Informes {
  empresa: string;
  periodo: string;
  corte: string;
  moneda: string;
  meses: string[];
  cajaBancos: CajaBancos;
  eriMensual: FilaMensual[];
  eriVision: { segmentos: string[]; filas: FilaVision[] };
  balance: Balance;
  resultados: { lineas: Item[] };
}

export const informes = data as unknown as Informes;

/* ----- Formato ----- */

const cop0 = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Formato moneda COP completo: 210.239.305 -> "$ 210.239.305". null -> punto. */
export function fmtCOP(n: number | null | undefined): string {
  if (n == null) return '·';
  return cop0.format(n).replace('COP', '').replace(/ /g, ' ').trim();
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

export const sum = (arr: (number | null)[]): number =>
  arr.reduce<number>((a, b) => a + (b || 0), 0);

/** Busca una fila del ERI mensual por nombre (match laxo). */
export function filaMensual(nombre: string): FilaMensual | undefined {
  const key = nombre.toLowerCase();
  return informes.eriMensual.find((f) => f.concepto.toLowerCase().startsWith(key));
}

/** Busca una linea del ERI formal por nombre (match laxo). */
export function lineaResultado(nombre: string): Item | undefined {
  const key = nombre.toLowerCase();
  return informes.resultados.lineas.find((l) => l.concepto.toLowerCase().startsWith(key));
}
