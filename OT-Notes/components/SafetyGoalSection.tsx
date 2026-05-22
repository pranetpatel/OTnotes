import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/data';

const SAFETY_OPTIONS = ['Needs full support', 'With prompting', 'Demonstrated'];

interface Props {
  safetySkills: string[];
  selected: string[];
  onChange: (updated: string[]) => void;
}

export function SafetyGoalSection({ safetySkills, selected, onChange }: Props) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter(o => o !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  const hasSelections = selected.length > 0;

  return (
    <View style={[styles.card, hasSelections && styles.cardActive]}>
      <View style={styles.leftAccent} />
      <View style={styles.inner}>
        <View style={styles.titleRow}>
          <View style={[styles.badge, hasSelections && styles.badgeActive]}>
            <Text style={styles.badgeIcon}>!</Text>
          </View>
          <Text style={styles.title}>SAFETY SKILLS</Text>
          {hasSelections && <View style={styles.activeDot} />}
        </View>

        <View style={styles.skillsBox}>
          {safetySkills.map((skill, i) => (
            <View key={i} style={styles.skillRow}>
              <View style={styles.skillBullet} />
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.progressLabel}>SESSION PROGRESS</Text>
        <View style={styles.pills}>
          {SAFETY_OPTIONS.map(opt => {
            const active = selected.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
                onPress={() => toggle(opt)}
                activeOpacity={0.7}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <View style={[styles.check, active ? styles.checkActive : styles.checkInactive]}>
                  {active && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F8',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F5CCCC',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: COLORS.danger,
  },
  leftAccent: {
    width: 4,
    backgroundColor: COLORS.danger,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  inner: {
    flex: 1,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFE8E8',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: COLORS.danger,
  },
  badgeIcon: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.danger,
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  skillsBox: {
    backgroundColor: '#FFE8E8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F5CCCC',
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  skillBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
    marginTop: 8,
    flexShrink: 0,
  },
  skillText: {
    flex: 1,
    fontSize: 13,
    color: '#7A1A1A',
    lineHeight: 20,
    fontWeight: '500',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A03030',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 50,
    gap: 8,
    minHeight: 44,
  },
  pillActive: {
    backgroundColor: '#FFE0E0',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  pillInactive: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: COLORS.danger,
  },
  checkInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
  },
  checkMark: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '900',
    lineHeight: 12,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: COLORS.danger,
  },
  pillTextInactive: {
    color: COLORS.textSub,
  },
});
