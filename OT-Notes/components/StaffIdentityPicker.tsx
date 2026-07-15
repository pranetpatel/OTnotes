import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '@/constants/data';
import { getActiveStaff, verifyStaffPin, StaffMember } from '@/services/staff';
import { PinModal } from '@/components/PinModal';

interface Props {
  /** Currently confirmed staff member (name shown in the trigger), or null. */
  selected: StaffMember | null;
  /** Called once PIN verification succeeds for the chosen staff member. */
  onConfirmed: (staff: StaffMember) => void;
  /** Restrict the picker to OT staff only (used for sign-off). */
  otOnly?: boolean;
  label?: string;
  placeholder?: string;
}

export function StaffIdentityPicker({ selected, onConfirmed, otOnly = false, label = 'Staff', placeholder = 'Tap to confirm identity' }: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [pendingStaff, setPendingStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    if (pickerVisible) {
      getActiveStaff()
        .then(list => setStaffList(otOnly ? list.filter(s => s.isOt) : list))
        .catch(() => {});
    }
  }, [pickerVisible, otOnly]);

  function handlePick(staff: StaffMember) {
    setPendingStaff(staff);
    setPickerVisible(false);
    setPinVisible(true);
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, selected ? styles.triggerSelected : styles.triggerEmpty]}
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.75}
      >
        <View style={styles.triggerContent}>
          <Text style={styles.triggerCaption}>{label}</Text>
          <Text style={selected ? styles.triggerName : styles.triggerPlaceholder}>
            {selected ? selected.name : placeholder}
          </Text>
        </View>
        <View style={selected ? styles.changeBadge : styles.selectBadge}>
          <Text style={selected ? styles.changeBadgeText : styles.selectBadgeText}>
            {selected ? 'Change' : 'Select'}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{otOnly ? 'Select OT' : 'Select Staff'}</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          {staffList.length === 0 ? (
            <Text style={styles.emptyText}>
              {otOnly ? 'No OT staff configured yet. Add one in Admin.' : 'No staff configured yet. Add one in Admin.'}
            </Text>
          ) : (
            <FlatList
              data={staffList}
              keyExtractor={s => String(s.id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.row} onPress={() => handlePick(item)} activeOpacity={0.7}>
                  <Text style={styles.rowText}>{item.name}</Text>
                  {item.isOt && <View style={styles.otBadge}><Text style={styles.otBadgeText}>OT</Text></View>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </SafeAreaView>
      </Modal>

      <PinModal
        visible={pinVisible}
        title={pendingStaff?.name ?? 'Enter PIN'}
        subtitle="Enter your PIN to confirm"
        onVerify={pin => (pendingStaff ? verifyStaffPin(pendingStaff.id, pin) : Promise.resolve(false))}
        onSuccess={() => {
          if (pendingStaff) onConfirmed(pendingStaff);
          setPinVisible(false);
          setPendingStaff(null);
        }}
        onCancel={() => { setPinVisible(false); setPendingStaff(null); }}
      />
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
    minHeight: 64,
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
  triggerContent: { flex: 1, gap: 3 },
  triggerCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  triggerName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  triggerPlaceholder: { fontSize: 15, color: COLORS.textMuted },
  changeBadge: {
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  changeBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primaryLight },
  selectBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.text },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  cancelText: { fontSize: 16, color: COLORS.accent, fontWeight: '600' },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', padding: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 56,
  },
  rowText: { fontSize: 16, color: COLORS.text },
  otBadge: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  otBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 18 },
});
