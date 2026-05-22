export const STUDENTS = [
  'Alex Johnson',
  'Maya Patel',
  'Liam Rodriguez',
  'Emma Chen',
  'Noah Williams',
  'Sophia Davis',
  'Oliver Martinez',
  'Ava Thompson',
  'Elijah Garcia',
  'Isabella Lee',
  'Lucas Wilson',
  'Mia Anderson',
  'Mason Taylor',
  'Charlotte Brown',
  'Aiden Moore',
];

export const GOAL1_LABEL = 'GOAL 1 — Core Stability & Postural Control';
export const GOAL1_OPTIONS = ['Minimal', 'Emerging', 'Improving', 'Strong'];

export const GOAL2_LABEL = 'GOAL 2 — Strength & Propulsion';
export const GOAL2_PRIMARY_OPTIONS = ['Not yet', 'Emerging', 'Improving', 'Independent'];
export const GOAL2_COORDINATION_OPTIONS = ['Separate', 'Emerging together', 'Coordinated'];

export const GOAL3_LABEL = 'GOAL 3 — Task Initiation & Completion';
export const GOAL3_OPTIONS = [
  'Needed full support',
  'Some support',
  'Minimal support',
  'Independent',
];

export type StudentGoal = {
  focus: string;
  activeGoals: string[];
  safetySkills?: string[];
  adaptations?: string[];
  progressNote?: string;
};

