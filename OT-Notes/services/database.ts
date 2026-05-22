import { supabase } from './supabase';

export interface Assessment {
  id?: number;
  student_name: string;
  supervisor_name: string;
  timestamp: string;
  goal1_selections: string[];
  goal2_primary_selections: string[];
  goal2_coordination_selections: string[];
  goal3_selections: string[];
  safety_skill_selections: string[];
  notes: string;
}

export function initDatabase(): void {}

export async function saveAssessment(assessment: Omit<Assessment, 'id'>): Promise<void> {
  const { error } = await supabase.from('assessments').insert([assessment]);
  if (error) throw new Error(error.message);
}

export async function getAllAssessments(): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Assessment[];
}

export async function updateAssessment(id: number, assessment: Omit<Assessment, 'id'>): Promise<void> {
  const { error } = await supabase.from('assessments').update(assessment).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAssessment(id: number): Promise<void> {
  const { error } = await supabase.from('assessments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
