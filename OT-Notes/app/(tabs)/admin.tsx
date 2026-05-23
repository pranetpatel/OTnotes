import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, FlatList, ActivityIndicator,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRole } from '@/context/RoleContext';
import {
  getAllGoalOverrides, saveGoalOverride, StudentGoalOverride,
  verifyAdminPin, setAdminPin,
  getStudentRecurringSlots, addRecurringSchedule, removeRecurringSchedule,
} from '@/services/scheduleStorage';
import { getAllAssessments, Assessment } from '@/services/database';
import { STUDENTS, STUDENT_GOALS, COLORS } from '@/constants/data';
import { showAlert } from '@/utils/alert';
import { TIME_SLOTS, DAY_NAMES } from '@/constants/schedule';

// --- Helpers ---

function getEffectiveGoalSync(name: string, override: StudentGoalOverride | null | undefined): StudentGoalOverride {
  if (override) return override;
  const defaults = STUDENT_GOALS[name];
  if (defaults) return {
    studentName: name,
    focus: defaults.focus,
    activeGoals: defaults.activeGoals ?? [],
    safetySkills: defaults.safetySkills ?? [],
    adaptations: defaults.adaptations ?? [],
    progressNote: defaults.progressNote ?? '',
  };
  return { studentName: name, focus: '', activeGoals: [], safetySkills: [], adaptations: [], progressNote: '' };
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// --- PIN Login Modal ---
interface PinModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

function PinModal({ visible, onSuccess, onCancel }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit() {
    verifyAdminPin(pin).then(valid => {
      if (valid) {
        setPin('');
        setError(false);
        onSuccess();
      } else {
        setError(true);
        setPin('');
      }
    });
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={pinStyles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={pinStyles.card}>
            <Text style={pinStyles.lockIcon}>🔐</Text>
            <Text style={pinStyles.title}>Admin Access</Text>
            <Text style={pinStyles.subtitle}>Enter your 4-digit PIN</Text>
            <TextInput
              style={[pinStyles.pinInput, error && pinStyles.pinInputError]}
              placeholder="• • • •"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              value={pin}
              onChangeText={v => { setPin(v); setError(false); }}
              autoFocus
            />
            {error && <Text style={pinStyles.errorText}>Incorrect PIN</Text>}
            <View style={pinStyles.btnRow}>
              <TouchableOpacity style={pinStyles.cancelBtn} onPress={onCancel}>
                <Text style={pinStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[pinStyles.submitBtn, !pin && pinStyles.submitBtnDisabled]} onPress={handleSubmit} disabled={!pin}>
                <Text style={pinStyles.submitText}>Enter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// --- Goal Editor Modal ---
interface GoalEditorProps {
  visible: boolean;
  studentName: string;
  initialGoal: StudentGoalOverride;
  onClose: () => void;
  onSaved: () => void;
}

function StringListEditor({
  label, items, onChange,
}: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setDraft('');
  }

  return (
    <View style={edStyles.listSection}>
      <Text style={edStyles.listLabel}>{label}</Text>
      {items.map((item, i) => (
        <View key={i} style={edStyles.listRow}>
          <Text style={edStyles.listItem} numberOfLines={2}>{item}</Text>
          <TouchableOpacity onPress={() => onChange(items.filter((_, j) => j !== i))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={edStyles.removeIcon}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={edStyles.addRow}>
        <TextInput
          style={edStyles.addInput}
          placeholder="Add item…"
          placeholderTextColor={COLORS.textMuted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <TouchableOpacity style={edStyles.addBtn} onPress={add} disabled={!draft.trim()}>
          <Text style={edStyles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GoalEditorModal({ visible, studentName, initialGoal, onClose, onSaved }: GoalEditorProps) {
  const [goal, setGoal] = useState<StudentGoalOverride>(initialGoal);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setGoal(initialGoal);
  }, [visible, initialGoal]);

  function handleSave() {
    setSaving(true);
    saveGoalOverride(goal)
      .then(() => { onSaved(); onClose(); })
      .catch((e: any) => showAlert('Save Failed', e?.message))
      .finally(() => setSaving(false));
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={edStyles.container}>
          <View style={edStyles.header}>
            <Text style={edStyles.title}>{studentName}</Text>
            <TouchableOpacity onPress={onClose} style={edStyles.closeBtn}>
              <Text style={edStyles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text style={edStyles.subtitle}>Edit Goals</Text>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={edStyles.fieldLabel}>Focus Area</Text>
            <TextInput
              style={edStyles.textInput}
              value={goal.focus}
              onChangeText={v => setGoal(g => ({ ...g, focus: v }))}
              placeholder="e.g. Safety Skills, Aquatic Independence"
              placeholderTextColor={COLORS.textMuted}
            />

            <StringListEditor
              label="Active Goals"
              items={goal.activeGoals}
              onChange={v => setGoal(g => ({ ...g, activeGoals: v }))}
            />
            <StringListEditor
              label="Safety Skills / Notes"
              items={goal.safetySkills}
              onChange={v => setGoal(g => ({ ...g, safetySkills: v }))}
            />
            <StringListEditor
              label="Adaptations"
              items={goal.adaptations}
              onChange={v => setGoal(g => ({ ...g, adaptations: v }))}
            />

            <Text style={edStyles.fieldLabel}>Progress Note</Text>
            <TextInput
              style={[edStyles.textInput, { minHeight: 80, textAlignVertical: 'top' }]}
              value={goal.progressNote}
              onChangeText={v => setGoal(g => ({ ...g, progressNote: v }))}
              placeholder="Current progress summary…"
              placeholderTextColor={COLORS.textMuted}
              multiline
            />

            <TouchableOpacity style={[edStyles.saveBtn, saving && edStyles.saveBtnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
              <Text style={edStyles.saveBtnText}>{saving ? 'Saving…' : 'Save Goals'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- Progress & AI Analysis Modal ---
interface ProgressModalProps {
  visible: boolean;
  studentName: string;
  goalOverride: StudentGoalOverride;
  onClose: () => void;
}

function ProgressModal({ visible, studentName, goalOverride, onClose }: ProgressModalProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useFocusEffect(useCallback(() => {
    if (visible) {
      getAllAssessments()
        .then(all => { setAssessments(all.filter(a => a.student_name === studentName)); });
      setAiAnalysis('');
    }
  }, [visible, studentName]));

  async function handleAnalyze() {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      showAlert('Configuration Error', 'EXPO_PUBLIC_OPENAI_API_KEY is not set in the environment.');
      return;
    }
    if (assessments.length === 0) {
      showAlert('No Data', 'Record some assessments for this student first.');
      return;
    }

    setAnalyzing(true);
    setAiAnalysis('');

    const goal = goalOverride;
    const sessionSummaries = assessments.slice(0, 20).map(a =>
      `Date: ${new Date(a.timestamp).toLocaleDateString()}
Supervisor: ${a.supervisor_name}
Goal 1 (Core Stability): ${a.goal1_selections.join(', ') || 'Not rated'}
Goal 2 Effort: ${a.goal2_primary_selections.join(', ') || 'Not rated'}
Goal 2 Coordination: ${a.goal2_coordination_selections.join(', ') || 'Not rated'}
Goal 3 (Task Completion): ${a.goal3_selections.join(', ') || 'Not rated'}
Notes: ${a.notes || 'None'}`
    ).join('\n\n---\n\n');

    const prompt = `You are an occupational therapist specializing in aquatic therapy. Analyze the following session data for a student named ${studentName} and provide a concise clinical progress summary.

STUDENT FOCUS AREA: ${goal.focus}
ACTIVE GOALS: ${goal.activeGoals.join('; ')}
${goal.safetySkills.length ? `SAFETY NOTES: ${goal.safetySkills.join('; ')}` : ''}

RECENT SESSIONS (${assessments.length} total):
${sessionSummaries}

Please provide:
1. **Overall Progress Trend** — what trajectory are you seeing across sessions?
2. **Areas of Strength** — what is the student consistently doing well?
3. **Areas to Continue Working On** — what needs the most focus?
4. **Specific Recommendations** — 2-3 concrete suggestions for upcoming sessions.

Keep your response concise and clinically actionable.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 600,
          temperature: 0.3,
          messages: [
            { role: 'system', content: 'You are an occupational therapist specializing in aquatic therapy. Provide concise, clinically actionable progress summaries.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message ?? `API error ${response.status}`);
      }

      const data = await response.json();
      setAiAnalysis(data?.choices?.[0]?.message?.content?.trim() ?? 'No response received.');
    } catch (e: any) {
      showAlert('Analysis Failed', e?.message ?? 'Could not reach the AI service.');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={progStyles.container}>
        <View style={progStyles.header}>
          <Text style={progStyles.title}>{studentName}</Text>
          <TouchableOpacity onPress={onClose} style={progStyles.closeBtn}>
            <Text style={progStyles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>
        <Text style={progStyles.subtitle}>
          {assessments.length} session{assessments.length !== 1 ? 's' : ''} recorded
        </Text>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* AI Analysis */}
          <TouchableOpacity
            style={[progStyles.analyzeBtn, analyzing && progStyles.analyzeBtnDisabled]}
            onPress={handleAnalyze}
            disabled={analyzing}
            activeOpacity={0.8}
          >
            {analyzing
              ? <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              : <Text style={progStyles.aiIcon}>✨</Text>
            }
            <Text style={progStyles.analyzeBtnText}>{analyzing ? 'Analyzing…' : 'Analyze Progress with AI'}</Text>
          </TouchableOpacity>

          {aiAnalysis !== '' && (
            <View style={progStyles.analysisCard}>
              <Text style={progStyles.analysisLabel}>AI Analysis</Text>
              <Text style={progStyles.analysisText}>{aiAnalysis}</Text>
            </View>
          )}

          {/* Session Timeline */}
          <Text style={progStyles.sectionLabel}>Session History</Text>
          {assessments.length === 0 ? (
            <Text style={progStyles.emptyText}>No sessions recorded yet.</Text>
          ) : (
            assessments.map(a => (
              <View key={a.id} style={progStyles.sessionCard}>
                <Text style={progStyles.sessionDate}>{formatTimestamp(a.timestamp)}</Text>
                <Text style={progStyles.sessionSup}>Supervisor: {a.supervisor_name}</Text>
                {a.goal1_selections.length > 0 && (
                  <Text style={progStyles.sessionGoal}>Goal 1: {a.goal1_selections.join(', ')}</Text>
                )}
                {(a.goal2_primary_selections.length > 0 || a.goal2_coordination_selections.length > 0) && (
                  <Text style={progStyles.sessionGoal}>
                    Goal 2: {[...a.goal2_primary_selections, ...a.goal2_coordination_selections].join(', ')}
                  </Text>
                )}
                {a.goal3_selections.length > 0 && (
                  <Text style={progStyles.sessionGoal}>Goal 3: {a.goal3_selections.join(', ')}</Text>
                )}
                {a.notes !== '' && (
                  <Text style={progStyles.sessionNotes} numberOfLines={3}>{a.notes}</Text>
                )}
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// --- Schedule Manager Modal ---
interface ScheduleManagerProps {
  visible: boolean;
  studentName: string;
  onClose: () => void;
  onChanged: () => void;
}

function ScheduleManagerModal({ visible, studentName, onClose, onChanged }: ScheduleManagerProps) {
  const [slots, setSlots] = useState<Awaited<ReturnType<typeof getStudentRecurringSlots>>>([]);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [addingSlotId, setAddingSlotId] = useState<string | null>(null);

  const loadSlots = useCallback(() => {
    getStudentRecurringSlots(studentName).then(setSlots).catch(() => {});
  }, [studentName]);

  useFocusEffect(useCallback(() => {
    if (visible) loadSlots();
  }, [visible, loadSlots]));

  function handleAdd() {
    if (addingDay === null || !addingSlotId) return;
    addRecurringSchedule({ studentName, dayOfWeek: addingDay, timeSlotId: addingSlotId })
      .then(() => {
        loadSlots();
        setAddingDay(null);
        setAddingSlotId(null);
        onChanged();
      })
      .catch((e: any) => showAlert('Error', e?.message));
  }

  function handleRemove(id: string) {
    removeRecurringSchedule(id)
      .then(() => { loadSlots(); onChanged(); })
      .catch((e: any) => showAlert('Error', e?.message));
  }

  const availableSlots = addingDay !== null ? TIME_SLOTS.filter(s => s.days.includes(addingDay)) : [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={schStyles.container}>
        <View style={schStyles.header}>
          <Text style={schStyles.title}>{studentName}</Text>
          <TouchableOpacity onPress={onClose} style={schStyles.closeBtn}>
            <Text style={schStyles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>
        <Text style={schStyles.subtitle}>Recurring Weekly Schedule</Text>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {slots.length === 0 ? (
            <Text style={schStyles.emptyText}>No recurring sessions scheduled.</Text>
          ) : (
            slots.map(s => {
              const slotDef = TIME_SLOTS.find(t => t.id === s.timeSlotId);
              return (
                <View key={s.id} style={schStyles.slotRow}>
                  <View>
                    <Text style={schStyles.slotDay}>{DAY_NAMES[s.dayOfWeek]}</Text>
                    <Text style={schStyles.slotTime}>{slotDef?.label ?? s.timeSlotId}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(s.id)} style={schStyles.removeBtn}>
                    <Text style={schStyles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <Text style={schStyles.addTitle}>Add Session</Text>
          <Text style={schStyles.fieldLabel}>Day of Week</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={schStyles.dayRow}>
            {[0,1,2,3,4,5,6].map(d => {
              const hasSlots = TIME_SLOTS.some(s => s.days.includes(d));
              return (
                <TouchableOpacity
                  key={d}
                  style={[schStyles.dayChip, addingDay === d && schStyles.dayChipSelected, !hasSlots && schStyles.dayChipDisabled]}
                  onPress={() => { if (hasSlots) { setAddingDay(d); setAddingSlotId(null); } }}
                  disabled={!hasSlots}
                >
                  <Text style={[schStyles.dayChipText, addingDay === d && schStyles.dayChipTextSelected]}>
                    {['Su','Mo','Tu','We','Th','Fr','Sa'][d]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {addingDay !== null && (
            <>
              <Text style={schStyles.fieldLabel}>Time Slot</Text>
              {availableSlots.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[schStyles.slotOption, addingSlotId === s.id && schStyles.slotOptionSelected]}
                  onPress={() => setAddingSlotId(s.id)}
                >
                  <Text style={[schStyles.slotOptionText, addingSlotId === s.id && schStyles.slotOptionTextSelected]}>
                    {s.label}
                  </Text>
                  {addingSlotId === s.id && <Text style={schStyles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </>
          )}

          <TouchableOpacity
            style={[schStyles.addBtn, (!addingSlotId) && schStyles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!addingSlotId}
            activeOpacity={0.8}
          >
            <Text style={schStyles.addBtnText}>Add to Schedule</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// --- Settings Section ---
function SettingsSection() {
  const { setRole } = useRole();
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');

  function handleSavePin() {
    if (newPin.length < 4) { showAlert('Invalid PIN', 'PIN must be at least 4 digits.'); return; }
    setAdminPin(newPin)
      .then(() => {
        setNewPin('');
        setShowPinChange(false);
        showAlert('PIN Updated', 'Your admin PIN has been changed.');
      })
      .catch((e: any) => showAlert('Error', e?.message));
  }

  return (
    <View style={settStyles.container}>
      <Text style={settStyles.sectionTitle}>Settings</Text>

      <View style={settStyles.card}>
        <Text style={settStyles.cardLabel}>Admin PIN</Text>
        {showPinChange ? (
          <>
            <TextInput
              style={settStyles.input}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="New PIN (min 4 digits)"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={8}
            />
            <View style={settStyles.pinBtnRow}>
              <TouchableOpacity style={settStyles.cancelBtn} onPress={() => { setShowPinChange(false); setNewPin(''); }}>
                <Text style={settStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={settStyles.saveBtn} onPress={handleSavePin}>
                <Text style={settStyles.saveBtnText}>Change PIN</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity style={settStyles.outlineBtn} onPress={() => setShowPinChange(true)} activeOpacity={0.75}>
            <Text style={settStyles.outlineBtnText}>Change PIN</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={settStyles.exitBtn}
        onPress={() => showAlert('Switch to Supervisor Mode', 'Exit admin view?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch', onPress: () => setRole('supervisor') },
        ])}
        activeOpacity={0.8}
      >
        <Text style={settStyles.exitBtnText}>Exit Admin Mode</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Main Admin Screen ---
export default function AdminScreen() {
  const { isAdmin, setRole } = useRole();
  const router = useRouter();
  const [showPinModal, setShowPinModal] = useState(!isAdmin);
  const [goalEditorStudent, setGoalEditorStudent] = useState<string | null>(null);
  const [progressStudent, setProgressStudent] = useState<string | null>(null);
  const [scheduleStudent, setScheduleStudent] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [overrides, setOverrides] = useState<Record<string, StudentGoalOverride | null>>({});

  const loadOverrides = useCallback(() => {
    getAllGoalOverrides().then(list => {
      const map: Record<string, StudentGoalOverride | null> = {};
      STUDENTS.forEach(n => { map[n] = null; });
      list.forEach(o => { map[o.studentName] = o; });
      setOverrides(map);
    }).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    loadOverrides();
  }, [tick, loadOverrides]));

  function handlePinSuccess() {
    setRole('admin');
    setShowPinModal(false);
  }

  useFocusEffect(useCallback(() => {
    if (!isAdmin) setShowPinModal(true);
  }, [isAdmin]));

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <ScreenHeader subtitle="Admin Panel" />
        <PinModal
          visible={showPinModal}
          onSuccess={handlePinSuccess}
          onCancel={() => { setShowPinModal(false); router.push('/'); }}
        />
        {!showPinModal && (
          <View style={styles.center}>
            <TouchableOpacity style={styles.unlockBtn} onPress={() => setShowPinModal(true)}>
              <Text style={styles.unlockIcon}>🔐</Text>
              <Text style={styles.unlockText}>Tap to unlock Admin</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader subtitle="Admin Panel" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Student Management */}
        <Text style={styles.sectionTitle}>Students</Text>
        <Text style={styles.sectionHint}>Tap a student to edit goals, view progress, or manage schedule.</Text>

        {STUDENTS.map(name => {
          const override = overrides[name];
          const goal = getEffectiveGoalSync(name, override);
          return (
            <View key={name} style={styles.studentCard}>
              <View style={styles.studentCardTop}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{name}</Text>
                  <Text style={styles.studentFocus}>{goal.focus || 'No focus set'}</Text>
                  {Boolean(override) && <View style={styles.editedBadge}><Text style={styles.editedText}>Edited</Text></View>}
                </View>
              </View>
              <View style={styles.studentActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setGoalEditorStudent(name)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.actionBtnText}>✏️ Goals</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setProgressStudent(name)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.actionBtnText}>📈 Progress</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setScheduleStudent(name)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.actionBtnText}>📅 Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <SettingsSection />
        <View style={{ height: 48 }} />
      </ScrollView>

      {goalEditorStudent && (
        <GoalEditorModal
          visible
          studentName={goalEditorStudent}
          initialGoal={getEffectiveGoalSync(goalEditorStudent, overrides[goalEditorStudent] ?? null)}
          onClose={() => setGoalEditorStudent(null)}
          onSaved={() => setTick(t => t + 1)}
        />
      )}
      {progressStudent && (
        <ProgressModal
          visible
          studentName={progressStudent}
          goalOverride={getEffectiveGoalSync(progressStudent, overrides[progressStudent] ?? null)}
          onClose={() => setProgressStudent(null)}
        />
      )}
      {scheduleStudent && (
        <ScheduleManagerModal
          visible
          studentName={scheduleStudent}
          onClose={() => setScheduleStudent(null)}
          onChanged={() => setTick(t => t + 1)}
        />
      )}
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unlockBtn: { alignItems: 'center', gap: 10, padding: 32 },
  unlockIcon: { fontSize: 52 },
  unlockText: { fontSize: 17, fontWeight: '700', color: COLORS.textSub },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4, marginTop: 8 },
  sectionHint: { fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },
  studentCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderLeftWidth: 4, borderLeftColor: COLORS.leftAccent,
  },
  studentCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  studentInfo: { flex: 1, gap: 2 },
  studentName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  studentFocus: { fontSize: 12, color: COLORS.textSub, fontWeight: '500' },
  editedBadge: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: COLORS.accentDim, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  editedText: { fontSize: 10, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.5 },
  studentActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textSub },
});

const pinStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 28, width: '100%', alignItems: 'center', gap: 8 },
  lockIcon: { fontSize: 44 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8 },
  pinInput: {
    width: '100%', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, textAlign: 'center',
    color: COLORS.text, backgroundColor: COLORS.bg, letterSpacing: 8,
  },
  pinInputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 13, color: COLORS.danger, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: COLORS.textSub },
  submitBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

const edStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, marginTop: 14 },
  textInput: {
    backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: COLORS.border, fontSize: 15, color: COLORS.text,
  },
  listSection: { marginTop: 14 },
  listLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, borderWidth: 1, borderColor: COLORS.cardBorder, gap: 8 },
  listItem: { flex: 1, fontSize: 14, color: COLORS.text },
  removeIcon: { fontSize: 20, color: COLORS.textMuted, fontWeight: '700', lineHeight: 22 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1.5, borderColor: COLORS.border, fontSize: 14, color: COLORS.text,
  },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 20,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  saveBtnDisabled: { opacity: 0.55, shadowOpacity: 0 },
});

const progStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 15,
    marginBottom: 16, gap: 8,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  analyzeBtnDisabled: { opacity: 0.55, shadowOpacity: 0 },
  aiIcon: { fontSize: 18 },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  analysisCard: {
    backgroundColor: '#F5F0FF', borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#DDD0FA',
  },
  analysisLabel: { fontSize: 11, fontWeight: '700', color: '#7C3AED', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  analysisText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSub, marginBottom: 10, marginTop: 4 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 },
  sessionCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.cardBorder, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  sessionDate: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  sessionSup: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  sessionGoal: { fontSize: 13, color: COLORS.textSub, marginBottom: 2 },
  sessionNotes: { fontSize: 12, color: COLORS.textMuted, marginTop: 6, fontStyle: 'italic', lineHeight: 18 },
});

const schStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  slotDay: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  slotTime: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  removeBtn: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  removeText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
  addTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 10 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  dayRow: { flexGrow: 0, marginBottom: 4 },
  dayChip: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, marginRight: 8,
  },
  dayChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayChipDisabled: { opacity: 0.35 },
  dayChipText: { fontSize: 12, fontWeight: '700', color: COLORS.textSub },
  dayChipTextSelected: { color: '#fff' },
  slotOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    marginBottom: 6, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  slotOptionSelected: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primary },
  slotOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  slotOptionTextSelected: { color: COLORS.primary },
  checkmark: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  addBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

const settStyles = StyleSheet.create({
  container: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: COLORS.border, fontSize: 14, color: COLORS.text, marginBottom: 12,
  },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  pinBtnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: COLORS.textSub },
  outlineBtn: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSub },
  exitBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  exitBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
});
