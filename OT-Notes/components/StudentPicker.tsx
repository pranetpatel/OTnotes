import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { COLORS, STUDENTS } from '@/constants/data';
import { GoalSheetModal } from '@/components/GoalSheetModal';

interface Props {
  selected: string | null;
  onSelect: (name: string) => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function StudentPicker({ selected, onSelect }: Props) {
  const [visible, setVisible] = useState(false);
  const [goalSheetVisible, setGoalSheetVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = STUDENTS.filter(s =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(name: string) {
    onSelect(name);
    setQuery('');
    setVisible(false);
  }

  return (
    <>
      <GoalSheetModal
        studentName={selected}
        visible={goalSheetVisible}
        onClose={() => setGoalSheetVisible(false)}
      />

      <TouchableOpacity
        style={[styles.trigger, selected ? styles.triggerSelected : styles.triggerEmpty]}
        onPress={() => setVisible(true)}
        activeOpacity={0.75}
      >
        {selected ? (
          <>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(selected)}</Text>
            </View>
            <View style={styles.triggerContent}>
              <Text style={styles.triggerCaption}>Student</Text>
              <Text style={styles.triggerName}>{selected}</Text>
            </View>
            <TouchableOpacity
              style={styles.goalSheetBtn}
              onPress={(e) => { e.stopPropagation(); setGoalSheetVisible(true); }}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={styles.goalSheetIcon}>📋</Text>
              <Text style={styles.goalSheetBtnText}>Goals</Text>
            </TouchableOpacity>
            <View style={styles.changeBadge}>
              <Text style={styles.changeBadgeText}>Change</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.avatarEmpty}>
              <Text style={styles.avatarEmptyIcon}>👤</Text>
            </View>
            <View style={styles.triggerContent}>
              <Text style={styles.triggerCaption}>Student</Text>
              <Text style={styles.triggerPlaceholder}>Tap to select student</Text>
            </View>
            <View style={styles.selectBadge}>
              <Text style={styles.selectBadgeText}>Select</Text>
            </View>
          </>
        )}
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.modalLogo}
              resizeMode="contain"
            />
            <Text style={styles.modalTitle}>Select Student</Text>
            <TouchableOpacity
              onPress={() => { setQuery(''); setVisible(false); }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name…"
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.listCount}>{filtered.length} student{filtered.length !== 1 ? 's' : ''}</Text>

          <FlatList
            data={filtered}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rowAvatar, isSelected && styles.rowAvatarSelected]}>
                    <Text style={[styles.rowAvatarText, isSelected && styles.rowAvatarTextSelected]}>
                      {initials(item)}
                    </Text>
                  </View>
                  <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>{item}</Text>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    gap: 12,
    minHeight: 72,
  },
  triggerEmpty: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  triggerSelected: {
    backgroundColor: COLORS.primaryDim,
    borderWidth: 2,
    borderColor: COLORS.primary,
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
  avatarEmpty: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarEmptyIcon: {
    fontSize: 20,
  },
  triggerContent: {
    flex: 1,
    gap: 3,
  },
  triggerCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  triggerName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  triggerPlaceholder: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  goalSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentDim,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  goalSheetIcon: {
    fontSize: 12,
  },
  goalSheetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  changeBadge: {
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  changeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  selectBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Modal
  modal: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  modalLogo: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  modalTitle: {
    flex: 1,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 13,
  },
  clearIcon: {
    fontSize: 14,
    color: COLORS.textSub,
    padding: 4,
  },
  listCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
    gap: 12,
    minHeight: 60,
  },
  rowSelected: {
    backgroundColor: COLORS.primaryDim,
  },
  rowAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowAvatarSelected: {
    backgroundColor: COLORS.primary,
  },
  rowAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  rowAvatarTextSelected: {
    color: '#fff',
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  rowTextSelected: {
    fontWeight: '700',
    color: COLORS.primaryLight,
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
  checkMark: {
    fontSize: 12,
    color: '#000',
    fontWeight: '900',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 70,
  },
});
