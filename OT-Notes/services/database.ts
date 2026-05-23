import { supabase } from './supabase';

export interface Assessment {
  id?: number;
  student_name: string;
  supervisor_name: string;
  timestamp: string;
  goal1_selections: string[];
  goal2_primary_selections: string[];
  goal2_coordination_selections: string[];
  goal3_selections: string[];
  safety_skill_selections: string[];
  notes: string;
}

export function initDatabase(): void {}

export async function saveAssessment(assessment: Omit<Assessment, 'id'>): Promise<void> {
  const { error } = await supabase.from('assessments').insert([assessment]);
  if (error) throw new Error(error.message);
}

export async function getAllAssessments(): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Assessment[];
}

export async function updateAssessment(id: number, assessment: Omit<Assessment, 'id'>): Promise<void> {
  const { error } = await supabase.from('assessments').update(assessment).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAssessment(id: number): Promise<void> {
  const { error } = await supabase.from('assessments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function seedDummyData(): Promise<number> {
  const supervisors = ['Sarah K.', 'Dr. Rivera', 'Tom B.', 'Priya N.'];
  const now = new Date();

  function ts(daysAgo: number, hour: number): string {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, Math.floor(Math.random() * 50), 0, 0);
    return d.toISOString();
  }

  const sup = (i: number) => supervisors[i % supervisors.length];

  const records: Omit<Assessment, 'id'>[] = [
    // Alex Johnson — Safety Skills
    { student_name: 'Alex Johnson', supervisor_name: sup(0), timestamp: ts(54, 17), goal1_selections: ['Minimal'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Needed full support'], safety_skill_selections: [], notes: 'Required hand-over-hand for all transitions. Bolted toward deep end twice.' },
    { student_name: 'Alex Johnson', supervisor_name: sup(1), timestamp: ts(33, 18), goal1_selections: ['Emerging'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Wall grab improving — initiated with verbal cue twice. Stop signal response ~3 sec.' },
    { student_name: 'Alex Johnson', supervisor_name: sup(0), timestamp: ts(12, 17), goal1_selections: ['Emerging', 'Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Emerging together'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Good session. Wall grab initiated independently once. Back float held 4 sec with minimal assist.' },
    { student_name: 'Alex Johnson', supervisor_name: sup(2), timestamp: ts(3, 17), goal1_selections: ['Improving'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Emerging together'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Stop signal response down to ~2 sec consistently. Great improvement this block.' },

    // Maya Patel — Aquatic Independence
    { student_name: 'Maya Patel', supervisor_name: sup(1), timestamp: ts(50, 10), goal1_selections: ['Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Ear plugs in — used shoulder tap for cues. Arm coordination lagging but improving.' },
    { student_name: 'Maya Patel', supervisor_name: sup(3), timestamp: ts(29, 9), goal1_selections: ['Improving'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Emerging together'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Entry sequence completed independently. Arm/leg coordination at emerging together — on track.' },
    { student_name: 'Maya Patel', supervisor_name: sup(1), timestamp: ts(8, 10), goal1_selections: ['Strong'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Excellent lap — full coordinated stroke maintained for 10m. Core engagement strong throughout.' },

    // Liam Rodriguez — Safety Skills
    { student_name: 'Liam Rodriguez', supervisor_name: sup(2), timestamp: ts(56, 16), goal1_selections: ['Minimal'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Needed full support'], safety_skill_selections: [], notes: 'Pool gate secured before session. Used visual cue cards throughout. High elopement — staff positioned at gate.' },
    { student_name: 'Liam Rodriguez', supervisor_name: sup(0), timestamp: ts(35, 15), goal1_selections: ['Emerging'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Needed full support'], safety_skill_selections: [], notes: 'Back float roll attempted — required physical assist. Preferred yellow kickboard as motivator — worked well.' },
    { student_name: 'Liam Rodriguez', supervisor_name: sup(2), timestamp: ts(14, 16), goal1_selections: ['Emerging'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Rolled to back float with verbal prompt only — significant improvement. Ladder exit improving.' },
    { student_name: 'Liam Rodriguez', supervisor_name: sup(0), timestamp: ts(2, 15), goal1_selections: ['Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Back float with verbal prompt — held 4 sec. Arm wave practiced in shallow end with success.' },

    // Emma Chen — Core Stability & Coordination
    { student_name: 'Emma Chen', supervisor_name: sup(3), timestamp: ts(48, 18), goal1_selections: ['Emerging'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Streamline push-off reaching about 1.5m. Warm-up sequence needed 3 redirections.' },
    { student_name: 'Emma Chen', supervisor_name: sup(1), timestamp: ts(27, 17), goal1_selections: ['Improving'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Emerging together'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Streamline held for 2.5m — close to goal. Coordination getting cleaner.' },
    { student_name: 'Emma Chen', supervisor_name: sup(3), timestamp: ts(6, 18), goal1_selections: ['Improving'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Streamline 3m achieved — goal met! Arm/leg coordination rated coordinated for first time.' },

    // Noah Williams — Strength & Propulsion
    { student_name: 'Noah Williams', supervisor_name: sup(0), timestamp: ts(52, 9), goal1_selections: ['Emerging'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Flutter kick covers about 8m before stopping. Posture alignment moderate. Rest break after each length.' },
    { student_name: 'Noah Williams', supervisor_name: sup(2), timestamp: ts(31, 10), goal1_selections: ['Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Flutter kick to 12m — near goal. Backstroke posture improving. Used visual effort scale well today.' },
    { student_name: 'Noah Williams', supervisor_name: sup(0), timestamp: ts(11, 9), goal1_selections: ['Improving'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Emerging together'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: '15m flutter kick reached — goal achieved! Effort self-regulation improving nicely.' },

    // Sophia Davis — Safety Skills
    { student_name: 'Sophia Davis', supervisor_name: sup(1), timestamp: ts(55, 14), goal1_selections: ['Emerging'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Seizure protocol reviewed with staff. Spotter within arm\'s reach entire session. Treading water ~10 sec.' },
    { student_name: 'Sophia Davis', supervisor_name: sup(3), timestamp: ts(34, 15), goal1_selections: ['Emerging', 'Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Treading water 14 sec — good improvement. Swim cap worn — no discomfort reported. Session kept under 25 min.' },
    { student_name: 'Sophia Davis', supervisor_name: sup(1), timestamp: ts(13, 14), goal1_selections: ['Improving'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Emerging together'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Treading water hit 18 sec independently — on track. Swam to wall unassisted from half-lane. Pool rules 2/3 independently.' },
    { student_name: 'Sophia Davis', supervisor_name: sup(3), timestamp: ts(1, 15), goal1_selections: ['Improving'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Treading water 22 sec — exceeding target. Wall swim from center achieved independently. Great session.' },

    // Oliver Martinez — Task Initiation
    { student_name: 'Oliver Martinez', supervisor_name: sup(2), timestamp: ts(49, 17), goal1_selections: ['Emerging'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Needed full support'], safety_skill_selections: [], notes: 'Initiation time ~85 sec average. First-Then board in use — helped with transitions. High-five reinforcement effective.' },
    { student_name: 'Oliver Martinez', supervisor_name: sup(0), timestamp: ts(28, 18), goal1_selections: ['Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Entry initiation down to ~55 sec. Completed 2 of 3 drills without redirection — improvement.' },
    { student_name: 'Oliver Martinez', supervisor_name: sup(2), timestamp: ts(7, 17), goal1_selections: ['Improving'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Emerging together'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Entry initiation ~38 sec — close to goal. Effort maintained across full session. Good day.' },

    // Ava Thompson — Aquatic Independence
    { student_name: 'Ava Thompson', supervisor_name: sup(3), timestamp: ts(46, 11), goal1_selections: ['Strong'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Most advanced swimmer. Self-correction on stroke technique showing well. 25m lap with good form.' },
    { student_name: 'Ava Thompson', supervisor_name: sup(1), timestamp: ts(25, 10), goal1_selections: ['Strong'], goal2_primary_selections: ['Independent'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: '25m independent lap completed with strong core throughout turn. Self-monitoring improving.' },
    { student_name: 'Ava Thompson', supervisor_name: sup(3), timestamp: ts(4, 11), goal1_selections: ['Strong'], goal2_primary_selections: ['Independent'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Independent'], safety_skill_selections: [], notes: 'Outstanding session. Fully independent 25m lap with self-correction observed twice without cuing. Ready to progress.' },

    // Elijah Garcia — Safety Skills & Entry/Exit
    { student_name: 'Elijah Garcia', supervisor_name: sup(0), timestamp: ts(53, 14), goal1_selections: ['Minimal'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Needed full support'], safety_skill_selections: [], notes: 'Two-person transfer completed per protocol. Entry via steps — full assist. Facial cues monitored throughout. Session max 20 min.' },
    { student_name: 'Elijah Garcia', supervisor_name: sup(2), timestamp: ts(32, 15), goal1_selections: ['Emerging'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Needed full support'], safety_skill_selections: [], notes: 'Step entry improved — hand-over-hand only. Back float attempted — verbal cue required. Good thermoregulation throughout.' },
    { student_name: 'Elijah Garcia', supervisor_name: sup(0), timestamp: ts(10, 14), goal1_selections: ['Emerging'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Entry via steps with hand support only — goal nearly met. Float 6 sec with verbal encouragement. Ladder exit still full assist.' },

    // Isabella Lee — Core Stability & Sensory
    { student_name: 'Isabella Lee', supervisor_name: sup(1), timestamp: ts(51, 9), goal1_selections: ['Minimal'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Slow water entry used — no splashing protocol followed. Water tolerance to shoulder level only. Kickboard drill 5m.' },
    { student_name: 'Isabella Lee', supervisor_name: sup(3), timestamp: ts(30, 10), goal1_selections: ['Emerging'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Submersion to chin level — improved from shoulder. Kickboard 8m achieved. Transition with one verbal prompt.' },
    { student_name: 'Isabella Lee', supervisor_name: sup(1), timestamp: ts(9, 9), goal1_selections: ['Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Emerging together'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Chin submersion comfortable — now working toward full face. Kickboard 10m target met! Good sensory regulation today.' },

    // Lucas Wilson — Strength & Endurance
    { student_name: 'Lucas Wilson', supervisor_name: sup(2), timestamp: ts(47, 16), goal1_selections: ['Improving'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Coordination rated coordinated — now pushing endurance. Completed 2 consecutive 10m laps with short rest.' },
    { student_name: 'Lucas Wilson', supervisor_name: sup(0), timestamp: ts(26, 17), goal1_selections: ['Improving', 'Strong'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: '3 consecutive laps — good core engagement through lap 2, slipping by lap 3. Rest protocol adjusted.' },
    { student_name: 'Lucas Wilson', supervisor_name: sup(2), timestamp: ts(5, 16), goal1_selections: ['Strong'], goal2_primary_selections: ['Independent'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: '4 consecutive 10m laps with minimal rest — goal met. Core stayed engaged throughout. Excellent endurance session.' },

    // Mia Anderson — Task Initiation & Safety
    { student_name: 'Mia Anderson', supervisor_name: sup(3), timestamp: ts(50, 18), goal1_selections: ['Emerging'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Needed full support'], safety_skill_selections: [], notes: 'Life jacket worn for deep end — not removed. Short 1-step instructions used. Pool rules recalled 1/3 independently.' },
    { student_name: 'Mia Anderson', supervisor_name: sup(1), timestamp: ts(29, 17), goal1_selections: ['Emerging'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Initiation ~30 sec today. Rule recall 2/3 independently. Thumbs-up reinforcement — responded well as usual.' },
    { student_name: 'Mia Anderson', supervisor_name: sup(3), timestamp: ts(8, 18), goal1_selections: ['Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Emerging together'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Propelled to wall from middle of pool — goal achieved! Rule recall 3/3 independently today for first time. Excellent.' },

    // Mason Taylor — Aquatic Independence
    { student_name: 'Mason Taylor', supervisor_name: sup(0), timestamp: ts(45, 11), goal1_selections: ['Strong'], goal2_primary_selections: ['Improving'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Systematic prompt reduction in progress. Completed full session with moderate prompts. Self-correction attempts observed.' },
    { student_name: 'Mason Taylor', supervisor_name: sup(2), timestamp: ts(24, 10), goal1_selections: ['Strong'], goal2_primary_selections: ['Independent'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Goal 2 now independent. Task completion down to minimal support. Self-correct stroke without cue — twice this session.' },
    { student_name: 'Mason Taylor', supervisor_name: sup(0), timestamp: ts(4, 11), goal1_selections: ['Strong'], goal2_primary_selections: ['Independent'], goal2_coordination_selections: ['Coordinated'], goal3_selections: ['Independent'], safety_skill_selections: [], notes: 'All Goal 3 indicators at independent — target achieved. Goal 1 consistently strong. Transitioning to independent program.' },

    // Charlotte Brown — Safety Skills
    { student_name: 'Charlotte Brown', supervisor_name: sup(1), timestamp: ts(57, 15), goal1_selections: ['Minimal'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Needed full support'], safety_skill_selections: [], notes: 'Pool steps blocked when not active — no unauthorized entry incidents. Whistle response ~4 sec in quiet conditions. Buddy system maintained.' },
    { student_name: 'Charlotte Brown', supervisor_name: sup(3), timestamp: ts(36, 14), goal1_selections: ['Emerging'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Whistle response improving — consistent in calm conditions (~1.5 sec). Back float 8 sec. Visual schedule working well.' },
    { student_name: 'Charlotte Brown', supervisor_name: sup(1), timestamp: ts(15, 15), goal1_selections: ['Emerging'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Whistle response consistent now across conditions. Back float 12 sec. Jump entry practiced — feet first form improving.' },
    { student_name: 'Charlotte Brown', supervisor_name: sup(3), timestamp: ts(3, 14), goal1_selections: ['Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Back float 15 sec — goal met. Safe jump entry demonstrated independently twice. Great progress this block.' },

    // Aiden Moore — Core Stability & Postural Control
    { student_name: 'Aiden Moore', supervisor_name: sup(2), timestamp: ts(53, 18), goal1_selections: ['Emerging'], goal2_primary_selections: ['Not yet'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Some support'], safety_skill_selections: [], notes: 'Joint pain check at session start — none reported. Prone positioning avoided. Back float neutral spine work.' },
    { student_name: 'Aiden Moore', supervisor_name: sup(0), timestamp: ts(32, 19), goal1_selections: ['Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Separate'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Neutral spine improving in back float. Arm recovery from hip — cued once, self-corrected once. Good progress.' },
    { student_name: 'Aiden Moore', supervisor_name: sup(2), timestamp: ts(11, 18), goal1_selections: ['Improving'], goal2_primary_selections: ['Emerging'], goal2_coordination_selections: ['Emerging together'], goal3_selections: ['Minimal support'], safety_skill_selections: [], notes: 'Core stability consistent — "Improving" maintained. Session routine completed with minimal support. Arm recovery technique cleaner.' },
  ];

  const { error } = await supabase.from('assessments').insert(records);
  if (error) throw new Error(error.message);
  return records.length;
}
