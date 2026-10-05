import type { DbData } from '@/data/tables';
import type { Note } from '@/data/types';
import { flaggedSummary, nameWithCredential, patientName, VITAL_UNIT } from '@/lib/format';
import { auditEvent, copy, db, delay, getVisiblePatient, newId, requireRole, withAudit, write, type Session } from './core';

export type TimelineKind = 'note' | 'call' | 'reading' | 'escalation' | 'escalation_reviewed' | 'message' | 'call_request';

export interface TimelineItem {
  id: string; at: string; kind: TimelineKind;
  title: string; body: string; meta: string;
  tone: 'accent' | 'critical' | 'atrisk' | 'normal' | 'neutral';
}

const OUTCOME_TITLE = { reached: 'Reached patient', voicemail: 'Left voicemail', no_answer: 'No answer' } as const;
export const CALL_REQUEST_PREFIX = 'Call requested';

function authorName(data: DbData, id: string): string {
  const u = data.users.find((x) => x.id === id);
  return u ? nameWithCredential(u) : 'Unknown';
}

function whenText(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Notes, calls, flagged readings and escalations for a patient, newest first. */
export function buildTimeline(data: DbData, patientId: string): TimelineItem[] {
  const items: TimelineItem[] = [];
  const usedNotes = new Set<string>();
  const notes = data.notes.filter((n) => n.patientId === patientId);

  for (const c of data.callLogs.filter((x) => x.patientId === patientId)) {
    const note = notes.find((n) => !usedNotes.has(n.id) && n.authorId === c.staffId
      && ((c.alertId && n.alertId === c.alertId) || Math.abs(new Date(n.at).getTime() - new Date(c.at).getTime()) < 20 * 60000));
    if (note) usedNotes.add(note.id);
    items.push({
      id: c.id, at: c.at, kind: 'call', title: `Call · ${OUTCOME_TITLE[c.outcome]}`,
      body: note?.body ?? (c.liveConversation ? 'Live conversation with the patient.' : 'No live conversation.'),
      meta: `${authorName(data, c.staffId)} · ${whenText(c.at)} · ${c.minutes} min`,
      tone: c.outcome === 'reached' ? 'normal' : 'neutral',
    });
  }

  for (const n of notes) {
    if (usedNotes.has(n.id)) continue;
    const author = data.users.find((u) => u.id === n.authorId);
    const fromPatient = author?.role === 'patient';
    const isRequest = fromPatient && n.body.startsWith(CALL_REQUEST_PREFIX);
    items.push({
      id: n.id, at: n.at, kind: isRequest ? 'call_request' : fromPatient ? 'message' : 'note',
      title: isRequest ? 'Call requested by patient' : fromPatient ? 'Message from patient' : 'Note',
      body: n.body, meta: `${authorName(data, n.authorId)} · ${whenText(n.at)}`,
      tone: fromPatient ? 'accent' : 'neutral',
    });
  }

  for (const a of data.alerts.filter((x) => x.patientId === patientId)) {
    const r = data.readings.find((x) => x.id === a.readingId);
    if (!r) continue;
    const f = r.flags[0];
    const limitText = f ? `, ${f.direction} ${f.status === 'critical' ? 'critical' : 'at-risk'} limit ${f.limit}` : '';
    const unit = f ? ` ${VITAL_UNIT[f.vital]}` : '';
    items.push({
      id: a.id, at: r.takenAt, kind: 'reading',
      title: r.status === 'critical' ? 'Critical reading' : 'At-risk reading',
      body: `${flaggedSummary(r)}${unit === ' %' ? '' : unit}${limitText}.`,
      meta: `${r.source === 'device' ? 'Device' : 'Manual'} · ${whenText(r.takenAt)}`,
      tone: r.status === 'critical' ? 'critical' : 'atrisk',
    });
  }

  for (const e of data.escalations.filter((x) => x.patientId === patientId)) {
    const doctor = data.users.find((u) => u.id === e.toDoctorId);
    items.push({
      id: e.id, at: e.at, kind: 'escalation', title: `Escalated to ${doctor ? nameWithCredential(doctor) : 'doctor'}`,
      body: e.reason, meta: `${authorName(data, e.fromId)} · ${whenText(e.at)}`, tone: 'accent',
    });
    if (e.state === 'reviewed' && e.reviewedAt) {
      items.push({
        id: `${e.id}_rev`, at: e.reviewedAt, kind: 'escalation_reviewed', title: 'Escalation reviewed',
        body: e.doctorResponse ?? 'Reviewed.', meta: `${authorName(data, e.toDoctorId)} · ${whenText(e.reviewedAt)}`, tone: 'accent',
      });
    }
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

export async function listTimeline(s: Session | null, patientId: string): Promise<TimelineItem[]> {
  requireRole(s, ['nurse', 'doctor', 'clinic_admin']);
  await delay();
  getVisiblePatient(s, patientId);
  return copy(buildTimeline(db(), patientId));
}

/** Latest note written by staff (doctor dashboard "Latest nurse note"). */
export async function latestStaffNote(s: Session | null, patientId: string): Promise<(Note & { author: string }) | null> {
  requireRole(s, ['nurse', 'doctor', 'clinic_admin']);
  await delay();
  const data = db();
  getVisiblePatient(s, patientId, data);
  const note = data.notes
    .filter((n) => n.patientId === patientId && data.users.find((u) => u.id === n.authorId)?.role === 'nurse')
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  return note ? copy({ ...note, author: authorName(data, note.authorId) }) : null;
}

export async function addNote(s: Session | null, input: { patientId: string; body: string; alertId?: string }): Promise<Note> {
  requireRole(s, ['nurse', 'doctor', 'patient']);
  await delay();
  const p = getVisiblePatient(s, input.patientId);
  const body = input.body.trim();
  if (!body) throw new Error('Write a note first.');
  const note: Note = { id: newId('n'), patientId: p.id, alertId: input.alertId, authorId: s.userId, at: new Date().toISOString(), body };
  const summary = s.role === 'patient' ? 'sent a message to the care team' : `added a note for ${patientName(p)}`;
  write((d) => ({ notes: [...d.notes, note], ...withAudit(d, auditEvent(s, 'add_note', 'patient', p.id, summary, p.clinicId)) }));
  return copy(note);
}
