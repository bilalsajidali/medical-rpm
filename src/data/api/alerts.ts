import type { Alert, AuditEvent, CallLog, Escalation, Note, Patient, Reading, TimeEntry } from '@/data/types';
import { patientName } from '@/lib/format';
import { monthKey } from '@/lib/rules/billing';
import { isMissed } from '@/lib/rules/missed';
import { compareStatus } from '@/lib/rules/status';
import {
  auditEvent, copy, db, delay, forbidden, inScope, newId, requireRole, staffRef, withAudit, write,
  type Session, type StaffRef,
} from './core';
import { readingsByPatient } from './derive';

export interface QueueRow {
  alert: Alert;
  reading: Reading;
  patient: Patient;
  doctor: StaffRef | null;
  assignedTo: StaffRef | null;
  monthMinutes: number;
}

/** Queue sort: critical first, then oldest first. */
export function sortQueue<T extends { alert: Alert }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => compareStatus(a.alert.status, b.alert.status) || a.alert.createdAt.localeCompare(b.alert.createdAt));
}

/** Open, in-progress and escalated alerts for the nurse's clinic. */
export async function listQueue(s: Session | null): Promise<QueueRow[]> {
  requireRole(s, ['nurse', 'clinic_admin']);
  await delay();
  const data = db();
  const month = monthKey(new Date());
  const rows: QueueRow[] = [];
  for (const alert of data.alerts) {
    if (alert.state === 'closed' || !inScope(s, alert.clinicId)) continue;
    const reading = data.readings.find((r) => r.id === alert.readingId);
    const patient = data.patients.find((p) => p.id === alert.patientId);
    if (!reading || !patient) continue;
    rows.push({
      alert, reading, patient,
      doctor: staffRef(patient.doctorId, data),
      assignedTo: staffRef(alert.assignedToId, data),
      monthMinutes: data.timeEntries
        .filter((t) => t.patientId === patient.id && monthKey(t.start) === month)
        .reduce((sum, t) => sum + t.minutes, 0),
    });
  }
  return copy(sortQueue(rows));
}

/** Sidebar badge counts for the nurse. */
export async function nurseCounts(s: Session | null): Promise<{ openAlerts: number; missed: number }> {
  requireRole(s, ['nurse']);
  await delay();
  const data = db();
  const byPatient = readingsByPatient(data);
  const now = new Date();
  const openAlerts = data.alerts.filter((a) => inScope(s, a.clinicId) && (a.state === 'open' || a.state === 'in_progress')).length;
  const missed = data.patients.filter((p) => {
    if (!inScope(s, p.clinicId)) return false;
    const list = byPatient.get(p.id);
    return isMissed(p, list?.[list.length - 1]?.takenAt ?? null, now);
  }).length;
  return { openAlerts, missed };
}

function getScopedAlert(s: Session, alertId: string): Alert {
  const alert = db().alerts.find((a) => a.id === alertId);
  if (!alert || !inScope(s, alert.clinicId)) forbidden();
  return alert;
}

/** Opening an alert in the side panel assigns it to the nurse and marks it in progress. */
export async function openAlert(s: Session | null, alertId: string): Promise<Alert> {
  requireRole(s, ['nurse']);
  await delay();
  const alert = getScopedAlert(s, alertId);
  if (alert.state !== 'open' && !(alert.state === 'in_progress' && alert.assignedToId !== s.userId)) return copy(alert);
  const updated: Alert = { ...alert, state: 'in_progress', assignedToId: s.userId };
  write((d) => ({ alerts: d.alerts.map((a) => (a.id === alertId ? updated : a)) }));
  return copy(updated);
}

export interface ResolveAlertInput {
  alertId: string;
  outcome: CallLog['outcome'] | null;
  liveConversation: boolean;
  callMinutes?: number;
  note: string;
  /** minutes from the panel timer, saved as a TimeEntry */
  timerMinutes: number | null;
  timerStartedAt: string | null;
  action: 'close' | 'escalate';
  reason?: string;
}

/** Save from the nurse panel: CallLog (if outcome) + Note + TimeEntry, then close or escalate. */
export async function resolveAlert(s: Session | null, input: ResolveAlertInput): Promise<void> {
  requireRole(s, ['nurse']);
  await delay();
  const alert = getScopedAlert(s, input.alertId);
  if (alert.state === 'closed' || alert.state === 'escalated') throw new Error('This alert was already handled.');
  const data = db();
  const patient = data.patients.find((p) => p.id === alert.patientId)!;
  const now = new Date().toISOString();
  const name = patientName(patient);
  const events: AuditEvent[] = [];

  const call: CallLog | null = input.outcome ? {
    id: newId('cl'), patientId: patient.id, alertId: alert.id, staffId: s.userId, at: now,
    outcome: input.outcome, liveConversation: input.outcome === 'reached' && input.liveConversation,
    minutes: Math.max(1, input.callMinutes ?? input.timerMinutes ?? 1),
  } : null;
  if (call) events.push(auditEvent(s, 'log_call', 'patient', patient.id, `logged a call with ${name}`));

  const body = input.note.trim();
  const note: Note | null = body ? { id: newId('n'), patientId: patient.id, alertId: alert.id, authorId: s.userId, at: now, body } : null;
  if (note) events.push(auditEvent(s, 'add_note', 'patient', patient.id, `added a note for ${name}`));

  const time: TimeEntry | null = input.timerMinutes ? {
    id: newId('t'), patientId: patient.id, staffId: s.userId, start: input.timerStartedAt ?? now,
    minutes: input.timerMinutes, source: 'timer', activity: call ? 'call' : 'review',
  } : null;

  let escalation: Escalation | null = null;
  let updated: Alert;
  if (input.action === 'escalate') {
    const reason = input.reason?.trim();
    if (!reason) throw new Error('Add a reason for the doctor.');
    escalation = {
      id: newId('e'), alertId: alert.id, patientId: patient.id, fromId: s.userId, toDoctorId: patient.doctorId,
      at: now, reason, state: 'pending',
    };
    updated = { ...alert, state: 'escalated', assignedToId: s.userId };
    events.push(auditEvent(s, 'escalate', 'patient', patient.id, `escalated a reading for ${name}`));
  } else {
    updated = { ...alert, state: 'closed', closedAt: now, closedById: s.userId, assignedToId: alert.assignedToId ?? s.userId };
    events.push(auditEvent(s, 'close_alert', 'patient', patient.id, `closed an alert for ${name}`));
  }

  write((d) => ({
    alerts: d.alerts.map((a) => (a.id === alert.id ? updated : a)),
    callLogs: call ? [...d.callLogs, call] : d.callLogs,
    notes: note ? [...d.notes, note] : d.notes,
    timeEntries: time ? [...d.timeEntries, time] : d.timeEntries,
    escalations: escalation ? [...d.escalations, escalation] : d.escalations,
    ...withAudit(d, ...events.reverse()),
  }));
}
