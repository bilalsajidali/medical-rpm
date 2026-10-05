import { differenceInMinutes, differenceInYears, format, isToday, isYesterday } from 'date-fns';
import type { Patient, Reading, Role, TimeEntry, User, VitalKey } from '@/data/types';

type Person = Pick<User, 'firstName' | 'lastName' | 'role' | 'title'>;

/** "Dr. A. Patel", "Nina Lopez" */
export function displayName(u: Person): string {
  return u.role === 'doctor' ? `Dr. ${u.firstName} ${u.lastName}` : `${u.firstName} ${u.lastName}`;
}

/** "Dr. A. Patel", "Nina Lopez, RN" */
export function nameWithCredential(u: Person): string {
  if (u.role === 'doctor') return displayName(u);
  if (u.title === 'RN' || u.title === 'LVN') return `${u.firstName} ${u.lastName}, ${u.title}`;
  return displayName(u);
}

/** "Nina L.", "Dr. Patel" */
export function shortName(u: Person): string {
  return u.role === 'doctor' ? `Dr. ${u.lastName}` : `${u.firstName} ${u.lastName.charAt(0)}.`;
}

/** "Dr. B. Carter" (billing tables) */
export function doctorShort(u: Person): string {
  return `Dr. ${u.firstName.charAt(0)}. ${u.lastName}`;
}

export function initials(first: string, last: string): string {
  return `${first.replace(/[^A-Za-z]/g, '').charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function patientName(p: Pick<Patient, 'firstName' | 'lastName'>): string {
  return `${p.firstName} ${p.lastName}`;
}

export function ageOf(dob: string, now: Date = new Date()): number {
  return differenceInYears(now, new Date(`${dob}T12:00:00`));
}

const ROLE_LABEL: Record<Role, string> = {
  patient: 'Patient', nurse: 'Nurse', doctor: 'Doctor', clinic_admin: 'Clinic admin', super_admin: 'Super admin',
};

/** Team role label: "Nurse (RN)", "Medical assistant", "Call center". */
export function roleLabel(u: Pick<User, 'role' | 'title'>): string {
  if (u.role === 'nurse') {
    if (u.title === 'RN' || u.title === 'LVN') return `Nurse (${u.title})`;
    if (u.title === 'MA') return 'Medical assistant';
    if (u.title) return u.title;
  }
  return ROLE_LABEL[u.role];
}

/** "Today, 2:43 PM" · "Yesterday, 7:15 PM" · "Sep 23, 8:12 AM" */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

export const formatTime = (iso: string | Date) => format(new Date(iso), 'h:mm a');
export const formatDate = (iso: string | Date) => format(new Date(iso), 'MMM d, yyyy');
export const formatDay = (iso: string | Date) => format(new Date(iso), 'EEE, MMM d');
export const formatDob = (dob: string) => format(new Date(`${dob}T12:00:00`), 'MM/dd/yyyy');

/** "2 min ago", "1 h ago", "Yesterday", "Sep 23" */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const mins = differenceInMinutes(now, new Date(iso));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60 && isToday(new Date(iso))) return `${Math.floor(mins / 60)} h ago`;
  if (isYesterday(new Date(iso))) return 'Yesterday';
  return format(new Date(iso), 'MMM d');
}

/** Waiting time: "18 min", "1 h 41 m" */
export function formatWait(fromIso: string, now: Date = new Date()): string {
  const mins = Math.max(0, differenceInMinutes(now, new Date(fromIso)));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`;
  return `${h} h ${mins % 60} m`;
}

/** mm:ss or h:mm:ss for running timers */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export const VITAL_UNIT: Record<VitalKey, string> = {
  systolic: 'mmHg', diastolic: 'mmHg', pulse: 'bpm', spo2: '%', glucose: 'mg/dL',
};

/** Staff wording */
export const VITAL_LABEL: Record<VitalKey, string> = {
  systolic: 'Systolic', diastolic: 'Diastolic', pulse: 'Pulse', spo2: 'SpO2', glucose: 'Glucose',
};

/** "BP 82/48", "Glucose 312", "SpO2 88%", "Pulse 112" — only the flagged vitals. */
export function flaggedSummary(r: Reading): string {
  const vitals = new Set(r.flags.map((f) => f.vital));
  const parts: string[] = [];
  if ((vitals.has('systolic') || vitals.has('diastolic')) && r.systolic !== undefined) parts.push(`BP ${r.systolic}/${r.diastolic ?? '—'}`);
  if (vitals.has('pulse')) parts.push(`Pulse ${r.pulse}`);
  if (vitals.has('spo2')) parts.push(`SpO2 ${r.spo2}%`);
  if (vitals.has('glucose')) parts.push(`Glucose ${r.glucose}`);
  return parts.join(' · ') || readingSummary(r);
}

/** Primary value of a reading for lists: BP first, else whatever is present. */
export function readingSummary(r: Reading): string {
  if (r.systolic !== undefined) return `BP ${r.systolic}/${r.diastolic ?? '—'}`;
  if (r.glucose !== undefined) return `Glucose ${r.glucose}`;
  if (r.spo2 !== undefined) return `SpO2 ${r.spo2}%`;
  if (r.pulse !== undefined) return `Pulse ${r.pulse}`;
  return '—';
}

export const bp = (r: Pick<Reading, 'systolic' | 'diastolic'>) =>
  r.systolic !== undefined ? `${r.systolic}/${r.diastolic ?? '—'}` : '—';

export const PREFERRED_CONTACT: Record<Patient['preferredContact'], string> = {
  sms: 'SMS', phone: 'Phone call', email: 'Email',
};

export const DEVICE_LABEL: Record<Patient['devices'][number], string> = {
  bp: 'BP cuff', glucose: 'glucose meter', oximeter: 'pulse oximeter',
};

export function minutesLabel(min: number): string {
  return `${min} min`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMMM yyyy');
}

export const ACTIVITY_LABEL: Record<TimeEntry['activity'], string> = {
  call: 'Call', review: 'Review', care_coordination: 'Care coordination',
};
