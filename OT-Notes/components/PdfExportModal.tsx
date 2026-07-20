import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '@/constants/data';
import { Assessment } from '@/services/database';

type ScopeKey = 'today' | 'week' | 'all' | 'student';

interface ScopeOption {
  key: ScopeKey;
  label: string;
  caption: string;
  icon: string;
}

const SCOPE_OPTIONS: ScopeOption[] = [
  { key: 'today', label: "Today's Sessions", caption: 'Everything recorded today', icon: '📅' },
  { key: 'week', label: 'Last 7 Days', caption: 'Sessions from the past week', icon: '🗓️' },
  { key: 'student', label: 'One Student', caption: 'All sessions for a single student', icon: '🧑' },
  { key: 'all', label: 'Everything', caption: 'Full history on record', icon: '📚' },
];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function filterByScope(assessments: Assessment[], scope: ScopeKey, studentName?: string | null): Assessment[] {
  if (scope === 'all') return assessments;
  if (scope === 'today') {
    const now = new Date();
    return assessments.filter(a => isSameDay(new Date(a.timestamp), now));
  }
  if (scope === 'week') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return assessments.filter(a => new Date(a.timestamp).getTime() >= cutoff.getTime());
  }
  if (scope === 'student') {
    return assessments.filter(a => a.student_name === studentName);
  }
  return assessments;
}

interface Props {
  visible: boolean;
  assessments: Assessment[];
  onClose: () => void;
  onExport: (assessments: Assessment[]) => Promise<void>;
}

export function PdfExportModal({ visible, assessments, onClose, onExport }: Props) {
  const [scope, setScope] = useState<ScopeKey | null>(null);
  const [student, setStudent] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const students = useMemo(() => {
    const names = Array.from(new Set(assessments.map(a => a.student_name)));
    return names.sort((a, b) => a.localeCompare(b));
  }, [assessments]);

  function reset() {
    setScope(null);
    setStudent(null);
    setExporting(false);
  }

  function handleClose() {
    if (exporting) return;
    reset();
    onClose();
  }

  function selectScope(key: ScopeKey) {
    if (key === 'student') {
      setScope('student');
      return;
    }
    setScope(key);
  }

  async function handleConfirm() {
    if (!scope || (scope === 'student' && !student)) return;
    const filtered = filterByScope(assessments, scope, student);
    setExporting(true);
    try {
      await onExport(filtered);
      reset();
      onClose();
    } finally {
      setExporting(false);
    }
  }

  const readyToExport = scope === 'student' ? !!student : !!scope;
  const previewCount = scope ? filterByScope(assessments, scope, student).length : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Export PDF</Text>
          <TouchableOpacity onPress={handleClose} style={styles.cancelBtn} disabled={exporting}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>What would you like to export?</Text>

        <View style={styles.optionList}>
          {SCOPE_OPTIONS.map(opt => {
            const active = scope === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => selectScope(opt.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.optionIcon}>{opt.icon}</Text>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                  <Text style={styles.optionCaption}>{opt.caption}</Text>
                </View>
                {active && (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {scope === 'student' && (
          <>
            <Text style={styles.sectionLabel}>Select a student</Text>
            <FlatList
              data={students}
              keyExtractor={item => item}
              style={styles.studentList}
              renderItem={({ item }) => {
                const isSelected = item === student;
                return (
                  <TouchableOpacity
                    style={[styles.studentRow, isSelected && styles.studentRowSelected]}
                    onPress={() => setStudent(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.studentRowText, isSelected && styles.studentRowTextSelected]}>{item}</Text>
                    {isSelected && (
                      <View style={styles.checkCircleSmall}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.previewText}>
            {readyToExport
              ? `${previewCount} session${previewCount !== 1 ? 's' : ''} will be included`
              : 'Choose a scope to continue'}
          </Text>
          <TouchableOpacity
            style={[styles.confirmBtn, (!readyToExport || previewCount === 0 || exporting) && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!readyToExport || previewCount === 0 || exporting}
            activeOpacity={0.8}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>Generate PDF</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 10,
  },
  optionList: {
    paddingHorizontal: 18,
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  optionIcon: {
    fontSize: 22,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionLabelActive: {
    color: COLORS.primaryLight,
  },
  optionCaption: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkCircleSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkMark: {
    fontSize: 12,
    color: '#000',
    fontWeight: '900',
  },
  studentList: {
    marginHorizontal: 18,
    maxHeight: 260,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  studentRowSelected: {
    backgroundColor: COLORS.primaryDim,
  },
  studentRowText: {
    fontSize: 15,
    color: COLORS.text,
  },
  studentRowTextSelected: {
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 16,
  },
  footer: {
    marginTop: 'auto',
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  previewText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
