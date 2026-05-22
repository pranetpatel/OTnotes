import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { COLORS } from '@/constants/data';
import { refineNoteWithOpenAI } from '@/services/noteRefinement';

interface Props {
  value: string;
  onChange: (text: string) => void;
  studentName: string | null;
  goalSelections: {
    goal1: string[];
    goal2Primary: string[];
    goal2Coord: string[];
    goal3: string[];
  };
}

export function VoiceNoteInput({ value, onChange, studentName, goalSelections }: Props) {
  const AUTO_STOP_SILENCE_MS = 8000;
  const [listening, setListening] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const baseTextRef = useRef('');
  const valueRef = useRef(value);
  const lastTranscriptRef = useRef('');
  const appendedSpeechRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function restartSilenceTimer() {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      ExpoSpeechRecognitionModule.stop();
      setListening(false);
    }, AUTO_STOP_SILENCE_MS);
  }

  function ensureWebSpeechRecognitionGlobal(): boolean {
    if (typeof window === 'undefined') return true;
    const webkitSpeech = (window as any).webkitSpeechRecognition;
    if (!(window as any).SpeechRecognition && webkitSpeech) {
      (window as any).SpeechRecognition = webkitSpeech;
    }
    return Boolean((window as any).SpeechRecognition);
  }

  function appendTranscriptDelta(existing: string, incoming: string): string {
    const current = existing.trim();
    const next = incoming.trim();
    if (!next) return current;
    if (!current) return next;
    if (next === current || next.startsWith(current)) return next;
    if (current.startsWith(next)) return current;

    const currentWords = current.split(/\s+/);
    const nextWords = next.split(/\s+/);
    const maxOverlap = Math.min(currentWords.length, nextWords.length);
    let overlap = 0;

    for (let size = maxOverlap; size > 0; size -= 1) {
      const suffix = currentWords.slice(currentWords.length - size).join(' ').toLowerCase();
      const prefix = nextWords.slice(0, size).join(' ').toLowerCase();
      if (suffix === prefix) {
        overlap = size;
        break;
      }
    }

    if (overlap > 0) {
      const tail = nextWords.slice(overlap).join(' ').trim();
      return tail ? `${current} ${tail}` : current;
    }

    // If recognition restarts with a different phrase, append without duplicating exact repeated chunk.
    return current.toLowerCase().endsWith(next.toLowerCase()) ? current : `${current} ${next}`;
  }

  useEffect(() => {
    const hasWebSpeech = ensureWebSpeechRecognitionGlobal();
    if (!hasWebSpeech) {
      setVoiceAvailable(false);
      setPermissionChecked(true);
      return;
    }

    ExpoSpeechRecognitionModule.getPermissionsAsync()
      .then((res) => {
        setVoiceAvailable(Boolean(res.granted));
      })
      .catch(() => setVoiceAvailable(false))
      .finally(() => setPermissionChecked(true));
  }, []);

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    setError('');
    baseTextRef.current = valueRef.current;
    lastTranscriptRef.current = '';
    appendedSpeechRef.current = '';
    restartSilenceTimer();
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    clearSilenceTimer();
  });

  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    setError(event.message || 'Speech recognition failed.');
    clearSilenceTimer();
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript?.trim();
    if (!transcript) return;
    const previousTranscript = lastTranscriptRef.current;

    let delta = '';
    if (!previousTranscript) {
      delta = transcript;
    } else if (transcript.startsWith(previousTranscript)) {
      delta = transcript.slice(previousTranscript.length).trim();
    } else if (previousTranscript.startsWith(transcript)) {
      delta = '';
    } else {
      delta = transcript;
    }

    if (delta) {
      appendedSpeechRef.current = appendTranscriptDelta(appendedSpeechRef.current, delta);
      const prefix = baseTextRef.current.trim();
      const merged = [prefix, appendedSpeechRef.current].filter(Boolean).join(' ').trim();
      onChange(merged);
    }

    lastTranscriptRef.current = transcript;
    restartSilenceTimer();
  });

  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [listening, pulseAnim]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
    };
  }, []);

  async function toggleListen() {
    setError('');
    if (listening) {
      clearSilenceTimer();
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    try {
      if (!ensureWebSpeechRecognitionGlobal()) {
        setVoiceAvailable(false);
        setError('Speech recognition is not supported in this browser. Please type notes manually.');
        return;
      }

      const permission = permissionChecked
        ? await ExpoSpeechRecognitionModule.getPermissionsAsync()
        : await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      setPermissionChecked(true);

      if (!permission.granted) {
        setVoiceAvailable(false);
        setError('Microphone and speech permissions are required for voice notes.');
        return;
      }

      setVoiceAvailable(true);
      baseTextRef.current = value;
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true,
        addsPunctuation: true,
      });
    } catch (e: any) {
      setError(e?.message ?? 'Could not start voice capture.');
      setListening(false);
    }
  }

  async function handleRefine() {
    if (!value.trim()) return;
    setRefining(true);
    setError('');
    try {
      const refined = await refineNoteWithOpenAI(value, {
        studentName,
        goalSelections: {
          goal1: goalSelections.goal1,
          goal2Primary: goalSelections.goal2Primary,
          goal2Coordination: goalSelections.goal2Coord,
          goal3: goalSelections.goal3,
        },
      });
      onChange(refined);
      Alert.alert('Notes refined', 'You can still edit the text before saving.');
    } catch (e: any) {
      setError(e?.message ?? 'Could not refine notes.');
    } finally {
      setRefining(false);
    }
  }

  const canRefine = Boolean(value.trim()) && !refining;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Notes</Text>
        <TouchableOpacity
          style={[styles.micBtn, listening ? styles.micBtnActive : styles.micBtnIdle]}
          onPress={toggleListen}
          activeOpacity={0.75}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.micIcon}>{listening ? '⏹' : '🎤'}</Text>
          </Animated.View>
          <Text style={[styles.micLabel, listening && styles.micLabelActive]}>
            {listening ? 'Stop' : 'Record'}
          </Text>
        </TouchableOpacity>
      </View>

      {listening && (
        <View style={styles.listeningBanner}>
          <Text style={styles.listeningText}>Recording... speak naturally</Text>
        </View>
      )}

      {!listening && !voiceAvailable && permissionChecked && (
        <Text style={styles.helpText}>Voice unavailable. You can continue with manual typing.</Text>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder={voiceAvailable ? 'Tap mic or type notes here...' : 'Type session notes here...'}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.refineBtn, !canRefine && styles.actionDisabled]}
          onPress={handleRefine}
          disabled={!canRefine}
        >
          {refining ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.refineText}>Refine</Text>}
        </TouchableOpacity>
        {value.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => onChange('')}>
            <Text style={styles.clearText}>Clear notes</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  micBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  micBtnIdle: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  micBtnActive: {
    backgroundColor: '#4A1010',
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  micIcon: {
    fontSize: 16,
  },
  micLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSub,
  },
  micLabelActive: {
    color: '#FF5252',
  },
  listeningBanner: {
    backgroundColor: '#1A0808',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FF5252',
    alignItems: 'center',
  },
  listeningText: {
    color: '#FF7070',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginBottom: 8,
  },
  helpText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 90,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  refineBtn: {
    minWidth: 96,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refineText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  actionDisabled: {
    opacity: 0.45,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
});
