import { supabase } from '../supabase';
import { USE_MOCK, mock } from './mock';
import type { Project } from '../types';

export async function getProjects(): Promise<Project[]> {
  if (USE_MOCK) return mock.getProjects();
  const { data, error } = await supabase.from('projects').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function addProject(
  name: string,
  description: string | null = null,
): Promise<Project> {
  if (USE_MOCK) return mock.addProject(name, description);
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description })
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(
  id: string,
  patch: Partial<Project>,
): Promise<Project> {
  if (USE_MOCK) return mock.updateProject(id, patch);
  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}
