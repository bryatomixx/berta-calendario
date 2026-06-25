import { supabase } from '../supabase';
import { USE_MOCK, mock } from './mock';
import type { Task, TaskInput } from '../types';

export async function getTasks(): Promise<Task[]> {
  if (USE_MOCK) return mock.getTasks();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position');
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function addTask(input: TaskInput): Promise<Task> {
  if (USE_MOCK) return mock.addTask(input);
  const { data, error } = await supabase
    .from('tasks')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  id: string,
  patch: Partial<Task>,
): Promise<Task> {
  if (USE_MOCK) return mock.updateTask(id, patch);
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}
