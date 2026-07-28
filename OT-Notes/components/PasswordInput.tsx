import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/data';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  containerStyle?: object;
};

export function PasswordInput({ style, containerStyle, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <TextInput
        {...props}
        style={[styles.input, style]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setVisible(v => !v)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        accessibilityRole="button"
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={COLORS.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 44,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 48,
  },
  toggle: {
    position: 'absolute',
    right: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
