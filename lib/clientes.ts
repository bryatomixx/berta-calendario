import { promises as fs } from "node:fs";
import path from "node:path";
import type { Cliente, Calendario } from "./types";

export async function cargarClientes(): Promise<Cliente[]> {
  const ruta = path.join(process.cwd(), "data", "clientes-demo.json");
  const contenido = await fs.readFile(ruta, "utf8");
  return JSON.parse(contenido) as Cliente[];
}

export async function cargarCalendario(): Promise<Calendario> {
  const ruta = path.join(process.cwd(), "data", "calendario_2026.json");
  const contenido = await fs.readFile(ruta, "utf8");
  return JSON.parse(contenido) as Calendario;
}

export async function obtenerCliente(id: string): Promise<Cliente | null> {
  const clientes = await cargarClientes();
  return clientes.find((c) => c.id === id) ?? null;
}
