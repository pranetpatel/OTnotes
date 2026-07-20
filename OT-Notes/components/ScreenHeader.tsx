import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/data';
import { useAuth } from '@/context/AuthContext';
import { showAlert } from '@/utils/alert';

interface Props {
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ subtitle, right }: Props) {
  const { staff, signOut } = useAuth();

  function handleSignOutPress() {
    showAlert('Sign Out', staff ? `Sign out ${staff.name}?` : 'Sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.titleBlock}>
          <Text style={styles.brand}>SuperSwims</Text>
          <Text style={styles.title}>OT Assessment</Text>
        </View>
        {right ? <View style={styles.rightSlot}>{right}</View> : null}
      </View>
      {subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}
      {staff && (
        <TouchableOpacity style={styles.userRow} onPress={handleSignOutPress} activeOpacity={0.7}>
          <Text style={styles.userText}>Signed in as {staff.name}</Text>
          <Text style={styles.switchText}>Switch User</Text>
        </TouchableOpacity>
      )}
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: Platform.OS === 'android' ? 48 : 54,
    paddingHorizontal: 20,
    paddingBottom: 0,
    backgroundColor: COLORS.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  titleBlock: {
    flex: 1,
    gap: 1,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  rightSlot: {
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userText: {
    fontSize: 12,
    color: COLORS.textSub,
    fontWeight: '600',
  },
  switchText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '700',
  },
  rule: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
