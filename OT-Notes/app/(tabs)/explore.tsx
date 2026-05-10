import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AssessmentCard } from '@/components/AssessmentCard';
import { getAllAssessments, deleteAssessment, Assessment } from '@/services/database';
import { exportToCSV } from '@/services/csvExport';
import { COLORS } from '@/constants/data';

export default function HistoryScreen() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    try {
      const data = getAllAssessments();
      setAssessments(data);
    } catch (e: any) {
      Alert.alert('Error', 'Could not load assessments: ' + e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(loadData);

  function handleDelete(id: number) {
    deleteAssessment(id);
    setAssessments(prev => prev.filter(a => a.id !== id));
  }

  async function handleExport() {
    if (assessments.length === 0) {
      Alert.alert('Nothing to Export', 'Record some assessments first.');
      return;
    }
    setExporting(true);
    try {
      await exportToCSV(assessments);
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message ?? 'Could not export CSV.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Records</Text>
          <Text style={styles.subtitle}>
            {assessments.length === 0
              ? 'No assessments yet'
              : `${assessments.length} session${assessments.length !== 1 ? 's' : ''} recorded`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
          onPress={handleExport}
          disabled={exporting || assessments.length === 0}
          activeOpacity={0.75}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.exportIcon}>↑</Text>
          )}
          <Text style={styles.exportText}>{exporting ? 'Exporting…' : 'Export CSV'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : assessments.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No records yet</Text>
          <Text style={styles.emptyBody}>
            Complete an assessment on the first tab and it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={assessments}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <AssessmentCard assessment={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    paddingTop: Platform.OS === 'android' ? 50 : 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  exportBtnDisabled: {
    opacity: 0.5,
  },
  exportIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  exportText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textSub,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
