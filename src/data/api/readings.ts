import { subDays } from 'date-fns';
import type { Alert, Reading } from '@/data/types';
import { patientName } from '@/lib/format';
import { computeReadingStatus, type ReadingValues } from '@/lib/rules/status';
import { auditEvent, copy, db, delay, getVisiblePatient, newId, requireRole, withAudit, write, type Session } from './core';

/** Readings for a patient, newest first. `days` limits how far back. */
export async function listReadings(s: Session | null, patientId: string, days?: number): Promise<Reading[]> {
  requireRole(s, ['patient', 'nurse', 'doctor', 'clinic_admin']);
  await delay();
  getVisiblePatient(s, patientId);
  const since = days ? subDays(new Date(), days).toISOString() : '';
  return copy(
    db().readings
      .filter((r) => r.patientId === patientId && r.takenAt >= since)
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt)),
  );
}

export interface AddReadingInput {
  patientId: string;
  values: ReadingValues;
  mealTiming?: Reading['mealTiming'];
}

/** Saves a reading, computes status + flags, and opens an alert when it's at-risk or critical. */
export async function addReading(s: Session | null, input: AddReadingInput): Promise<{ reading: Reading; alert: Alert | null }> {
  requireRole(s, ['patient', 'nurse', 'doctor']);
  await delay();
  const patient = getVisiblePatient(s, input.patientId);
  const values = Object.fromEntries(Object.entries(input.values).filter(([, v]) => v !== undefined && !Number.isNaN(v))) as ReadingValues;
  if (Object.keys(values).length === 0) throw new Error('Enter at least one value.');
  const { status, flags } = computeReadingStatus(values, patient.thresholds);
  const now = new Date().toISOString();
  const reading: Reading = {
    id: newId('r'), patientId: patient.id, takenAt: now, source: 'manual',
    ...values, mealTiming: values.glucose !== undefined ? input.mealTiming : undefined, status, flags,
  };
  const alert: Alert | null = status === 'normal' ? null : {
    id: newId('a'), readingId: reading.id, patientId: patient.id, clinicId: patient.clinicId,
    status, createdAt: now, state: 'open', assignedToId: null,
  };
  const who = s.role === 'patient' ? 'added a reading' : `added a reading for ${patientName(patient)}`;
  write((d) => ({
    readings: [...d.readings, reading],
    alerts: alert ? [...d.alerts, alert] : d.alerts,
    ...withAudit(d, auditEvent(s, 'add_reading', 'patient', patient.id, who, patient.clinicId)),
  }));
  return copy({ reading, alert });
}
