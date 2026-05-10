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
import { ScreenHeader } from '@/components/ScreenHeader';
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

  const exportButton = (
    <TouchableOpacity
      style={[styles.exportBtn, (exporting || assessments.length === 0) && styles.exportBtnDisabled]}
      onPress={handleExport}
      disabled={exporting || assessments.length === 0}
      activeOpacity={0.75}
    >
      {exporting ? (
        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 4 }} />
      ) : (
        <Text style={styles.exportIcon}>⬆</Text>
      )}
      <Text style={styles.exportText}>{exporting ? 'Exporting…' : 'Export CSV'}</Text>
    </TouchableOpacity>
  );

  const countText = assessments.length === 0
    ? 'No sessions recorded yet'
    : `${assessments.length} session${assessments.length !== 1 ? 's' : ''} on record`;

  return (
    <View style={styles.container}>
      <ScreenHeader subtitle={countText} right={exportButton} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading records…</Text>
        </View>
      ) : assessments.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🏊</Text>
          <Text style={styles.emptyTitle}>No Records Yet</Text>
          <Text style={styles.emptyBody}>
            Complete an assessment on the Assessment tab and it will appear here.
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
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Tap a record to expand details</Text>
            </View>
          }
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  exportBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },
  exportIcon: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  exportText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 48,
  },
  listHeader: {
    marginBottom: 10,
  },
  listHeaderText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textSub,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
