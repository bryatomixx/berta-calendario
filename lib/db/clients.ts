import { supabase } from '../supabase';
import { USE_MOCK, mock } from './mock';
import type { Cliente } from '../types';

// Store unico de clientes, compartido por el board (asignar tarea + horas) y la
// seccion Tributario. En modo demo vive en el mock; el camino Supabase queda
// listo para cuando se conecte la base real.

export async function getClients(): Promise<Cliente[]> {
  if (USE_MOCK) return mock.getClients();
  const { data, error } = await supabase.from('clients').select('*').order('nombre');
  if (error) throw error;
  return (data ?? []) as Cliente[];
}

export async function getClient(id: string): Promise<Cliente | null> {
  if (USE_MOCK) return mock.getClient(id);
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Cliente | null;
}

// Crea un cliente "solo nombre" (los datos tributarios se completan luego).
export async function addClient(nombre: string): Promise<Cliente> {
  if (USE_MOCK) return mock.addClient(nombre);
  const { data, error } = await supabase
    .from('clients')
    .insert({ nombre: nombre.trim(), obligacionesActivas: [] })
    .select()
    .single();
  if (error) throw error;
  return data as Cliente;
}
