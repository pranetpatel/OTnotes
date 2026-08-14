import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/data';
import { GoalComment } from '@/services/database';

interface Props {
  goals: string[];
  comments: GoalComment[];
  onChange: (index: number, text: string) => void;
  loading?: boolean;
}

export function GoalCommentsSection({ goals, comments, onChange, loading }: Props) {
  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.leftAccent} />
        <View style={styles.inner}>
          <Text style={styles.title}>Goal Comments</Text>
          <Text style={styles.emptyText}>Loading this student's goals…</Text>
        </View>
      </View>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.leftAccent} />
        <View style={styles.inner}>
          <Text style={styles.title}>Goal Comments</Text>
          <Text style={styles.emptyText}>No goals on file for this student yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.leftAccent} />
      <View style={styles.inner}>
        <Text style={styles.title}>Goal Comments</Text>
        {goals.map((goal, i) => (
          <View key={i} style={[styles.goalBlock, i === goals.length - 1 && styles.goalBlockLast]}>
            <View style={styles.goalHeaderRow}>
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>{i + 1}</Text>
              </View>
              <Text style={styles.goalText}>{goal}</Text>
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Share observations and facts related to this goal…"
              placeholderTextColor={COLORS.textMuted}
              value={comments[i]?.comment ?? ''}
              onChangeText={text => onChange(i, text)}
              multiline
              textAlignVertical="top"
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  leftAccent: {
    width: 4,
    backgroundColor: COLORS.leftAccent,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  inner: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  goalBlock: {
    marginBottom: 18,
  },
  goalBlockLast: {
    marginBottom: 0,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  goalBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  goalText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
  },
  commentInput: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text,
    minHeight: 70,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
