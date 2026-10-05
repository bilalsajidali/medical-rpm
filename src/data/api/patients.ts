import type { Patient, Thresholds } from '@/data/types';
import { patientName } from '@/lib/format';
import { DEFAULT_THRESHOLDS } from '@/lib/seed/constants';
import {
  auditEvent, copy, db, delay, forbidden, getVisiblePatient, newId, requireRole, visiblePatients, withAudit, write,
  type Session,
} from './core';
import { readingsByPatient, summarize, summarizeAll, type PatientSummary } from './derive';

export type { PatientSummary };

const STAFF = ['nurse', 'doctor', 'clinic_admin'] as const;

/** Patients list (doctor: own patients; nurse/admin: whole clinic). */
export async function listPatients(s: Session | null): Promise<PatientSummary[]> {
  requireRole(s, [...STAFF]);
  await delay();
  const data = db();
  return copy(summarizeAll(data, visiblePatients(s, data)));
}

export async function getPatient(s: Session | null, patientId: string): Promise<PatientSummary> {
  requireRole(s, [...STAFF, 'patient']);
  await delay();
  const data = db();
  const p = getVisiblePatient(s, patientId, data);
  return copy(summarize(data, p, readingsByPatient(data).get(p.id) ?? []));
}

/** The signed-in patient's own record. */
export async function getMyPatient(s: Session | null): Promise<PatientSummary> {
  requireRole(s, ['patient']);
  await delay();
  const data = db();
  const p = visiblePatients(s, data)[0];
  if (!p) forbidden();
  return copy(summarize(data, p, readingsByPatient(data).get(p.id) ?? []));
}

/** Opening a chart is an auditable event. */
export async function logChartView(s: Session | null, patientId: string): Promise<void> {
  requireRole(s, [...STAFF]);
  await delay();
  const p = getVisiblePatient(s, patientId);
  write((d) => withAudit(d, auditEvent(s, 'view_chart', 'patient', p.id, `viewed chart of ${patientName(p)}`)));
}

export interface NewPatientInput {
  firstName: string; lastName: string; dob: string; sex: Patient['sex'];
  phone: string; email: string; doctorId: string; nurseId: string; conditions: string[];
  consent: boolean;
}

export async function addPatient(s: Session | null, input: NewPatientInput): Promise<Patient> {
  requireRole(s, ['clinic_admin']);
  await delay();
  if (!input.consent) throw new Error('Consent is required to enroll a patient.');
  const data = db();
  const clinicId = s.clinicId!;
  const staffOk = (id: string, role: string) => data.users.some((u) => u.id === id && u.clinicId === clinicId && u.role === role);
  if (!staffOk(input.doctorId, 'doctor') || !staffOk(input.nurseId, 'nurse')) forbidden();
  const now = new Date().toISOString();
  const maxMrn = Math.max(10000, ...data.patients.map((p) => Number(p.mrn) || 0));
  const patient: Patient = {
    id: newId('p'), clinicId, mrn: String(maxMrn + 1),
    firstName: input.firstName.trim(), lastName: input.lastName.trim(), sex: input.sex, dob: input.dob,
    phone: input.phone.trim(), preferredContact: 'sms', email: input.email.trim(),
    doctorId: input.doctorId, nurseId: input.nurseId, conditions: input.conditions,
    medications: [], allergies: [],
    devices: input.conditions.includes('Type 2 diabetes') ? ['bp', 'glucose'] : ['bp'],
    rpmStatus: 'active', consentSignedAt: now, enrolledAt: now,
    thresholds: copy(data.clinicSettings[clinicId]?.defaultThresholds ?? DEFAULT_THRESHOLDS),
  };
  write((d) => ({ patients: [...d.patients, patient] }));
  return copy(patient);
}

export interface MedicalHistoryInput { conditions: string[]; medications: string[]; allergies: string[] }

export async function updateMedicalHistory(s: Session | null, patientId: string, input: MedicalHistoryInput): Promise<void> {
  requireRole(s, ['doctor']);
  await delay();
  getVisiblePatient(s, patientId);
  write((d) => ({ patients: d.patients.map((p) => (p.id === patientId ? { ...p, ...input } : p)) }));
}

/** New thresholds apply to future readings only (existing statuses are kept). */
export async function updateThresholds(s: Session | null, patientId: string, thresholds: Thresholds): Promise<void> {
  requireRole(s, ['doctor']);
  await delay();
  const p = getVisiblePatient(s, patientId);
  write((d) => ({
    patients: d.patients.map((x) => (x.id === patientId ? { ...x, thresholds } : x)),
    ...withAudit(d, auditEvent(s, 'update_thresholds', 'patient', p.id, `changed thresholds for ${patientName(p)}`)),
  }));
}
