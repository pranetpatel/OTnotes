import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Href, router } from 'expo-router';
import { updatePassword } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants/data';
import { showAlert } from '@/utils/alert';

export default function SetPasswordScreen() {
  const { session, mustSetPassword, clearMustSetPassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Invite/recovery links should establish a session before this screen is useful.
    if (!session && !mustSetPassword) {
      router.replace('/login' as Href);
    }
  }, [session, mustSetPassword, loading]);

  async function handleSubmit() {
    if (!session) {
      showAlert(
        'Link expired',
        'Open the invite or reset link from your email again. If it keeps failing, ask your admin to resend it.'
      );
      return;
    }
    if (password.length < 6) {
      showAlert('Too short', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      showAlert('Mismatch', 'Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      clearMustSetPassword();
      showAlert('Password saved', 'You can use this password to sign in next time.');
      router.replace('/' as Href);
    } catch (e: any) {
      showAlert('Could not save password', e?.message ?? 'Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>SuperSwims</Text>
        <Text style={styles.title}>Create your password</Text>
        <Text style={styles.subtitle}>
          {session
            ? 'Choose a password for your OT Notes account.'
            : 'Checking your invite link…'}
        </Text>

        <View style={styles.card}>
          {!session ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={styles.fieldLabel}>New password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <Text style={styles.fieldLabel}>Confirm password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Save password</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity onPress={() => router.replace('/login' as Href)} style={styles.linkWrap}>
          <Text style={styles.link}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 4,
  },
  logo: { width: 64, height: 64, borderRadius: 14, marginBottom: 6 },
  brand: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 340,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 4,
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
  submitBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.55, shadowOpacity: 0 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  linkWrap: { marginTop: 20 },
  link: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
});
