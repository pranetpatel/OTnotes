import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Assessment } from './database';

function escapeHtml(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function chipList(items: string[]): string {
  if (!items || items.length === 0) return '<span class="empty">None recorded</span>';
  return items.map(i => `<span class="chip">${escapeHtml(i)}</span>`).join(' ');
}

const BASE_STYLE = `
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0C1A2E; margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 24px 0 8px; border-bottom: 1px solid #C4D6EE; padding-bottom: 4px; }
  .note-block { page-break-inside: avoid; margin-bottom: 28px; }
  .note-block + .note-block { page-break-before: always; }
  .meta-row { display: block; font-size: 12px; color: #3D5A7A; margin-bottom: 2px; }
  .status-reviewed { color: #1A9E5A; font-weight: bold; }
  .status-draft { color: #7A96B4; font-weight: bold; }
  .goal-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #7A96B4; margin: 10px 0 4px; }
  .chip { display: inline-block; background: #E4EEFB; border: 1px solid #3B7FD9; border-radius: 6px; padding: 2px 8px; margin: 2px 4px 2px 0; font-size: 12px; }
  .empty { font-size: 12px; color: #7A96B4; font-style: italic; }
  .notes-box { background: #F4F8FF; border: 1px solid #C4D6EE; border-radius: 8px; padding: 10px 12px; margin-top: 10px; font-size: 13px; line-height: 1.5; }
  .review-box { background: #E6F9EE; border: 1px solid #1A9E5A; border-radius: 8px; padding: 10px 12px; margin-top: 10px; font-size: 13px; line-height: 1.5; }
  table.summary { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  table.summary th, table.summary td { border: 1px solid #C4D6EE; padding: 6px 8px; font-size: 12px; text-align: left; }
  table.summary th { background: #EEF3FB; }
`;

function noteSectionHtml(a: Assessment): string {
  const dt = new Date(a.timestamp);
  const dateStr = dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const statusHtml = a.status === 'reviewed'
    ? `<span class="status-reviewed">Reviewed</span>`
    : `<span class="status-draft">Draft — Pending OT Review</span>`;

  const reviewHtml = a.status === 'reviewed'
    ? `<div class="review-box">
        <strong>OT Sign-Off:</strong> ${a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
        ${a.review_notes ? `<br/><em>${escapeHtml(a.review_notes)}</em>` : ''}
      </div>`
    : '';

  return `
    <div class="note-block">
      <h1>${escapeHtml(a.student_name)}</h1>
      <div class="meta-row">${dateStr} · ${timeStr}</div>
      <div class="meta-row">Staff: ${escapeHtml(a.supervisor_name)}</div>
      <div class="meta-row">Status: ${statusHtml}</div>

      <div class="goal-label">Goal 1 — Core Stability & Postural Control</div>
      ${chipList(a.goal1_selections)}

      <div class="goal-label">Goal 2 — Strength & Propulsion (Effort)</div>
      ${chipList(a.goal2_primary_selections)}

      <div class="goal-label">Goal 2 — Arm/Leg Coordination</div>
      ${chipList(a.goal2_coordination_selections)}

      <div class="goal-label">Goal 3 — Task Initiation & Completion</div>
      ${chipList(a.goal3_selections)}

      ${a.safety_skill_selections?.length ? `
      <div class="goal-label">Safety Skills</div>
      ${chipList(a.safety_skill_selections)}` : ''}

      ${a.notes ? `<div class="notes-box"><strong>Session Notes:</strong><br/>${escapeHtml(a.notes)}</div>` : ''}
      ${reviewHtml}
    </div>
  `;
}

async function generateAndShare(html: string, filenamePrefix: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export ${filenamePrefix}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

export async function exportAssessmentToPDF(assessment: Assessment): Promise<void> {
  const html = `<html><head><meta charset="utf-8" /><style>${BASE_STYLE}</style></head><body>${noteSectionHtml(assessment)}</body></html>`;
  await generateAndShare(html, `${assessment.student_name} Session Note`);
}

export async function exportAssessmentsToBulkPDF(assessments: Assessment[]): Promise<void> {
  const summaryRows = assessments.map(a => {
    const dt = new Date(a.timestamp);
    return `<tr>
      <td>${escapeHtml(a.student_name)}</td>
      <td>${dt.toLocaleDateString('en-US')}</td>
      <td>${escapeHtml(a.supervisor_name)}</td>
      <td>${a.status === 'reviewed' ? 'Reviewed' : 'Draft'}</td>
    </tr>`;
  }).join('');

  const html = `
    <html><head><meta charset="utf-8" /><style>${BASE_STYLE}</style></head>
    <body>
      <h1>OT Session Notes</h1>
      <div class="meta-row">Exported ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · ${assessments.length} session${assessments.length !== 1 ? 's' : ''}</div>
      <h2>Summary</h2>
      <table class="summary">
        <thead><tr><th>Student</th><th>Date</th><th>Staff</th><th>Status</th></tr></thead>
        <tbody>${summaryRows}</tbody>
      </table>
      ${assessments.map(noteSectionHtml).join('')}
    </body></html>
  `;
  await generateAndShare(html, 'OT Session Notes');
}
