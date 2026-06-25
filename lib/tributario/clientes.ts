import type { Cliente, Calendario } from "./types";
// Se importan los JSON directamente (no fs.readFile) para que Next los empaquete
// en el bundle. Leerlos con fs desde process.cwd() falla en serverless de Vercel.
import clientesData from "@/data/clientes-demo.json";
import calendarioData from "@/data/calendario_2026.json";

export async function cargarClientes(): Promise<Cliente[]> {
  return clientesData as unknown as Cliente[];
}

export async function cargarCalendario(): Promise<Calendario> {
  return calendarioData as unknown as Calendario;
}

export async function obtenerCliente(id: string): Promise<Cliente | null> {
  const clientes = await cargarClientes();
  return clientes.find((c) => c.id === id) ?? null;
}
