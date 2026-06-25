import type {
  CalculoVencimiento,
  Cliente,
  Obligacion,
  Calendario,
  Vencimiento,
  VencimientoCalculado,
  EstadoSemaforo,
} from "./types";

export function obtenerDigitoClave(
  nit: string,
  calculo: CalculoVencimiento
): string {
  const soloDigitos = nit.replace(/\D/g, "");
  if (calculo === "ultimo_1") {
    return soloDigitos.slice(-1);
  }
  // ultimo_2: padded last 2 digits
  const dos = soloDigitos.slice(-2).padStart(2, "0");
  // map "00" → range "99-00"; otherwise pair (n-1)-(n) where n is even, or (n)-(n+1) where n is odd
  if (dos === "00") return "99-00";
  const n = parseInt(dos, 10);
  if (n % 2 === 0) {
    const lo = String(n - 1).padStart(2, "0");
    const hi = String(n).padStart(2, "0");
    return `${lo}-${hi}`;
  } else {
    const lo = String(n).padStart(2, "0");
    const hi = String(n + 1).padStart(2, "0");
    return `${lo}-${hi}`;
  }
}

function diasEntre(desde: Date, hasta: Date): number {
  const ms = hasta.getTime() - desde.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function fechaParaVencimiento(
  cliente: Cliente,
  obligacion: Obligacion,
  vencimiento: Vencimiento
): Date | null {
  const clave = obtenerDigitoClave(cliente.nit, obligacion.calculo);
  const dia = vencimiento.fechas[clave];
  if (dia === undefined) return null;
  return new Date(vencimiento.anio, vencimiento.mes - 1, dia);
}

export function obtenerProximoVencimiento(
  cliente: Cliente,
  obligacion: Obligacion,
  fechaHoy: Date
): VencimientoCalculado | null {
  const hoy = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), fechaHoy.getDate());
  const candidatos = obligacion.vencimientos
    .map((v) => {
      const fecha = fechaParaVencimiento(cliente, obligacion, v);
      if (!fecha) return null;
      return { v, fecha };
    })
    .filter((x): x is { v: Vencimiento; fecha: Date } => x !== null)
    .filter((x) => x.fecha >= hoy)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  if (candidatos.length === 0) return null;
  const { v, fecha } = candidatos[0];
  return {
    obligacionId: obligacion.id,
    obligacionNombre: obligacion.nombre,
    etapa: v.etapa,
    periodo: v.periodo,
    fecha,
    diasFaltantes: diasEntre(hoy, fecha),
  };
}

export function obtenerVencimientosFuturos(
  cliente: Cliente,
  calendario: Calendario,
  fechaHoy: Date
): VencimientoCalculado[] {
  return calendario.obligaciones
    .filter((o) => cliente.obligacionesActivas.includes(o.id))
    .map((o) => obtenerProximoVencimiento(cliente, o, fechaHoy))
    .filter((v): v is VencimientoCalculado => v !== null)
    .sort((a, b) => a.diasFaltantes - b.diasFaltantes);
}

export function estadoSemaforo(diasFaltantes: number): EstadoSemaforo {
  if (diasFaltantes < 0) return "vencido";
  if (diasFaltantes === 0) return "vence_hoy";
  if (diasFaltantes <= 5) return "urgente";
  if (diasFaltantes <= 15) return "proximo";
  return "al_dia";
}
