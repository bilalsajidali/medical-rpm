import type { CallLog, Patient } from '@/data/types';
import { patientName } from '@/lib/format';
import {
  auditEvent, copy, db, delay, getVisiblePatient, inScope, newId, requireRole, staffRef, withAudit, write,
  type Session, type StaffRef,
} from './core';

export interface CallRow { call: CallLog; patient: Patient; staff: StaffRef | null }

/** Call log for the clinic (nurse: optionally only own calls), newest first. */
export async function listCalls(s: Session | null, opts: { mine?: boolean } = {}): Promise<CallRow[]> {
  requireRole(s, ['nurse', 'clinic_admin']);
  await delay();
  const data = db();
  const rows: CallRow[] = [];
  for (const call of data.callLogs) {
    if (opts.mine && call.staffId !== s.userId) continue;
    const patient = data.patients.find((p) => p.id === call.patientId);
    if (!patient || !inScope(s, patient.clinicId)) continue;
    rows.push({ call, patient, staff: staffRef(call.staffId, data) });
  }
  return copy(rows.sort((a, b) => b.call.at.localeCompare(a.call.at)));
}

export interface LogCallInput {
  patientId: string; outcome: CallLog['outcome']; liveConversation: boolean; minutes: number; alertId?: string;
}

/** Log a call (missed-readings list, chart). Also saves its minutes as billable time. */
export async function logCall(s: Session | null, input: LogCallInput): Promise<CallLog> {
  requireRole(s, ['nurse']);
  await delay();
  const p = getVisiblePatient(s, input.patientId);
  const now = new Date().toISOString();
  const minutes = Math.max(1, Math.round(input.minutes));
  const call: CallLog = {
    id: newId('cl'), patientId: p.id, alertId: input.alertId, staffId: s.userId, at: now,
    outcome: input.outcome, liveConversation: input.outcome === 'reached' && input.liveConversation, minutes,
  };
  write((d) => ({
    callLogs: [...d.callLogs, call],
    timeEntries: [...d.timeEntries, { id: newId('t'), patientId: p.id, staffId: s.userId, start: now, minutes, source: 'manual', activity: 'call' }],
    ...withAudit(d, auditEvent(s, 'log_call', 'patient', p.id, `logged a call with ${patientName(p)}`)),
  }));
  return copy(call);
}
