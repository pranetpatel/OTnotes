import React, { useEffect, useRef, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StudentPicker } from '@/components/StudentPicker';
import { GoalSection } from '@/components/GoalSection';
import { SafetyGoalSection } from '@/components/SafetyGoalSection';
import { VoiceNoteInput } from '@/components/VoiceNoteInput';
import { getAllAssessments, updateAssessment } from '@/services/database';
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

interface FieldErrors {
  student?: string;
  supervisor?: string;
  goals?: string;
}

export default function EditAssessmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [student, setStudent] = useState<string | null>(null);
  const [supervisor, setSupervisor] = useState('');
  const [goal1, setGoal1] = useState<string[]>([]);
  const [goal2Primary, setGoal2Primary] = useState<string[]>([]);
  const [goal2Coord, setGoal2Coord] = useState<string[]>([]);
  const [goal3, setGoal3] = useState<string[]>([]);
  const [safetySkills, setSafetySkills] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [originalTimestamp, setOriginalTimestamp] = useState('');

  const studentSafetySkills = student ? (STUDENT_GOALS[student]?.safetySkills ?? null) : null;

  useEffect(() => {
    if (!id) return;
    getAllAssessments()
      .then(all => {
        const found = all.find(a => String(a.id) === String(id));
        if (!found) {
          Alert.alert('Error', 'Assessment not found.');
          router.back();
          return;
        }
        setStudent(found.student_name);
        setSupervisor(found.supervisor_name);
        setGoal1(found.goal1_selections ?? []);
        setGoal2Primary(found.goal2_primary_selections ?? []);
        setGoal2Coord(found.goal2_coordination_selections ?? []);
        setGoal3(found.goal3_selections ?? []);
        setSafetySkills(found.safety_skill_selections ?? []);
        setNotes(found.notes ?? '');
        setOriginalTimestamp(found.timestamp);
      })
      .catch(e => Alert.alert('Error', e?.message))
      .finally(() => setLoading(false));
  }, [id]);

  function buildErrors(): FieldErrors {
    const errs: FieldErrors = {};
    if (!student) errs.student = 'Student not selected — tap to choose a student.';
    if (!supervisor.trim()) errs.supervisor = 'Supervisor name is required.';
    const hasAnyGoal =
      goal1.length > 0 || goal2Primary.length > 0 || goal2Coord.length > 0 || goal3.length > 0;
    if (!hasAnyGoal) errs.goals = 'Select at least one goal indicator before saving.';
    return errs;
  }

  async function handleUpdate() {
    const errs = buildErrors();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await updateAssessment(Number(id), {
        student_name: student!,
        supervisor_name: supervisor.trim(),
        timestamp: originalTimestamp,
        goal1_selections: goal1,
        goal2_primary_selections: goal2Primary,
        goal2_coordination_selections: goal2Coord,
        goal3_selections: goal3,
        safety_skill_selections: safetySkills,
        notes: notes.trim(),
      });
      Alert.alert('Updated!', `Assessment for ${student} has been updated.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to update assessment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading assessment…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StudentPicker
          selected={student}
          onSelect={name => {
            setStudent(name);
            setSafetySkills([]);
            setFieldErrors(e => ({ ...e, student: undefined }));
          }}
        />
        {fieldErrors.student ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠ {fieldErrors.student}</Text>
          </View>
        ) : null}

        {student && (
          <>
            <View style={[styles.card, fieldErrors.supervisor ? styles.cardError : null]}>
              <Text style={styles.sectionLabel}>Supervisor Name</Text>
              <TextInput
                style={styles.supervisorInput}
                placeholder="Your full name…"
                placeholderTextColor={COLORS.textMuted}
                value={supervisor}
                onChangeText={v => { setSupervisor(v); setFieldErrors(e => ({ ...e, supervisor: undefined })); }}
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
                selected={safetySkills}
                onChange={setSafetySkills}
              />
            )}

            <GoalSection
              goalNumber={1}
              title={GOAL1_LABEL}
              groups={[
                {
                  options: GOAL1_OPTIONS,
                  selected: goal1,
                  onChange: v => { setGoal1(v); setFieldErrors(e => ({ ...e, goals: undefined })); },
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
                  selected: goal2Primary,
                  onChange: v => { setGoal2Primary(v); setFieldErrors(e => ({ ...e, goals: undefined })); },
                },
                {
                  label: 'Arm/leg coordination',
                  options: GOAL2_COORDINATION_OPTIONS,
                  selected: goal2Coord,
                  onChange: v => { setGoal2Coord(v); setFieldErrors(e => ({ ...e, goals: undefined })); },
                },
              ]}
            />

            <GoalSection
              goalNumber={3}
              title={GOAL3_LABEL}
              groups={[
                {
                  options: GOAL3_OPTIONS,
                  selected: goal3,
                  onChange: v => { setGoal3(v); setFieldErrors(e => ({ ...e, goals: undefined })); },
                },
              ]}
            />

            {fieldErrors.goals ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠ {fieldErrors.goals}</Text>
              </View>
            ) : null}

            <VoiceNoteInput
              value={notes}
              onChange={setNotes}
              studentName={student}
              goalSelections={{
                goal1,
                goal2Primary,
                goal2Coord,
                goal3,
              }}
            />
          </>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.updateBtn, submitting && styles.updateBtnDisabled]}
            onPress={handleUpdate}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.updateText}>{submitting ? 'Saving…' : 'Update Assessment'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  scroll: { flex: 1, backgroundColor: COLORS.bg },
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
  cardError: {
    borderColor: '#E53935',
    borderLeftColor: '#E53935',
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
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 54,
  },
  cancelText: {
    fontSize: 15,
    color: COLORS.textSub,
    fontWeight: '600',
  },
  updateBtn: {
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
  updateBtnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
  },
  updateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
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
