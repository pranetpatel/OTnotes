import React, { useEffect, useState } from 'react';
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
import { ScreenHeader } from '@/components/ScreenHeader';
import { StudentPicker } from '@/components/StudentPicker';
import { GoalSection } from '@/components/GoalSection';
import { VoiceNoteInput } from '@/components/VoiceNoteInput';
import { saveAssessment } from '@/services/database';
import {
  COLORS,
  GOAL1_LABEL,
  GOAL1_OPTIONS,
  GOAL2_LABEL,
  GOAL2_COORDINATION_OPTIONS,
  GOAL2_PRIMARY_OPTIONS,
  GOAL3_LABEL,
  GOAL3_OPTIONS,
} from '@/constants/data';

function useForm() {
  const [student, setStudent] = useState<string | null>(null);
  const [supervisor, setSupervisor] = useState('');
  const [goal1, setGoal1] = useState<string[]>([]);
  const [goal2Primary, setGoal2Primary] = useState<string[]>([]);
  const [goal2Coord, setGoal2Coord] = useState<string[]>([]);
  const [goal3, setGoal3] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  function reset() {
    setStudent(null);
    setSupervisor('');
    setGoal1([]);
    setGoal2Primary([]);
    setGoal2Coord([]);
    setGoal3([]);
    setNotes('');
  }

  return {
    student, setStudent,
    supervisor, setSupervisor,
    goal1, setGoal1,
    goal2Primary, setGoal2Primary,
    goal2Coord, setGoal2Coord,
    goal3, setGoal3,
    notes, setNotes,
    reset,
  };
}

export default function AssessmentScreen() {
  const form = useForm();
  const [submitting, setSubmitting] = useState(false);
  const debugEndpoint = 'http://127.0.0.1:7734/ingest/c079974f-ddd0-47ec-9f6b-db9a6b9cfe8e';

  function debugLog(hypothesisId: string, location: string, message: string, data: Record<string, unknown>) {
    fetch(debugEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '31309a' },
      body: JSON.stringify({
        sessionId: '31309a',
        runId: 'initial',
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }

  useEffect(() => {
    // #region agent log
    debugLog('H0', 'app/(tabs)/index.tsx:AssessmentScreen:mount', 'Assessment screen mounted', {});
    // #endregion
  }, []);

  function validate(): string | null {
    if (!form.student) return 'Please select a student.';
    if (!form.supervisor.trim()) return 'Please enter supervisor name.';
    const hasAnyGoal =
      form.goal1.length > 0 ||
      form.goal2Primary.length > 0 ||
      form.goal2Coord.length > 0 ||
      form.goal3.length > 0;
    if (!hasAnyGoal) return 'Please select at least one goal indicator.';
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      // #region agent log
      debugLog('H4', 'app/(tabs)/index.tsx:handleSubmit:validationError', 'Submit blocked by validation', {
        error: err,
        hasStudent: Boolean(form.student),
        supervisorLength: form.supervisor.trim().length,
        goal1Count: form.goal1.length,
        goal2PrimaryCount: form.goal2Primary.length,
        goal2CoordCount: form.goal2Coord.length,
        goal3Count: form.goal3.length,
      });
      // #endregion
      Alert.alert('Missing Info', err);
      return;
    }

    setSubmitting(true);
    try {
      saveAssessment({
        student_name: form.student!,
        supervisor_name: form.supervisor.trim(),
        timestamp: new Date().toISOString(),
        goal1_selections: form.goal1,
        goal2_primary_selections: form.goal2Primary,
        goal2_coordination_selections: form.goal2Coord,
        goal3_selections: form.goal3,
        notes: form.notes.trim(),
      });
      // #region agent log
      debugLog('H5', 'app/(tabs)/index.tsx:handleSubmit:saveSuccess', 'Submit flow saved successfully', {
        student: form.student,
      });
      // #endregion
      Alert.alert('Saved!', `Assessment for ${form.student} has been recorded.`, [
        { text: 'OK', onPress: () => form.reset() },
      ]);
    } catch (e: any) {
      // #region agent log
      debugLog('H5', 'app/(tabs)/index.tsx:handleSubmit:saveError', 'Submit flow failed', {
        error: e?.message ?? 'unknown',
      });
      // #endregion
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <ScreenHeader subtitle={timeLabel} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StudentPicker selected={form.student} onSelect={form.setStudent} />

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Supervisor Name</Text>
            <TextInput
              style={styles.supervisorInput}
              placeholder="Your full name…"
              placeholderTextColor={COLORS.textMuted}
              value={form.supervisor}
              onChangeText={form.setSupervisor}
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          <GoalSection
            goalNumber={1}
            title={GOAL1_LABEL}
            groups={[
              { options: GOAL1_OPTIONS, selected: form.goal1, onChange: form.setGoal1 },
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
                onChange: form.setGoal2Primary,
              },
              {
                label: 'Arm/leg coordination',
                options: GOAL2_COORDINATION_OPTIONS,
                selected: form.goal2Coord,
                onChange: form.setGoal2Coord,
              },
            ]}
          />

          <GoalSection
            goalNumber={3}
            title={GOAL3_LABEL}
            groups={[
              { options: GOAL3_OPTIONS, selected: form.goal3, onChange: form.setGoal3 },
            ]}
          />

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

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={form.reset}
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
});
