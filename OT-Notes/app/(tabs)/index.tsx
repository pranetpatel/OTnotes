import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StudentPicker } from '@/components/StudentPicker';
import { GoalSection } from '@/components/GoalSection';
import { SafetyGoalSection } from '@/components/SafetyGoalSection';
import { VoiceNoteInput } from '@/components/VoiceNoteInput';
import { saveAssessment } from '@/services/database';
import { getCurrentSlot, getNextSlot, formatMinutes, toISODate } from '@/constants/schedule';
import { getStudentsForSlot } from '@/services/scheduleStorage';
import {
  COLORS,
  GOAL1_LABEL,
  GOAL1_OPTIONS,
  GOAL2_LABEL,
  GOAL2_COORDINATION_OPTIONS,
  GOAL2_PRIMARY_OPTIONS,
  GOAL3_LABEL,
  GOAL3_OPTIONS,
  STUDENT_GOALS,
} from '@/constants/data';

function useForm() {
  const [student, setStudent] = useState<string | null>(null);
  const [supervisor, setSupervisor] = useState('');
  const [goal1, setGoal1] = useState<string[]>([]);
  const [goal2Primary, setGoal2Primary] = useState<string[]>([]);
  const [goal2Coord, setGoal2Coord] = useState<string[]>([]);
  const [goal3, setGoal3] = useState<string[]>([]);
  const [safetySkills, setSafetySkills] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  function reset() {
    setStudent(null);
    setSupervisor('');
    setGoal1([]);
    setGoal2Primary([]);
    setGoal2Coord([]);
    setGoal3([]);
    setSafetySkills([]);
    setNotes('');
  }

  return {
    student, setStudent,
    supervisor, setSupervisor,
    goal1, setGoal1,
    goal2Primary, setGoal2Primary,
    goal2Coord, setGoal2Coord,
    goal3, setGoal3,
    safetySkills, setSafetySkills,
    notes, setNotes,
    reset,
  };
}

interface FieldErrors {
  student?: string;
  supervisor?: string;
  goals?: string;
}

