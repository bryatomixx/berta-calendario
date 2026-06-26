export type TipoPersona = "natural" | "juridica";
export type RegimenIva = "no_aplica" | "bimestral" | "cuatrimestral";
export type CalculoVencimiento = "ultimo_1" | "ultimo_2";

export interface Cliente {
  id: string;
  nombre: string;
  // Datos tributarios opcionales: un cliente creado al asignar una tarea puede
  // ser "solo nombre"; se completan despues en la seccion Clientes si hace falta.
  nit?: string;
  digitoVerificacion?: string;
  tipoPersona?: TipoPersona;
  regimenIva?: RegimenIva;
  // Siempre un arreglo (vacio para clientes solo-nombre = sin vencimientos DIAN).
  obligacionesActivas: string[];
  email?: string;
  telefono?: string;
  notas?: string;
}

export interface Vencimiento {
  etapa: string;
  periodo: string;
  mes: number;
  anio: number;
  fechas: Record<string, number>;
}

export interface Obligacion {
  id: string;
  nombre: string;
  calculo: CalculoVencimiento;
  vencimientos: Vencimiento[];
}

export interface Calendario {
  anio: number;
  obligaciones: Obligacion[];
}

export interface VencimientoCalculado {
  obligacionId: string;
  obligacionNombre: string;
  etapa: string;
  periodo: string;
  fecha: Date;
  diasFaltantes: number;
}

export type EstadoSemaforo =
  | "al_dia"
  | "proximo"
  | "urgente"
  | "vence_hoy"
  | "vencido";

export interface EnvioSimulado {
  clienteId: string;
  clienteNombre: string;
  obligacionId: string;
  obligacionNombre: string;
  fechaVencimiento: string;
  diasFaltantes: number;
  canal: "email" | "whatsapp";
  asunto?: string;
  mensaje: string;
}
