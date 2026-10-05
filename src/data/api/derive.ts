import { differenceInCalendarDays, startOfMonth } from 'date-fns';
import type { DbData } from '@/data/tables';
import type { Alert, BillingRow, Patient, Reading } from '@/data/types';
import { computeBillingRow, monthKey } from '@/lib/rules/billing';
import { daysSinceReading, isMissed } from '@/lib/rules/missed';
import { patientStatus, type PatientStatus } from '@/lib/rules/status';
import { staffRef, type StaffRef } from './core';

export interface PatientSummary {
  patient: Patient;
  doctor: StaffRef | null;
  nurse: StaffRef | null;
  latest: Reading | null;
  status: PatientStatus;
  missed: boolean;
  daysSinceLast: number | null;
  openAlert: Alert | null;
  month: {
    critical: number; atrisk: number; normal: number;
    readingDays: number; daysSoFar: number; minutes: number;
    billing: BillingRow; liveCallAt: string | null;
  };
}

/** Index readings per patient (sorted oldest → newest as stored). */
export function readingsByPatient(data: DbData): Map<string, Reading[]> {
  const map = new Map<string, Reading[]>();
  for (const r of data.readings) {
    const list = map.get(r.patientId);
    if (list) list.push(r);
    else map.set(r.patientId, [r]);
  }
  for (const list of map.values()) list.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  return map;
}

export function daysSoFarInMonth(now: Date = new Date()): number {
  return differenceInCalendarDays(now, startOfMonth(now)) + 1;
}

export function summarize(
  data: DbData, patient: Patient, readings: Reading[], now: Date = new Date(), month: string = monthKey(now),
): PatientSummary {
  const latest = readings.length ? readings[readings.length - 1] : null;
  const missed = isMissed(patient, latest?.takenAt ?? null, now);
  const inMonth = readings.filter((r) => monthKey(r.takenAt) === month);
  const billing = computeBillingRow({
    patientId: patient.id, month, readings: inMonth, timeEntries: data.timeEntries, callLogs: data.callLogs,
  });
  const live = data.callLogs
    .filter((c) => c.patientId === patient.id && c.liveConversation && monthKey(c.at) === month)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  const openAlert = data.alerts
    .filter((a) => a.patientId === patient.id && a.state !== 'closed')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  return {
    patient,
    doctor: staffRef(patient.doctorId, data),
    nurse: staffRef(patient.nurseId, data),
    latest,
    status: patientStatus(latest, missed),
    missed,
    daysSinceLast: daysSinceReading(latest?.takenAt ?? null, now),
    openAlert,
    month: {
      critical: inMonth.filter((r) => r.status === 'critical').length,
      atrisk: inMonth.filter((r) => r.status === 'atrisk').length,
      normal: inMonth.filter((r) => r.status === 'normal').length,
      readingDays: billing.readingDays,
      daysSoFar: daysSoFarInMonth(now),
      minutes: billing.minutes,
      billing,
      liveCallAt: live?.at ?? null,
    },
  };
}

export function summarizeAll(data: DbData, patients: Patient[], now: Date = new Date()): PatientSummary[] {
  const byPatient = readingsByPatient(data);
  return patients.map((p) => summarize(data, p, byPatient.get(p.id) ?? [], now));
}
