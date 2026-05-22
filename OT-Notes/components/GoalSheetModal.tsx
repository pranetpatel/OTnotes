import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, STUDENT_GOALS, StudentGoal } from '@/constants/data';
import { getGoalOverride } from '@/services/scheduleStorage';

interface Props {
  studentName: string | null;
  visible: boolean;
  onClose: () => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <View style={[styles.section, { borderLeftColor: color }]}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.bullet, { backgroundColor: color }]} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function GoalSheetModal({ studentName, visible, onClose }: Props) {
  if (!studentName) return null;

  const override = getGoalOverride(studentName);
  const goals: StudentGoal | undefined = override
    ? { focus: override.focus, activeGoals: override.activeGoals, safetySkills: override.safetySkills, adaptations: override.adaptations, progressNote: override.progressNote }
    : STUDENT_GOALS[studentName];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(studentName)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{studentName}</Text>
            {goals && (
              <View style={styles.focusBadge}>
                <Text style={styles.focusBadgeText}>{goals.focus}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!goals ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Goal Sheet</Text>
              <Text style={styles.emptyBody}>No personalized goals on file for this student yet.</Text>
            </View>
          ) : (
            <>
              {goals.safetySkills && goals.safetySkills.length > 0 && (
                <Section
                  title="SAFETY SKILLS — READ FIRST"
                  items={goals.safetySkills}
                  color={COLORS.danger}
                />
              )}

              <Section
                title="ACTIVE THERAPY GOALS"
                items={goals.activeGoals}
                color={COLORS.primary}
              />

              {goals.adaptations && goals.adaptations.length > 0 && (
                <Section
                  title="ADAPTATIONS & ACCOMMODATIONS"
                  items={goals.adaptations}
                  color={COLORS.accent}
                />
              )}

              {goals.progressNote && (
                <View style={[styles.section, { borderLeftColor: COLORS.success }]}>
                  <Text style={[styles.sectionTitle, { color: COLORS.success }]}>RECENT PROGRESS</Text>
                  <Text style={styles.progressText}>{goals.progressNote}</Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
    backgroundColor: COLORS.surface,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  focusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryDim,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  focusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
    letterSpacing: 0.3,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderLeftWidth: 4,
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  emptyBody: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
