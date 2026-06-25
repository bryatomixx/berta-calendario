import { NextResponse } from "next/server";
import { cargarClientes, cargarCalendario } from "@/lib/tributario/clientes";
import { generarEnviosSimulados } from "@/lib/tributario/notificaciones";

export async function GET() {
  const [clientes, calendario] = await Promise.all([
    cargarClientes(),
    cargarCalendario(),
  ]);
  const envios = generarEnviosSimulados(clientes, calendario, new Date());
  return NextResponse.json({
    fecha: new Date().toISOString().slice(0, 10),
    total: envios.length,
    envios,
  });
}
