import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/data';

interface OptionGroupProps {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (updated: string[]) => void;
}

function OptionGroup({ label, options, selected, onChange }: OptionGroupProps) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter(o => o !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <View style={styles.groupWrap}>
      {label ? <Text style={styles.groupLabel}>{label}</Text> : null}
      <View style={styles.pills}>
        {options.map(opt => {
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
  );
}

interface GoalSectionProps {
  title: string;
  goalNumber: number;
  groups: {
    label?: string;
    options: string[];
    selected: string[];
    onChange: (updated: string[]) => void;
  }[];
}

export function GoalSection({ title, goalNumber, groups }: GoalSectionProps) {
  const hasSelections = groups.some(g => g.selected.length > 0);
  return (
    <View style={[styles.card, hasSelections && styles.cardActive]}>
      <View style={styles.leftAccent} />
      <View style={styles.inner}>
        <View style={styles.titleRow}>
          <View style={[styles.badge, hasSelections && styles.badgeActive]}>
            <Text style={styles.badgeText}>{goalNumber}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          {hasSelections && <View style={styles.activeDot} />}
        </View>
        {groups.map((g, i) => (
          <OptionGroup
            key={i}
            label={g.label}
            options={g.options}
            selected={g.selected}
            onChange={g.onChange}
          />
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
  cardActive: {
    borderColor: COLORS.primary,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  groupWrap: {
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
    backgroundColor: COLORS.accentDim,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
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
    backgroundColor: COLORS.accent,
  },
  checkInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
  },
  checkMark: {
    fontSize: 10,
    color: '#000',
    fontWeight: '900',
    lineHeight: 12,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: COLORS.accent,
  },
  pillTextInactive: {
    color: COLORS.textSub,
  },
});
