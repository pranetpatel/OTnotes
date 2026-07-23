import React, { useState } from 'react';
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
import { requestPasswordReset } from '@/services/auth';
import { COLORS } from '@/constants/data';
import { showAlert } from '@/utils/alert';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      showAlert('Missing email', 'Enter the email you use to sign in.');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e: any) {
      showAlert('Could not send reset email', e?.message ?? 'Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>SuperSwims</Text>
        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>
          {sent
            ? 'If an account exists for that email, we sent a reset link. Check your inbox (and spam).'
            : 'Enter your work email and we’ll send a link to choose a new password.'}
        </Text>

        <View style={styles.card}>
          {sent ? (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => router.replace('/login' as Href)}
              activeOpacity={0.85}
            >
              <Text style={styles.submitText}>Back to sign in</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
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
                  <Text style={styles.submitText}>Send reset link</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {!sent && (
          <TouchableOpacity onPress={() => router.replace('/login' as Href)} style={styles.linkWrap}>
            <Text style={styles.link}>Back to sign in</Text>
          </TouchableOpacity>
        )}
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
