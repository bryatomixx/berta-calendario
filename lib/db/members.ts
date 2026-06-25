import { supabase } from '../supabase';
import { USE_MOCK, mock } from './mock';
import type { Member, Role } from '../types';

export async function getMembers(): Promise<Member[]> {
  if (USE_MOCK) return mock.getMembers();
  const { data, error } = await supabase.from('members').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Member[];
}

export async function addMember(
  name: string,
  color: string,
  role: Role = 'trabajadora',
): Promise<Member> {
  if (USE_MOCK) return mock.addMember(name, color, role);
  const { data, error } = await supabase
    .from('members')
    .insert({ name, color, role })
    .select()
    .single();
  if (error) throw error;
  return data as Member;
}
