const DEBUG_ENDPOINT = 'http://127.0.0.1:7734/ingest/c079974f-ddd0-47ec-9f6b-db9a6b9cfe8e';
const STORAGE_KEY = 'ot_assessments_v1';

function debugLog(hypothesisId: string, location: string, message: string, data: Record<string, unknown>) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '31309a' },
    body: JSON.stringify({
      sessionId: '31309a',
      runId: 'initial',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

export interface Assessment {
  id?: number;
  student_name: string;
  supervisor_name: string;
  timestamp: string;
  goal1_selections: string[];
  goal2_primary_selections: string[];
  goal2_coordination_selections: string[];
  goal3_selections: string[];
  notes: string;
}

function getMemoryStore(): Assessment[] {
  const globalWithStore = globalThis as { __otAssessmentsStore?: Assessment[] };
  if (!globalWithStore.__otAssessmentsStore) {
    globalWithStore.__otAssessmentsStore = [];
  }
  return globalWithStore.__otAssessmentsStore;
}

function readAssessments(): Assessment[] {
  try {
    if (typeof localStorage === 'undefined') return getMemoryStore();
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Assessment[]) : [];
  } catch {
    return getMemoryStore();
  }
}

function writeAssessments(items: Assessment[]): void {
  if (typeof localStorage === 'undefined') {
    const store = getMemoryStore();
    store.splice(0, store.length, ...items);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function initDatabase(): void {
  // #region agent log
  debugLog('H9', 'services/database.ts:initDatabase:portable', 'Using portable storage backend', {
    hasLocalStorage: typeof localStorage !== 'undefined',
  });
  // #endregion
}

export function saveAssessment(assessment: Omit<Assessment, 'id'>): void {
  // #region agent log
  debugLog('H2', 'services/database.ts:saveAssessment:input', 'Saving assessment payload', {
    student: assessment.student_name,
    supervisorLength: assessment.supervisor_name.length,
    goal1Count: assessment.goal1_selections.length,
    goal2PrimaryCount: assessment.goal2_primary_selections.length,
    goal2CoordCount: assessment.goal2_coordination_selections.length,
    goal3Count: assessment.goal3_selections.length,
    notesLength: assessment.notes.length,
  });
  // #endregion
  try {
    const existing = readAssessments();
    const nextId = existing.length > 0 ? Math.max(...existing.map((item) => item.id ?? 0)) + 1 : 1;
    writeAssessments([{ ...assessment, id: nextId }, ...existing]);
    // #region agent log
    debugLog('H9', 'services/database.ts:saveAssessment:success', 'Assessment saved to portable store', {
      student: assessment.student_name,
      count: existing.length + 1,
    });
    // #endregion
  } catch (error) {
    // #region agent log
    debugLog('H2', 'services/database.ts:saveAssessment:error', 'Saving assessment failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    // #endregion
    throw error;
  }
}

export function getAllAssessments(): Assessment[] {
  try {
    const rows = readAssessments().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    // #region agent log
    debugLog('H9', 'services/database.ts:getAllAssessments:rows', 'Fetched assessments', {
      rowCount: rows.length,
    });
    // #endregion
    return rows;
  } catch (error) {
    // #region agent log
    debugLog('H3', 'services/database.ts:getAllAssessments:error', 'Reading assessments failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    // #endregion
    throw error;
  }
}

export function deleteAssessment(id: number): void {
  const filtered = readAssessments().filter((item) => item.id !== id);
  writeAssessments(filtered);
}
