export interface TimeSlot {
  id: string;
  label: string;
  shortLabel: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  days: number[]; // 0=Sun, 1=Mon..6=Sat
}

export const TIME_SLOTS: TimeSlot[] = [
  {
    id: 'weekday-evening',
    label: '5:00 – 8:00 PM',
    shortLabel: '5–8 PM',
    startHour: 17, startMinute: 0,
    endHour: 20, endMinute: 0,
    days: [1, 2, 3, 4],
  },
  {
    id: 'friday-evening',
    label: '4:30 – 7:30 PM',
    shortLabel: '4:30–7:30 PM',
    startHour: 16, startMinute: 30,
    endHour: 19, endMinute: 30,
    days: [5],
  },
  {
    id: 'saturday-morning',
    label: '9:00 AM – 12:30 PM',
    shortLabel: '9 AM–12:30',
    startHour: 9, startMinute: 0,
    endHour: 12, endMinute: 30,
    days: [6],
  },
  {
    id: 'saturday-afternoon',
    label: '1:30 – 5:00 PM',
    shortLabel: '1:30–5 PM',
    startHour: 13, startMinute: 30,
    endHour: 17, endMinute: 0,
    days: [6],
  },
  {
    id: 'sunday-morning',
    label: '9:00 AM – 12:00 PM',
    shortLabel: '9 AM–12 PM',
    startHour: 9, startMinute: 0,
    endHour: 12, endMinute: 0,
    days: [0],
  },
  {
    id: 'sunday-afternoon',
    label: '1:00 – 4:00 PM',
    shortLabel: '1–4 PM',
    startHour: 13, startMinute: 0,
    endHour: 16, endMinute: 0,
    days: [0],
  },
  {
    id: 'sunday-evening',
    label: '5:00 – 8:00 PM',
    shortLabel: '5–8 PM',
    startHour: 17, startMinute: 0,
    endHour: 20, endMinute: 0,
    days: [0],
  },
];

export function getSlotsForDay(dayOfWeek: number): TimeSlot[] {
  return TIME_SLOTS.filter(s => s.days.includes(dayOfWeek));
}

export function getCurrentSlot(now: Date = new Date()): TimeSlot | null {
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  return getSlotsForDay(day).find(s => {
    const start = s.startHour * 60 + s.startMinute;
    const end = s.endHour * 60 + s.endMinute;
    return mins >= start && mins < end;
  }) ?? null;
}

export function getNextSlot(now: Date = new Date()): { slot: TimeSlot; minutesUntil: number } | null {
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const upcoming = getSlotsForDay(day).find(s => s.startHour * 60 + s.startMinute > mins);
  if (!upcoming) return null;
  return { slot: upcoming, minutesUntil: upcoming.startHour * 60 + upcoming.startMinute - mins };
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
