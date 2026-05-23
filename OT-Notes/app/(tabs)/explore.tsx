import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AssessmentCard } from '@/components/AssessmentCard';
import { getAllAssessments, deleteAssessment, Assessment } from '@/services/database';
import { exportToCSV } from '@/services/csvExport';
import { COLORS } from '@/constants/data';
import { showAlert } from '@/utils/alert';

type SortKey = 'date' | 'name' | 'time';
type SortDir = 'asc' | 'desc';

const SORT_LABELS: Record<SortKey, string> = {
  date: 'Date',
  name: 'Name',
  time: 'Time of Day',
};

export default function HistoryScreen() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const loadData = useCallback(() => {
    setLoading(true);
    getAllAssessments()
      .then(data => setAssessments(data))
      .catch((e: any) => showAlert('Error', 'Could not load assessments: ' + e?.message))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadData);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'date' ? 'desc' : 'asc');
    }
  }

  const sortedAssessments = useMemo(() => {
    return [...assessments].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortKey === 'name') {
        cmp = a.student_name.localeCompare(b.student_name);
      } else if (sortKey === 'time') {
        const ta = new Date(a.timestamp);
        const tb = new Date(b.timestamp);
        cmp = (ta.getHours() * 60 + ta.getMinutes()) - (tb.getHours() * 60 + tb.getMinutes());
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [assessments, sortKey, sortDir]);

  function handleDelete(id: number) {
    deleteAssessment(id)
      .then(() => setAssessments(prev => prev.filter(a => a.id !== id)))
      .catch((e: any) => showAlert('Delete Error', e?.message));
  }

  function handleEdit(id: number) {
    router.push({ pathname: '/edit-assessment', params: { id: String(id) } });
  }

  async function handleExport() {
    if (sortedAssessments.length === 0) {
      showAlert('Nothing to Export', 'Record some assessments first.');
      return;
    }
    setExporting(true);
    try {
      await exportToCSV(sortedAssessments);
    } catch (e: any) {
      showAlert('Export Failed', e?.message ?? 'Could not export CSV.');
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

  const sortBar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.sortBarScroll}
      contentContainerStyle={styles.sortBarContent}
    >
      {(['date', 'name', 'time'] as SortKey[]).map(key => {
        const active = sortKey === key;
        const arrow = active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
        return (
          <TouchableOpacity
            key={key}
            style={[styles.sortPill, active && styles.sortPillActive]}
            onPress={() => toggleSort(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sortPillText, active && styles.sortPillTextActive]}>
              {SORT_LABELS[key]}{arrow}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

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
          data={sortedAssessments}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <AssessmentCard assessment={item} onDelete={handleDelete} onEdit={handleEdit} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {sortBar}
              <Text style={styles.listHeaderText}>
                Sorted by {SORT_LABELS[sortKey]} · {sortDir === 'desc' ? (sortKey === 'name' ? 'Z→A' : 'newest/latest first') : (sortKey === 'name' ? 'A→Z' : 'oldest/earliest first')} · tap to toggle
              </Text>
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
  sortBarScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  sortBarContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  sortPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSub,
  },
  sortPillTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 48,
  },
  listHeaderText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 10,
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
