import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/data';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';

interface Props {
  onConfirmed: () => void;
}

/**
 * Requires the currently logged-in OT to re-enter their own password before
 * signing off a note — proving active presence rather than trusting whatever
 * session happens to be open on a shared tablet. Only renders the confirm
 * flow for OT-flagged accounts; non-OTs see a blocked message instead.
 */
export function OtSignOffReauth({ onConfirmed }: Props) {
  const { staff, isOt, session } = useAuth();
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);

  if (!isOt || !staff) {
    return (
      <Text style={styles.blockedText}>
        An OT must be logged in on this device to sign off this note.
      </Text>
    );
  }

  async function handleConfirm() {
    const email = session?.user?.email;
    if (!email || !password) return;
    setChecking(true);
    setError(false);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setChecking(false);
    if (signInError) {
      setError(true);
      setPassword('');
      return;
    }
    setPassword('');
    onConfirmed();
  }

  return (
    <View>
      <Text style={styles.promptText}>Re-enter your password to confirm sign-off as {staff.name}.</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder="Your password"
        placeholderTextColor={COLORS.textMuted}
        value={password}
        onChangeText={v => { setPassword(v); setError(false); }}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleConfirm}
      />
      {error && <Text style={styles.errorText}>Incorrect password.</Text>}
      <TouchableOpacity
        style={[styles.confirmBtn, (!password || checking) && styles.confirmBtnDisabled]}
        onPress={handleConfirm}
        disabled={!password || checking}
        activeOpacity={0.8}
      >
        <Text style={styles.confirmBtnText}>{checking ? 'Checking…' : 'Confirm Sign Off'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  blockedText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  promptText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  input: {
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  inputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 12, color: COLORS.danger, fontWeight: '600', marginBottom: 8 },
  confirmBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
