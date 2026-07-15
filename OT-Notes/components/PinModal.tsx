import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS } from '@/constants/data';

interface Props {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onVerify: (pin: string) => Promise<boolean>;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PinModal({
  visible,
  title = 'Enter PIN',
  subtitle = 'Enter your 4-digit PIN',
  onVerify,
  onSuccess,
  onCancel,
}: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  function handleSubmit() {
    setChecking(true);
    onVerify(pin).then(valid => {
      setChecking(false);
      if (valid) {
        setPin('');
        setError(false);
        onSuccess();
      } else {
        setError(true);
        setPin('');
      }
    });
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.card}>
            <Text style={styles.lockIcon}>🔐</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <TextInput
              style={[styles.pinInput, error && styles.pinInputError]}
              placeholder="• • • •"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              value={pin}
              onChangeText={v => { setPin(v); setError(false); }}
              autoFocus
            />
            {error && <Text style={styles.errorText}>Incorrect PIN</Text>}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPin(''); setError(false); onCancel(); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, (!pin || checking) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!pin || checking}
              >
                <Text style={styles.submitText}>{checking ? 'Checking…' : 'Enter'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 28, width: '100%', alignItems: 'center', gap: 8 },
  lockIcon: { fontSize: 44 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8 },
  pinInput: {
    width: '100%', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, textAlign: 'center',
    color: COLORS.text, backgroundColor: COLORS.bg, letterSpacing: 8,
  },
  pinInputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 13, color: COLORS.danger, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: COLORS.textSub },
  submitBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
