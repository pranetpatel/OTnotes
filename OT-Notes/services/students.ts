import { supabase } from './supabase';

export interface Student {
  id: number;
  name: string;
  active: boolean;
}

export async function getAllStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, active')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Student[];
}

export async function getActiveStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, active')
    .eq('active', true)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Student[];
}

export async function addStudent(name: string): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert([{ name: name.trim() }])
    .select('id, name, active')
    .single();
  if (error) throw new Error(error.message);
  return data as Student;
}

export async function updateStudent(id: number, patch: { name?: string; active?: boolean }): Promise<void> {
  const { error } = await supabase.from('students').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function findStudentByName(name: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, active')
    .ilike('name', name.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Student) ?? null;
}
