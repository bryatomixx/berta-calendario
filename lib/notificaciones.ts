import type {
  Cliente,
  Calendario,
  VencimientoCalculado,
  EnvioSimulado,
} from "./types";
import { obtenerVencimientosFuturos } from "./calendario";

const DIAS_RECORDATORIO = new Set([7, 5, 3, 1, 0]);

export function diasDeRecordatorio(dias: number): boolean {
  return DIAS_RECORDATORIO.has(dias);
}

function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function generarMensajeEmail(
  cliente: Cliente,
  v: VencimientoCalculado
): { asunto: string; cuerpo: string } {
  const dias = v.diasFaltantes;
  const tagDias = dias === 0 ? "⚠️ VENCE HOY" : `⏰ Vence en ${dias} días`;
  const asunto = `${tagDias}: ${v.obligacionNombre} - ${cliente.nombre}`;
  const cuerpo = `Hola Berta,

El cliente ${cliente.nombre} (NIT ${cliente.nit}-${cliente.digitoVerificacion}) tiene vencimiento de ${v.obligacionNombre} (período ${v.periodo}) el ${formatearFecha(v.fecha)}${dias === 0 ? " (HOY)" : ` (en ${dias} días)`}.

Ver en el dashboard: https://berta-demo.vercel.app/clientes/${cliente.id}

— Sistema Berta`;
  return { asunto, cuerpo };
}

export function generarMensajeWhatsapp(
  cliente: Cliente,
  v: VencimientoCalculado
): string {
  const dias = v.diasFaltantes;
  const header = dias === 0 ? "⚠️ *VENCE HOY*" : `⏰ *Vence en ${dias} días*`;
  return `${header}

Cliente: ${cliente.nombre}
NIT: ${cliente.nit}-${cliente.digitoVerificacion}
Obligación: ${v.obligacionNombre}
Período: ${v.periodo}
Vencimiento: ${formatearFecha(v.fecha)}`;
}

export function generarEnviosSimulados(
  clientes: Cliente[],
  calendario: Calendario,
  fechaHoy: Date
): EnvioSimulado[] {
  const envios: EnvioSimulado[] = [];
  for (const cliente of clientes) {
    const vencimientos = obtenerVencimientosFuturos(cliente, calendario, fechaHoy);
    for (const v of vencimientos) {
      if (!diasDeRecordatorio(v.diasFaltantes)) continue;

      const { asunto, cuerpo } = generarMensajeEmail(cliente, v);
      envios.push({
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        obligacionId: v.obligacionId,
        obligacionNombre: v.obligacionNombre,
        fechaVencimiento: v.fecha.toISOString().slice(0, 10),
        diasFaltantes: v.diasFaltantes,
        canal: "email",
        asunto,
        mensaje: cuerpo,
      });

      envios.push({
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        obligacionId: v.obligacionId,
        obligacionNombre: v.obligacionNombre,
        fechaVencimiento: v.fecha.toISOString().slice(0, 10),
        diasFaltantes: v.diasFaltantes,
        canal: "whatsapp",
        mensaje: generarMensajeWhatsapp(cliente, v),
      });
    }
  }
  return envios;
}
