import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Assessment } from './database';

function escapeCell(value: string): string {
  const str = value ?? '';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportToCSV(assessments: Assessment[]): Promise<void> {
  const headers = [
    'Student',
    'Supervisor',
    'Date',
    'Time',
    'Goal 1 – Core Stability & Postural Control',
    'Goal 2 – Strength & Propulsion (Primary)',
    'Goal 2 – Strength & Propulsion (Coordination)',
    'Goal 3 – Task Initiation & Completion',
    'Notes',
  ];

  const rows = assessments.map(a => {
    const dt = new Date(a.timestamp);
    const date = dt.toLocaleDateString('en-US');
    const time = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return [
      a.student_name,
      a.supervisor_name,
      date,
      time,
      a.goal1_selections.join('; '),
      a.goal2_primary_selections.join('; '),
      a.goal2_coordination_selections.join('; '),
      a.goal3_selections.join('; '),
      a.notes,
    ]
      .map(escapeCell)
      .join(',');
  });

  const csvContent = [headers.map(escapeCell).join(','), ...rows].join('\r\n');
  const filename = `OT_Assessments_${new Date().toISOString().split('T')[0]}.csv`;

  const file = new File(Paths.document, filename);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(csvContent);

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export OT Assessments',
      UTI: 'public.comma-separated-values-text',
    });
  }
}
