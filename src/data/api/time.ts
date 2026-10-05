import type { Patient, TimeEntry } from '@/data/types';
import { monthKey } from '@/lib/rules/billing';
import { copy, db, delay, getVisiblePatient, inScope, newId, requireRole, write, type Session } from './core';

export interface TimeRow { entry: TimeEntry; patient: Patient }

/** Time entries for a month: one patient's (chart), or the signed-in staff member's own. */
export async function listTimeEntries(
  s: Session | null,
  opts: { patientId?: string; mine?: boolean; month?: string },
): Promise<TimeRow[]> {
  requireRole(s, ['nurse', 'doctor', 'clinic_admin']);
  await delay();
  const data = db();
  if (opts.patientId) getVisiblePatient(s, opts.patientId, data);
  const month = opts.month ?? monthKey(new Date());
  const rows: TimeRow[] = [];
  for (const entry of data.timeEntries) {
    if (opts.patientId && entry.patientId !== opts.patientId) continue;
    if (opts.mine && entry.staffId !== s.userId) continue;
    if (monthKey(entry.start) !== month) continue;
    const patient = data.patients.find((p) => p.id === entry.patientId);
    if (!patient || !inScope(s, patient.clinicId)) continue;
    rows.push({ entry, patient });
  }
  return copy(rows.sort((a, b) => b.entry.start.localeCompare(a.entry.start)));
}

/** Minutes saved this month for one patient (the "Time this month" counter). */
export async function patientMonthMinutes(s: Session | null, patientId: string): Promise<number> {
  requireRole(s, ['nurse', 'doctor', 'clinic_admin']);
  await delay();
  getVisiblePatient(s, patientId);
  const month = monthKey(new Date());
  return db().timeEntries
    .filter((t) => t.patientId === patientId && monthKey(t.start) === month)
    .reduce((sum, t) => sum + t.minutes, 0);
}

export interface AddTimeInput {
  patientId: string; minutes: number; activity: TimeEntry['activity']; source: TimeEntry['source']; start?: string;
}

export async function addTimeEntry(s: Session | null, input: AddTimeInput): Promise<TimeEntry> {
  requireRole(s, ['nurse', 'doctor']);
  await delay();
  const p = getVisiblePatient(s, input.patientId);
  if (!Number.isFinite(input.minutes) || input.minutes < 1) throw new Error('Minutes must be at least 1.');
  const entry: TimeEntry = {
    id: newId('t'), patientId: p.id, staffId: s.userId, start: input.start ?? new Date().toISOString(),
    minutes: Math.round(input.minutes), source: input.source, activity: input.activity,
  };
  write((d) => ({ timeEntries: [...d.timeEntries, entry] }));
  return copy(entry);
}