export const STUDENT_GOALS: Record<string, StudentGoal> = {
  'Alex Johnson': {
    focus: 'Safety Skills',
    activeGoals: [
      'Achieve independent wall grab within 3 strokes',
      'Respond to stop signal within 2 seconds consistently',
      'Maintain back float for 5 seconds with minimal assist',
    ],
    safetySkills: [
      'No independent entry — requires hand-over-hand at steps',
      'Alert staff if bolts toward deep end (known behavior)',
    ],
    adaptations: ['Visual countdown board before transitions', 'Extra 10 sec processing time for verbal cues'],
    progressNote: 'Improved wall grab initiation from max assist to moderate assist over 4 weeks.',
  },
  'Maya Patel': {
    focus: 'Aquatic Independence',
    activeGoals: [
      'Complete 10m freestyle with bilateral arm coordination (Goal 2)',
      'Initiate and complete entry sequence independently (Goal 3)',
      'Sustain core engagement through full lap (Goal 1)',
    ],
    adaptations: ['Noise-canceling ear plugs in use — tap shoulder for attention'],
    progressNote: 'Arm/leg coordination now at "Emerging together" — targeting coordinated by end of session block.',
  },
  'Liam Rodriguez': {
    focus: 'Safety Skills',
    activeGoals: [
      'Roll to back float within 5 seconds of submersion',
      'Call for help and wave arm when in distress',
      'Exit pool independently via ladder',
    ],
    safetySkills: [
      'Non-verbal — use visual cue cards only',
      'High elopement risk: always close pool gate before session',
    ],
    adaptations: ['Weighted vest during deck transitions', 'Preferred motivator: yellow kick board'],
    progressNote: 'Successfully rolled to back float with verbal prompt only (prev: physical assist) in last 2 sessions.',
  },
  'Emma Chen': {
    focus: 'Core Stability & Coordination',
    activeGoals: [
      'Maintain streamline position for 3m push-off (Goal 1)',
      'Coordinate arm pull with kick in freestyle (Goal 2)',
      'Complete warm-up sequence with minimal prompting (Goal 3)',
    ],
    progressNote: 'Core stability rated "Improving" — targeting "Strong" by program end.',
  },
  'Noah Williams': {
    focus: 'Strength & Propulsion',
    activeGoals: [
      'Propel independently for 15m using flutter kick (Goal 2)',
      'Maintain postural alignment during backstroke (Goal 1)',
      'Self-regulate effort level with visual effort scale (Goal 2)',
    ],
    adaptations: ['Frequent rest breaks — flag fatigue signs (slumped posture, slower kick)'],
    progressNote: 'Effort level up to "Improving" from "Not yet" over 6 sessions.',
  },
  'Sophia Davis': {
    focus: 'Safety Skills',
    activeGoals: [
      'Tread water for 30 seconds independently',
      'Swim to wall unassisted from center of lane',
      'Follow 2-step pool rules independently',
    ],
    safetySkills: [
      'Seizure history — spotter must remain within arm\'s reach at all times',
      'Emergency plan on file with head coach',
    ],
    adaptations: ['Swim cap must be worn (sensory — prevents ear water discomfort)', 'Keep session under 25 min — fatigue threshold'],
    progressNote: 'Treading water reached 18 seconds independently. On track.',
  },
  'Oliver Martinez': {
    focus: 'Task Initiation & Completion',
    activeGoals: [
      'Initiate entry within 30 seconds of cue (Goal 3)',
      'Complete full drill sequence without redirection (Goal 3)',
      'Maintain effort across full session length (Goal 2)',
    ],
    adaptations: ['First-Then board on pool deck', 'Preferred: high-five reinforcement after each drill'],
    progressNote: 'Initiation time reduced from 90s avg to 45s avg. Goal: under 30s.',
  },
  'Ava Thompson': {
    focus: 'Aquatic Independence',
    activeGoals: [
      'Complete 25m lap independently (Goal 2)',
      'Demonstrate strong postural core through turn (Goal 1)',
      'Self-monitor and correct stroke technique (Goal 3)',
    ],
    progressNote: 'Most advanced swimmer — working on self-regulation and technique refinement.',
  },
  'Elijah Garcia': {
    focus: 'Safety Skills & Entry/Exit',
    activeGoals: [
      'Enter pool via steps using alternating feet independently',
      'Exit pool using ladder with hand support only',
      'Float on back for 10 seconds with verbal encouragement only',
    ],
    safetySkills: [
      'Does not communicate pain verbally — watch for facial cues',
      'Two-person assist required for all transfers off pool deck',
    ],
    adaptations: ['Aquatic wheelchair transfer — see transfer protocol binder', 'Session max 20 min due to thermoregulation needs'],
    progressNote: 'Entry now at hand support only (prev: full assist). Exit still full assist.',
  },
  'Isabella Lee': {
    focus: 'Core Stability & Sensory Regulation',
    activeGoals: [
      'Tolerate full submersion to chin level without distress (Goal 1)',
      'Sustain kick with kick board for 10m (Goal 2)',
      'Transition between drills with one verbal prompt (Goal 3)',
    ],
    adaptations: ['Sensory sensitive — slow water entry, no splashing at start', 'Use calm voice, avoid sudden movements near face'],
    progressNote: 'Submersion tolerance improving — reached chin level last session (was shoulder level).',
  },
  'Lucas Wilson': {
    focus: 'Strength & Endurance',
    activeGoals: [
      'Complete 4 consecutive 10m laps with minimal rest (Goal 2)',
      'Sustain bilateral arm coordination across full length (Goal 2)',
      'Demonstrate consistent core engagement through fatigue (Goal 1)',
    ],
    progressNote: 'Coordination rated "Coordinated" — now pushing endurance and core consistency.',
  },
  'Mia Anderson': {
    focus: 'Task Initiation & Safety',
    activeGoals: [
      'Initiate requested drill within 20 seconds of cue (Goal 3)',
      'Demonstrate independent pool rule recall (x3 rules) before entry',
      'Propel to wall from middle of pool without assist (Goal 2)',
    ],
    safetySkills: ['Wears life jacket for deep end — do not remove without supervisor approval'],
    adaptations: ['Short, direct 1-step instructions only', 'Reinforce with thumbs-up, not verbal praise (overstimulating)'],
    progressNote: 'Rule recall now at 2/3 independently. Working on third rule.',
  },
  'Mason Taylor': {
    focus: 'Aquatic Independence',
    activeGoals: [
      'Achieve "Independent" on all Goal 3 task completion indicators',
      'Sustain "Strong" core stability through full 25m (Goal 1)',
      'Self-correct stroke without verbal cue (Goal 2)',
    ],
    progressNote: 'Transitioning toward independent aquatic program — reducing prompts systematically.',
  },
  'Charlotte Brown': {
    focus: 'Safety Skills',
    activeGoals: [
      'Respond to whistle signal and freeze within 1 second',
      'Back float for 15 seconds independently',
      'Demonstrate safe jump entry (feet first, arms in)',
    ],
    safetySkills: [
      'Impulsive — high risk of unauthorized entry, always block pool steps when not active',
      'Buddy system required at all times',
    ],
    adaptations: ['Visual schedule posted at bench', 'Reinforce wait behavior before every entry'],
    progressNote: 'Whistle response now consistent in calm conditions. Working on generalization to group noise.',
  },
  'Aiden Moore': {
    focus: 'Core Stability & Postural Control',
    activeGoals: [
      'Maintain neutral spine alignment during back float (Goal 1)',
      'Initiate arm recovery from hip, not shoulder (Goal 2)',
      'Complete session routine with "Minimal support" (Goal 3)',
    ],
    adaptations: ['Prone positioning difficult — avoid extended front float drills', 'Check in on joint pain at session start'],
    progressNote: 'Goal 1 improving steadily — "Emerging" to "Improving" over 5 sessions.',
  },
};

export const COLORS = {
  // Backgrounds
  bg: '#EEF3FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F8FF',
  surfaceHighlight: '#E6EEF9',

  // Brand — SuperSwims blue
  primary: '#3B7FD9',
  primaryDim: '#E4EEFB',
  primaryLight: '#2B68C0',

  // Selected / active state (darkened aqua — readable on white)
  accent: '#007FAA',
  accentDim: '#DFF5FC',

  // Semantic
  success: '#1A9E5A',
  danger: '#D93025',

  // Text
  text: '#0C1A2E',
  textSub: '#3D5A7A',
  textMuted: '#7A96B4',

  // Structure
  border: '#C4D6EE',
  cardBorder: '#D0E0F2',
  tabBar: '#FFFFFF',

  // Left-border accent on goal cards
  leftAccent: '#3B7FD9',
};