export default function AssessmentScreen() {
  const form = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [activeStudents, setActiveStudents] = useState<string[]>([]);
  const [nextStudents, setNextStudents] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const scrollRef = useRef<ScrollView>(null);

  const studentSafetySkills = form.student ? (STUDENT_GOALS[form.student]?.safetySkills ?? null) : null;

  function handleSelectStudent(name: string) {
    form.setStudent(name);
    form.setSafetySkills([]);
    setFieldErrors(e => ({ ...e, student: undefined }));
  }

  useFocusEffect(useCallback(() => {
    const n = new Date();
    const currSlot = getCurrentSlot(n);
    const nextInfo = getNextSlot(n);
    const isoToday = toISODate(n);
    if (currSlot) {
      getStudentsForSlot(n.getDay(), currSlot.id, isoToday).then(setActiveStudents).catch(() => {});
    } else {
      setActiveStudents([]);
    }
    if (nextInfo) {
      getStudentsForSlot(n.getDay(), nextInfo.slot.id, isoToday).then(setNextStudents).catch(() => {});
    } else {
      setNextStudents([]);
    }
  }, []));

  function buildErrors(): FieldErrors {
    const errs: FieldErrors = {};
    if (!form.student) errs.student = 'Student not selected — tap to choose a student.';
    if (!form.supervisor.trim()) errs.supervisor = 'Supervisor name is required.';
    const hasAnyGoal =
      form.goal1.length > 0 ||
      form.goal2Primary.length > 0 ||
      form.goal2Coord.length > 0 ||
      form.goal3.length > 0;
    if (!hasAnyGoal) errs.goals = 'Select at least one goal indicator before saving.';
    return errs;
  }

  async function handleSubmit() {
    const errs = buildErrors();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await saveAssessment({
        student_name: form.student!,
        supervisor_name: form.supervisor.trim(),
        timestamp: new Date().toISOString(),
        goal1_selections: form.goal1,
        goal2_primary_selections: form.goal2Primary,
        goal2_coordination_selections: form.goal2Coord,
        goal3_selections: form.goal3,
        safety_skill_selections: form.safetySkills,
        notes: form.notes.trim(),
      });
      Alert.alert('Saved!', `Assessment for ${form.student} has been recorded.`, [
        { text: 'OK', onPress: () => { form.reset(); setFieldErrors({}); } },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save assessment.');
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();
  const timeLabel = now.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const activeSlot = getCurrentSlot(now);
  const nextSlotInfo = getNextSlot(now);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <ScreenHeader subtitle={timeLabel} />

        {/* Session status banner */}
        {activeSlot && activeStudents.length > 0 && (
          <View style={styles.sessionBanner}>
            <Text style={styles.sessionBannerLabel}>NOW · {activeSlot.label}</Text>
            <Text style={styles.sessionBannerKids} numberOfLines={1}>
              {activeStudents.join('  ·  ')}
            </Text>
          </View>
        )}
        {!activeSlot && nextSlotInfo && nextStudents.length > 0 && (
          <View style={[styles.sessionBanner, styles.sessionBannerNext]}>
            <Text style={[styles.sessionBannerLabel, styles.sessionBannerLabelNext]}>
              IN {formatMinutes(nextSlotInfo.minutesUntil)} · {nextSlotInfo.slot.label}
            </Text>
            <Text style={[styles.sessionBannerKids, styles.sessionBannerKidsNext]} numberOfLines={1}>
              {nextStudents.join('  ·  ')}
            </Text>
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StudentPicker selected={form.student} onSelect={handleSelectStudent} />
          {fieldErrors.student ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠ {fieldErrors.student}</Text>
            </View>
          ) : null}

          {form.student && (
            <>
              <View style={[styles.card, fieldErrors.supervisor ? styles.cardError : null]}>
                <Text style={styles.sectionLabel}>Supervisor Name</Text>
                <TextInput
                  style={styles.supervisorInput}
                  placeholder="Your full name…"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.supervisor}
                  onChangeText={v => { form.setSupervisor(v); setFieldErrors(e => ({ ...e, supervisor: undefined })); }}
                  autoCorrect={false}
                  returnKeyType="done"
                />
                {fieldErrors.supervisor ? (
                  <Text style={styles.errorText}>⚠ {fieldErrors.supervisor}</Text>
                ) : null}
              </View>

              {studentSafetySkills && (
                <SafetyGoalSection
                  safetySkills={studentSafetySkills}
                  selected={form.safetySkills}
                  onChange={form.setSafetySkills}
                />
              )}

              <GoalSection
                goalNumber={1}
                title={GOAL1_LABEL}
                groups={[
                  {
                    options: GOAL1_OPTIONS,
                    selected: form.goal1,
                    onChange: v => { form.setGoal1(v); setFieldErrors(e => ({ ...e, goals: undefined })); },
                  },
                ]}
              />

              <GoalSection
                goalNumber={2}
                title={GOAL2_LABEL}
                groups={[
                  {
                    label: 'Effort level',
                    options: GOAL2_PRIMARY_OPTIONS,
                    selected: form.goal2Primary,
                    onChange: v => { form.setGoal2Primary(v); setFieldErrors(e => ({ ...e, goals: undefined })); },
                  },
                  {
                    label: 'Arm/leg coordination',
                    options: GOAL2_COORDINATION_OPTIONS,
                    selected: form.goal2Coord,
                    onChange: v => { form.setGoal2Coord(v); setFieldErrors(e => ({ ...e, goals: undefined })); },
                  },
                ]}
              />

              <GoalSection
                goalNumber={3}
                title={GOAL3_LABEL}
                groups={[
                  {
                    options: GOAL3_OPTIONS,
                    selected: form.goal3,
                    onChange: v => { form.setGoal3(v); setFieldErrors(e => ({ ...e, goals: undefined })); },
                  },
                ]}
              />

              {fieldErrors.goals ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>⚠ {fieldErrors.goals}</Text>
                </View>
              ) : null}

              <VoiceNoteInput
                value={form.notes}
                onChange={form.setNotes}
                studentName={form.student}
                goalSelections={{
                  goal1: form.goal1,
                  goal2Primary: form.goal2Primary,
                  goal2Coord: form.goal2Coord,
                  goal3: form.goal3,
                }}
              />
            </>
          )}

          {form.student && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() =>
                  Alert.alert(
                    'Clear Form',
                    'Are you sure? All selections for this session will be lost.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: form.reset },
                    ]
                  )
                }
                activeOpacity={0.75}
              >
                <Text style={styles.resetText}>Clear Form</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.submitText}>{submitting ? 'Saving…' : 'Save Assessment'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.leftAccent,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  supervisorInput: {
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 48,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  resetBtn: {
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 54,
  },
  resetText: {
    fontSize: 15,
    color: COLORS.textSub,
    fontWeight: '600',
  },
  sessionBanner: {
    backgroundColor: '#E6F9EE',
    borderBottomWidth: 1,
    borderBottomColor: '#BBE8CC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 2,
  },
  sessionBannerNext: {
    backgroundColor: COLORS.primaryDim,
    borderBottomColor: COLORS.border,
  },
  sessionBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sessionBannerLabelNext: { color: COLORS.primary },
  sessionBannerKids: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  sessionBannerKidsNext: { color: COLORS.textSub },
  cardError: {
    borderColor: '#E53935',
    borderLeftColor: '#E53935',
  },
  errorBanner: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E53935',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '600',
    marginTop: 8,
  },
});
