import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PasswordInput } from '@/components/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { changePassword, requestPasswordReset } from '@/services/auth';
import { COLORS } from '@/constants/data';
import { showAlert } from '@/utils/alert';

function RoleBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
      <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextInactive]}>
        {label}
      </Text>
    </View>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { staff, session, isAdmin, isOt, signOut } = useAuth();
  const email = session?.user?.email ?? '';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  async function handleChangePassword() {
    if (!email) {
      showAlert('Missing email', 'Your account email could not be loaded. Sign out and sign in again.');
      return;
    }
    if (!currentPassword) {
      showAlert('Missing password', 'Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Too short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Mismatch', 'New passwords do not match.');
      return;
    }

    setChanging(true);
    try {
      await changePassword({ email, currentPassword: currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAlert('Password updated', 'Your new password is saved. Use it next time you sign in.');
    } catch (e: any) {
      showAlert('Could not update password', e?.message ?? 'Try again.');
    } finally {
      setChanging(false);
    }
  }

  async function handleSendResetEmail() {
    if (!email) return;
    setSendingReset(true);
    try {
      await requestPasswordReset(email);
      showAlert(
        'Reset email sent',
        `If ${email} is on file, you'll get a link to choose a new password. Check spam if you don't see it.`
      );
    } catch (e: any) {
      showAlert('Could not send reset email', e?.message ?? 'Try again.');
    } finally {
      setSendingReset(false);
    }
  }

  function handleSignOut() {
    showAlert('Sign Out', staff ? `Sign out ${staff.name}?` : 'Sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader subtitle="Your login and password" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{staff?.name ?? '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} selectable>
              {email || '—'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <View style={styles.badgeRow}>
              <RoleBadge label="OT" active={isOt} />
              <RoleBadge label="Admin" active={isAdmin} />
              {!isOt && !isAdmin && <RoleBadge label="Staff" active />}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change password</Text>
          <Text style={styles.cardHint}>
            Update your password here instead of asking for a temporary one over email.
          </Text>

          <Text style={styles.fieldLabel}>Current password</Text>
          <PasswordInput
            placeholder="••••••••"
            placeholderTextColor={COLORS.textMuted}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <Text style={styles.fieldLabel}>New password</Text>
          <PasswordInput
            placeholder="At least 6 characters"
            placeholderTextColor={COLORS.textMuted}
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Text style={styles.fieldLabel}>Confirm new password</Text>
          <PasswordInput
            placeholder="••••••••"
            placeholderTextColor={COLORS.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleChangePassword}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, changing && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={changing}
            activeOpacity={0.85}
          >
            {changing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Update password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={handleSendResetEmail}
            disabled={sendingReset || !email}
            activeOpacity={0.7}
          >
            {sendingReset ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.linkBtnText}>Email me a reset link instead</Text>
            )}
          </TouchableOpacity>
        </View>

        {isAdmin && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Manage team</Text>
            <Text style={styles.cardHint}>
              Invite staff, resend setup links, and send password resets from the Admin tab.
            </Text>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/admin' as Href)}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>Open Admin</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: COLORS.accentDim,
  },
  badgeInactive: {
    backgroundColor: COLORS.surfaceHighlight,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: COLORS.accent,
  },
  badgeTextInactive: {
    color: COLORS.textMuted,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 48,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  btnDisabled: { opacity: 0.55 },
  linkBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  secondaryBtn: {
    marginTop: 4,
    backgroundColor: COLORS.primaryDim,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  signOutBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
