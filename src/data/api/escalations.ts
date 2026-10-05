import type { Alert, Escalation, Patient, Reading } from '@/data/types';
import { patientName } from '@/lib/format';
import {
  auditEvent, copy, db, delay, forbidden, inScope, requireRole, staffRef, withAudit, write,
  type Session, type StaffRef,
} from './core';

export interface EscalationRow {
  escalation: Escalation; alert: Alert | null; reading: Reading | null; patient: Patient;
  from: StaffRef | null; nurseAction: string;
}

const OUTCOME_ACTION = { reached: 'Reached patient', voicemail: 'Voicemail left', no_answer: 'No answer' } as const;

/** Escalations to the signed-in doctor (nurse/admin: whole clinic), newest first. */
export async function listEscalations(s: Session | null, state?: Escalation['state']): Promise<EscalationRow[]> {
  requireRole(s, ['doctor', 'nurse', 'clinic_admin']);
  await delay();
  const data = db();
  const rows: EscalationRow[] = [];
  for (const escalation of data.escalations) {
    if (state && escalation.state !== state) continue;
    if (s.role === 'doctor' && escalation.toDoctorId !== s.userId) continue;
    const patient = data.patients.find((p) => p.id === escalation.patientId);
    if (!patient || !inScope(s, patient.clinicId)) continue;
    const alert = data.alerts.find((a) => a.id === escalation.alertId) ?? null;
    const call = data.callLogs
      .filter((c) => c.alertId === escalation.alertId)
      .sort((a, b) => b.at.localeCompare(a.at))[0];
    rows.push({
      escalation, alert, patient,
      reading: alert ? data.readings.find((r) => r.id === alert.readingId) ?? null : null,
      from: staffRef(escalation.fromId, data),
      nurseAction: `${call ? OUTCOME_ACTION[call.outcome] : 'Not yet contacted'}, escalated`,
    });
  }
  return copy(rows.sort((a, b) => b.escalation.at.localeCompare(a.escalation.at)));
}

/** Doctor marks reviewed → escalation reviewed, alert closed. */
export async function reviewEscalation(s: Session | null, escalationId: string, response: string): Promise<void> {
  requireRole(s, ['doctor']);
  await delay();
  const data = db();
  const esc = data.escalations.find((e) => e.id === escalationId);
  const patient = data.patients.find((p) => p.id === esc?.patientId);
  if (!esc || !patient || !inScope(s, patient.clinicId) || esc.toDoctorId !== s.userId) forbidden();
  if (esc.state === 'reviewed') throw new Error('Already reviewed.');
  const text = response.trim();
  if (!text) throw new Error('Write a short response for the care team.');
  const now = new Date().toISOString();
  write((d) => ({
    escalations: d.escalations.map((e) => (e.id === escalationId ? { ...e, state: 'reviewed', reviewedAt: now, doctorResponse: text } : e)),
    alerts: d.alerts.map((a) => (a.id === esc.alertId ? { ...a, state: 'closed', closedAt: now, closedById: s.userId } : a)),
    ...withAudit(d, auditEvent(s, 'review_escalation', 'patient', patient.id, `reviewed escalation for ${patientName(patient)}`)),
  }));
}
