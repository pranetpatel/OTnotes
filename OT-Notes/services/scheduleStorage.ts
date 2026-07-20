import { supabase } from './supabase';

export interface RecurringSchedule {
  id: string;
  studentName: string;
  dayOfWeek: number;
  timeSlotId: string;
}

export interface MakeupSession {
  id: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  timeSlotId: string;
  note?: string;
}

export interface StudentGoalOverride {
  studentName: string;
  focus: string;
  activeGoals: string[];
  safetySkills: string[];
  adaptations: string[];
  progressNote: string;
}

// --- Recurring schedules ---

export async function getRecurringSchedules(): Promise<RecurringSchedule[]> {
  const { data, error } = await supabase.from('recurring_schedules').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    studentName: row.student_name,
    dayOfWeek: row.day_of_week,
    timeSlotId: row.time_slot_id,
  }));
}

export async function addRecurringSchedule(entry: Omit<RecurringSchedule, 'id'>): Promise<RecurringSchedule> {
  const id = `rs_${Date.now()}`;
  const { error } = await supabase.from('recurring_schedules').insert([{
    id,
    student_name: entry.studentName,
    day_of_week: entry.dayOfWeek,
    time_slot_id: entry.timeSlotId,
  }]);
  if (error) throw new Error(error.message);
  return { ...entry, id };
}

export async function removeRecurringSchedule(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_schedules').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getStudentRecurringSlots(studentName: string): Promise<RecurringSchedule[]> {
  const { data, error } = await supabase
    .from('recurring_schedules')
    .select('*')
    .eq('student_name', studentName);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    studentName: row.student_name,
    dayOfWeek: row.day_of_week,
    timeSlotId: row.time_slot_id,
  }));
}

// --- Makeup sessions ---

export async function getMakeupSessions(): Promise<MakeupSession[]> {
  const { data, error } = await supabase.from('makeup_sessions').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    studentName: row.student_name,
    date: row.date,
    timeSlotId: row.time_slot_id,
    note: row.note ?? undefined,
  }));
}

export async function addMakeupSession(entry: Omit<MakeupSession, 'id'>): Promise<MakeupSession> {
  const id = `mu_${Date.now()}`;
  const { error } = await supabase.from('makeup_sessions').insert([{
    id,
    student_name: entry.studentName,
    date: entry.date,
    time_slot_id: entry.timeSlotId,
    note: entry.note ?? null,
  }]);
  if (error) throw new Error(error.message);
  return { ...entry, id };
}

export async function removeMakeupSession(id: string): Promise<void> {
  const { error } = await supabase.from('makeup_sessions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getStudentsForSlot(dayOfWeek: number, timeSlotId: string, isoDate: string): Promise<string[]> {
  const [rResult, mResult] = await Promise.all([
    supabase.from('recurring_schedules').select('student_name').eq('day_of_week', dayOfWeek).eq('time_slot_id', timeSlotId),
    supabase.from('makeup_sessions').select('student_name').eq('date', isoDate).eq('time_slot_id', timeSlotId),
  ]);
  const fromRecurring = (rResult.data ?? []).map((r: any) => r.student_name as string);
  const fromMakeups = (mResult.data ?? []).map((m: any) => m.student_name as string);
  return [...new Set([...fromRecurring, ...fromMakeups])];
}

// --- Goal overrides ---

export async function getAllGoalOverrides(): Promise<StudentGoalOverride[]> {
  const { data, error } = await supabase.from('student_goal_overrides').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    studentName: row.student_name,
    focus: row.focus ?? '',
    activeGoals: row.active_goals ?? [],
    safetySkills: row.safety_skills ?? [],
    adaptations: row.adaptations ?? [],
    progressNote: row.progress_note ?? '',
  }));
}

export async function getGoalOverride(studentName: string): Promise<StudentGoalOverride | null> {
  const { data, error } = await supabase
    .from('student_goal_overrides')
    .select('*')
    .eq('student_name', studentName)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    studentName: data.student_name,
    focus: data.focus ?? '',
    activeGoals: data.active_goals ?? [],
    safetySkills: data.safety_skills ?? [],
    adaptations: data.adaptations ?? [],
    progressNote: data.progress_note ?? '',
  };
}

export async function saveGoalOverride(override: StudentGoalOverride): Promise<void> {
  const { error } = await supabase.from('student_goal_overrides').upsert([{
    student_name: override.studentName,
    focus: override.focus,
    active_goals: override.activeGoals,
    safety_skills: override.safetySkills,
    adaptations: override.adaptations,
    progress_note: override.progressNote,
  }], { onConflict: 'student_name' });
  if (error) throw new Error(error.message);
}

