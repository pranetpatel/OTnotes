import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Assessment } from '@/services/database';
import { COLORS } from '@/constants/data';

interface Props {
  assessment: Assessment;
  onDelete: (id: number) => void;
  onEdit?: (id: number) => void;
}

function Chip({ label, aqua }: { label: string; aqua?: boolean }) {
  return (
    <View style={[styles.chip, aqua && styles.chipAqua]}>
      <Text style={[styles.chipText, aqua && styles.chipTextAqua]}>{label}</Text>
    </View>
  );
}

function GoalRow({ icon, label, items, aqua }: { icon: string; label: string; items: string[]; aqua?: boolean }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.goalRow}>
      <Text style={styles.goalIcon}>{icon}</Text>
      <View style={styles.goalContent}>
        <Text style={styles.goalLabel}>{label}</Text>
        <View style={styles.chipRow}>
          {items.map(item => <Chip key={item} label={item} aqua={aqua} />)}
        </View>
      </View>
    </View>
  );
}

export function AssessmentCard({ assessment, onDelete, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const dt = new Date(assessment.timestamp);
  const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const allGoalsEmpty =
    assessment.goal1_selections.length === 0 &&
    assessment.goal2_primary_selections.length === 0 &&
    assessment.goal2_coordination_selections.length === 0 &&
    assessment.goal3_selections.length === 0;

  function handleDelete() {
    Alert.alert(
      'Delete Assessment',
      `Remove session for ${assessment.student_name} on ${dateStr}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(assessment.id!) },
      ]
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.leftAccent} />
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.nameRow}>
                <Text style={styles.studentName}>{assessment.student_name}</Text>
                {assessment.status === 'reviewed' ? (
                  <View style={styles.reviewedBadge}><Text style={styles.reviewedBadgeText}>Reviewed</Text></View>
                ) : (
                  <View style={styles.draftBadge}><Text style={styles.draftBadgeText}>Draft</Text></View>
                )}
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaBadge}>{timeStr}</Text>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.meta}>{dateStr}</Text>
              </View>
              <Text style={styles.supervisor}>by {assessment.supervisor_name}</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.expandBtn, expanded && styles.expandBtnActive]}>
                <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.body}>
            <View style={styles.divider} />
            {allGoalsEmpty ? (
              <Text style={styles.emptyGoals}>No goal data recorded.</Text>
            ) : (
              <>
                <GoalRow icon="🧘" label="Core Stability & Postural Control" items={assessment.goal1_selections} />
                <GoalRow icon="💪" label="Strength & Propulsion" items={assessment.goal2_primary_selections} aqua />
                <GoalRow icon="🔄" label="Arm/Leg Coordination" items={assessment.goal2_coordination_selections} aqua />
                <GoalRow icon="✅" label="Task Initiation & Completion" items={assessment.goal3_selections} />
              </>
            )}
            {assessment.notes ? (
              <View style={styles.notesWrap}>
                <Text style={styles.notesLabel}>Session Notes</Text>
                <Text style={styles.notesText}>{assessment.notes}</Text>
              </View>
            ) : null}

            {assessment.status === 'reviewed' && assessment.reviewed_at ? (
              <View style={[styles.notesWrap, { borderColor: COLORS.success, backgroundColor: '#E6F9EE' }]}>
                <Text style={[styles.notesLabel, { color: COLORS.success }]}>OT Review</Text>
                <Text style={styles.notesText}>
                  Signed off {new Date(assessment.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
                {assessment.review_notes ? (
                  <Text style={[styles.notesText, { marginTop: 4, fontStyle: 'italic' }]}>{assessment.review_notes}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.actionRow}>
              {onEdit && (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => onEdit(assessment.id!)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.75}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  leftAccent: {
    width: 3,
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  inner: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerRight: {
    flexShrink: 0,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewedBadge: {
    backgroundColor: '#E6F9EE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  reviewedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  draftBadge: {
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  draftBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    backgroundColor: COLORS.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  metaSep: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSub,
  },
  supervisor: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  expandBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expandBtnActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  expandIcon: {
    fontSize: 10,
    color: COLORS.textSub,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },
  emptyGoals: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  goalIcon: {
    fontSize: 15,
    marginTop: 2,
  },
  goalContent: {
    flex: 1,
    gap: 6,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: COLORS.primaryDim,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  chipAqua: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  chipTextAqua: {
    color: COLORS.accent,
  },
  notesWrap: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 14,
    color: COLORS.textSub,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
});
