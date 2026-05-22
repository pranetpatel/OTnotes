import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRole } from '@/context/RoleContext';
import {
  getSlotsForDay,
  getCurrentSlot,
  getNextSlot,
  formatMinutes,
  DAY_NAMES,
  toISODate,
  addDays,
  TimeSlot,
} from '@/constants/schedule';
import {
  getMakeupSessions, addMakeupSession, removeMakeupSession, MakeupSession,
  getRecurringSchedules, addRecurringSchedule, removeRecurringSchedule, RecurringSchedule,
} from '@/services/scheduleStorage';
import { STUDENTS, COLORS } from '@/constants/data';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function isToday(d: Date): boolean {
  const now = new Date();
  return toISODate(d) === toISODate(now);
}

// --- Add Makeup Modal ---
interface AddMakeupModalProps {
  visible: boolean;
  date: Date;
  slot: TimeSlot | null;
  onClose: () => void;
  onAdded: () => void;
}

function AddMakeupModal({ visible, date, slot, onClose, onAdded }: AddMakeupModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [note, setNote] = useState('');

  function handleAdd() {
    if (!selectedStudent || !slot) return;
    addMakeupSession({
      studentName: selectedStudent,
      date: toISODate(date),
      timeSlotId: slot.id,
      note: note.trim() || undefined,
    }).then(() => {
      setSelectedStudent(null);
      setNote('');
      onAdded();
      onClose();
    }).catch((e: any) => Alert.alert('Error', e?.message));
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={mStyles.container}>
        <View style={mStyles.header}>
          <Text style={mStyles.title}>Add Makeup Session</Text>
          <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
            <Text style={mStyles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {slot && (
          <Text style={mStyles.slotLabel}>
            {formatDate(date)}  ·  {slot.label}
          </Text>
        )}

        <Text style={mStyles.sectionLabel}>Select Student</Text>
        <FlatList
          data={STUDENTS}
          keyExtractor={s => s}
          style={mStyles.studentList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[mStyles.studentRow, selectedStudent === item && mStyles.studentRowSelected]}
              onPress={() => setSelectedStudent(item)}
            >
              <Text style={[mStyles.studentName, selectedStudent === item && mStyles.studentNameSelected]}>
                {item}
              </Text>
              {selectedStudent === item && <Text style={mStyles.checkmark}>✓</Text>}
            </TouchableOpacity>
          )}
        />

        <Text style={mStyles.sectionLabel}>Note (optional)</Text>
        <TextInput
          style={mStyles.noteInput}
          placeholder="e.g. Missed Tuesday, making up Friday"
          placeholderTextColor={COLORS.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
        />

        <TouchableOpacity
          style={[mStyles.addBtn, !selectedStudent && mStyles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!selectedStudent}
          activeOpacity={0.8}
        >
          <Text style={mStyles.addBtnText}>Add to Schedule</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// --- Add Recurring Modal ---
interface AddRecurringModalProps {
  visible: boolean;
  slot: TimeSlot | null;
  dayOfWeek: number;
  onClose: () => void;
  onAdded: () => void;
}

function AddRecurringModal({ visible, slot, dayOfWeek, onClose, onAdded }: AddRecurringModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  function handleAdd() {
    if (!selectedStudent || !slot) return;
    addRecurringSchedule({ studentName: selectedStudent, dayOfWeek, timeSlotId: slot.id })
      .then(() => {
        setSelectedStudent(null);
        onAdded();
        onClose();
      })
      .catch((e: any) => Alert.alert('Error', e?.message));
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={mStyles.container}>
        <View style={mStyles.header}>
          <Text style={mStyles.title}>Add Recurring Student</Text>
          <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
            <Text style={mStyles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {slot && (
          <Text style={mStyles.slotLabel}>
            {DAY_NAMES[dayOfWeek]}s  ·  {slot.label}
          </Text>
        )}

        <Text style={mStyles.sectionLabel}>Select Student</Text>
        <FlatList
          data={STUDENTS}
          keyExtractor={s => s}
          style={mStyles.studentList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[mStyles.studentRow, selectedStudent === item && mStyles.studentRowSelected]}
              onPress={() => setSelectedStudent(item)}
            >
              <Text style={[mStyles.studentName, selectedStudent === item && mStyles.studentNameSelected]}>
                {item}
              </Text>
              {selectedStudent === item && <Text style={mStyles.checkmark}>✓</Text>}
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity
          style={[mStyles.addBtn, !selectedStudent && mStyles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!selectedStudent}
          activeOpacity={0.8}
        >
          <Text style={mStyles.addBtnText}>Add Weekly Recurring</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// --- Time Slot Card ---
interface SlotCardProps {
  slot: TimeSlot;
  students: string[];
  isActive: boolean;
  isNext: boolean;
  isAdmin: boolean;
  date: Date;
  allMakeups: MakeupSession[];
  allRecurring: RecurringSchedule[];
  onAddMakeup: (slot: TimeSlot) => void;
  onAddRecurring: (slot: TimeSlot) => void;
  onRemoveMakeup: (studentName: string, slot: TimeSlot, date: Date) => void;
  onRemoveRecurring: (studentName: string, slot: TimeSlot) => void;
}

function SlotCard({
  slot, students, isActive, isNext, isAdmin, date,
  allMakeups, allRecurring,
  onAddMakeup, onAddRecurring, onRemoveMakeup, onRemoveRecurring,
}: SlotCardProps) {
  const router = useRouter();
  const isoDate = toISODate(date);
  const dayOfWeek = date.getDay();

  const makeups = allMakeups.filter(m => m.date === isoDate && m.timeSlotId === slot.id);
  const recurring = allRecurring.filter(r => r.dayOfWeek === dayOfWeek && r.timeSlotId === slot.id);

  function isMakeup(name: string) {
    return makeups.some(m => m.studentName === name);
  }

  return (
    <View style={[sStyles.card, isActive && sStyles.cardActive, isNext && sStyles.cardNext]}>
      <View style={sStyles.slotHeader}>
        <View style={sStyles.slotLabelRow}>
          <Text style={[sStyles.slotTime, isActive && sStyles.slotTimeActive]}>{slot.label}</Text>
          {isActive && <View style={sStyles.nowBadge}><Text style={sStyles.nowText}>NOW</Text></View>}
          {isNext && !isActive && <View style={sStyles.nextBadge}><Text style={sStyles.nextText}>NEXT</Text></View>}
        </View>
        <Text style={sStyles.countText}>{students.length} kid{students.length !== 1 ? 's' : ''}</Text>
      </View>

      {students.length === 0 ? (
        <Text style={sStyles.emptySlot}>No students scheduled</Text>
      ) : (
        <View style={sStyles.studentChips}>
          {students.map(name => (
            <TouchableOpacity
              key={name}
              style={[sStyles.chip, isMakeup(name) && sStyles.chipMakeup]}
              onPress={() => router.push({ pathname: '/', params: { student: name } })}
              activeOpacity={0.7}
            >
              <Text style={sStyles.chipText}>{name}</Text>
              {isMakeup(name) && <Text style={sStyles.makeupTag}> makeup</Text>}
              {isAdmin && (
                <TouchableOpacity
                  onPress={e => {
                    e.stopPropagation?.();
                    isMakeup(name)
                      ? onRemoveMakeup(name, slot, date)
                      : onRemoveRecurring(name, slot);
                  }}
                  style={sStyles.chipRemove}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={sStyles.chipRemoveText}>×</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isAdmin && (
        <View style={sStyles.adminButtons}>
          <TouchableOpacity style={sStyles.adminBtn} onPress={() => onAddMakeup(slot)} activeOpacity={0.75}>
            <Text style={sStyles.adminBtnText}>+ Makeup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sStyles.adminBtn} onPress={() => onAddRecurring(slot)} activeOpacity={0.75}>
            <Text style={sStyles.adminBtnText}>+ Weekly</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// --- Main Calendar Screen ---
export default function CalendarScreen() {
  const { isAdmin } = useRole();
  const [date, setDate] = useState(new Date());
  const [allMakeups, setAllMakeups] = useState<MakeupSession[]>([]);
  const [allRecurring, setAllRecurring] = useState<RecurringSchedule[]>([]);

  const [makeupModalSlot, setMakeupModalSlot] = useState<TimeSlot | null>(null);
  const [recurringModalSlot, setRecurringModalSlot] = useState<TimeSlot | null>(null);

  function loadData() {
    Promise.all([getMakeupSessions(), getRecurringSchedules()])
      .then(([m, r]) => { setAllMakeups(m); setAllRecurring(r); })
      .catch(() => {});
  }

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const now = new Date();
  const currentSlot = isToday(date) ? getCurrentSlot(now) : null;
  const nextSlotInfo = isToday(date) ? getNextSlot(now) : null;

  const dayOfWeek = date.getDay();
  const isoDate = toISODate(date);
  const slots = getSlotsForDay(dayOfWeek);

  const slotData = slots.map(slot => {
    const fromRecurring = allRecurring
      .filter(r => r.dayOfWeek === dayOfWeek && r.timeSlotId === slot.id)
      .map(r => r.studentName);
    const fromMakeups = allMakeups
      .filter(m => m.date === isoDate && m.timeSlotId === slot.id)
      .map(m => m.studentName);
    const students = [...new Set([...fromRecurring, ...fromMakeups])];
    return { slot, students };
  });

  function handleRemoveMakeup(studentName: string, slot: TimeSlot, d: Date) {
    Alert.alert(
      'Remove Makeup',
      `Remove ${studentName} from this makeup session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: () => {
            const toRemove = allMakeups.filter(
              m => m.date === toISODate(d) && m.timeSlotId === slot.id && m.studentName === studentName
            );
            Promise.all(toRemove.map(m => removeMakeupSession(m.id)))
              .then(loadData)
              .catch((e: any) => Alert.alert('Error', e?.message));
          },
        },
      ]
    );
  }

  function handleRemoveRecurring(studentName: string, slot: TimeSlot) {
    Alert.alert(
      'Remove from Weekly Schedule',
      `Remove ${studentName} from all ${DAY_NAMES[date.getDay()]} ${slot.label} sessions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: () => {
            const toRemove = allRecurring.filter(
              r => r.studentName === studentName && r.dayOfWeek === date.getDay() && r.timeSlotId === slot.id
            );
            Promise.all(toRemove.map(r => removeRecurringSchedule(r.id)))
              .then(loadData)
              .catch((e: any) => Alert.alert('Error', e?.message));
          },
        },
      ]
    );
  }

  const todayLabel = isToday(date) ? 'Today' : null;
  const dateLabel = formatDate(date);

  return (
    <View style={styles.container}>
      <ScreenHeader subtitle={isAdmin ? 'Admin · Calendar' : 'Deck Supervisor · Schedule'} />

      {/* Date navigation */}
      <View style={styles.datePicker}>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => setDate(d => addDays(d, -1))} activeOpacity={0.7}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateCenter} onPress={() => setDate(new Date())} activeOpacity={0.8}>
          {todayLabel && <Text style={styles.todayBadge}>TODAY</Text>}
          <Text style={styles.dateText}>{dateLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.arrowBtn} onPress={() => setDate(d => addDays(d, 1))} activeOpacity={0.7}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming session banner */}
      {isToday(date) && nextSlotInfo && !currentSlot && (
        <View style={styles.upcomingBanner}>
          <Text style={styles.upcomingText}>
            Next session in {formatMinutes(nextSlotInfo.minutesUntil)} · {nextSlotInfo.slot.label}
          </Text>
        </View>
      )}

      {slotData.length === 0 ? (
        <View style={styles.noOpsContainer}>
          <Text style={styles.noOpsIcon}>🚫</Text>
          <Text style={styles.noOpsTitle}>No Operating Hours</Text>
          <Text style={styles.noOpsBody}>No sessions are scheduled on {DAY_NAMES[date.getDay()]}s.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {slotData.map(({ slot, students }) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              students={students}
              isActive={currentSlot?.id === slot.id}
              isNext={nextSlotInfo?.slot.id === slot.id}
              isAdmin={isAdmin}
              date={date}
              allMakeups={allMakeups}
              allRecurring={allRecurring}
              onAddMakeup={setMakeupModalSlot}
              onAddRecurring={setRecurringModalSlot}
              onRemoveMakeup={handleRemoveMakeup}
              onRemoveRecurring={handleRemoveRecurring}
            />
          ))}
          <View style={{ height: 48 }} />
        </ScrollView>
      )}

      <AddMakeupModal
        visible={makeupModalSlot !== null}
        date={date}
        slot={makeupModalSlot}
        onClose={() => setMakeupModalSlot(null)}
        onAdded={loadData}
      />

      <AddRecurringModal
        visible={recurringModalSlot !== null}
        slot={recurringModalSlot}
        dayOfWeek={date.getDay()}
        onClose={() => setRecurringModalSlot(null)}
        onAdded={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  arrowBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  arrow: { fontSize: 28, color: COLORS.primary, fontWeight: '300', lineHeight: 32 },
  dateCenter: { flex: 1, alignItems: 'center', gap: 2 },
  todayBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  upcomingBanner: {
    backgroundColor: COLORS.accentDim,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  upcomingText: { fontSize: 13, fontWeight: '600', color: COLORS.accent, textAlign: 'center' },
  noOpsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  noOpsIcon: { fontSize: 48 },
  noOpsTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textSub },
  noOpsBody: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },
});

const sStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.border,
  },
  cardActive: { borderLeftColor: COLORS.success },
  cardNext: { borderLeftColor: COLORS.primary },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  slotLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotTime: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  slotTimeActive: { color: COLORS.success },
  nowBadge: { backgroundColor: COLORS.success, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  nowText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.8 },
  nextBadge: { backgroundColor: COLORS.primaryDim, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  nextText: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.8 },
  countText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  emptySlot: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', paddingVertical: 4 },
  studentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDim,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipMakeup: { backgroundColor: '#FFF3CD' },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  makeupTag: { fontSize: 11, color: '#856404', fontStyle: 'italic' },
  chipRemove: { marginLeft: 6 },
  chipRemoveText: { fontSize: 16, color: COLORS.textMuted, lineHeight: 18, fontWeight: '700' },
  adminButtons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  adminBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  adminBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
});

const mStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  slotLabel: { fontSize: 14, color: COLORS.textSub, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 8,
  },
  studentList: { flexGrow: 0, maxHeight: 280, marginBottom: 12 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16,
    backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 6,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  studentRowSelected: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primary },
  studentName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  studentNameSelected: { color: COLORS.primary },
  checkmark: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  noteInput: {
    backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: COLORS.border, fontSize: 15, color: COLORS.text,
    minHeight: 64, textAlignVertical: 'top', marginBottom: 16,
  },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 24,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  addBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
