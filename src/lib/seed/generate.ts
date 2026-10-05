import type { Alert, AuditEvent, CallLog, Escalation, Note, Reading, TimeEntry } from '@/data/types';
import type { DbData } from '@/data/tables';
import type { ReadingValues } from '@/lib/rules/status';
import { generateCareActivity } from './care';
import { DEFAULT_THRESHOLDS, LAKESIDE_ID } from './constants';
import { buildPatient } from './patients';
import { buildClinics, buildUsers, CLINIC_STATS, INVITED_DAYS_AGO, NURSE_IDS, PATIENT_DEFS } from './people';
import { createRng } from './prng';
import { generateHistory, makeReading } from './readings';

const HISTORY_DAYS = 30;

interface TodayEvent {
  mrn: string; minsAgo: number; values: ReadingValues;
  state: Alert['state']; assigned?: 'nina' | 'omar';
  escalation?: { reason: string; callNote: string };
}

/** Scripted alerts in today's queue (the four criticals + at-risk ones from the references). */
const TODAY_EVENTS: TodayEvent[] = [
  { mrn: '10391', minsAgo: 18, values: { systolic: 82, diastolic: 48, pulse: 79 }, state: 'in_progress', assigned: 'nina' },
  { mrn: '10422', minsAgo: 10, values: { glucose: 312 }, state: 'open' },
  // SpO2 87: the clinic's critical minimum is 88, so 88 itself is at-risk under the status rules.
  { mrn: '10237', minsAgo: 6, values: { spo2: 87, pulse: 96 }, state: 'in_progress', assigned: 'omar' },
  { mrn: '10466', minsAgo: 3, values: { systolic: 186, diastolic: 112, pulse: 88 }, state: 'open' },
  { mrn: '10155', minsAgo: 101, values: { systolic: 164, diastolic: 98, pulse: 81 }, state: 'open' },
  {
    mrn: '10288', minsAgo: 194, values: { systolic: 128, diastolic: 80, pulse: 112, spo2: 95 }, state: 'escalated', assigned: 'omar',
    escalation: {
      reason: 'Pulse 112 at rest. Patient feels lightheaded since this morning. Please review medication.',
      callNote: 'Reached patient. Resting pulse 112, lightheaded since this morning, no chest pain. Escalated to doctor.',
    },
  },
  { mrn: '10509', minsAgo: 226, values: { glucose: 262 }, state: 'in_progress', assigned: 'omar' },
  { mrn: '10372', minsAgo: 261, values: { systolic: 101, diastolic: 58, pulse: 70 }, state: 'open' },
  { mrn: '10351', minsAgo: 296, values: { spo2: 91, pulse: 84 }, state: 'in_progress', assigned: 'nina' },
];

/** Deterministic demo database relative to `now` (mulberry32, seed 42). */
export function generateSeed(now: Date = new Date()): DbData {
  const rng = createRng(42);
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}_${(++seq).toString(36)}`;
  const at = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60000);
  const today = (h: number, m: number, daysAgo = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, h, m);

  const clinics = buildClinics(now);
  const users = buildUsers(now);
  const patients = PATIENT_DEFS.map((def, i) => buildPatient(def, i, now, rng));
  const byMrn = (mrn: string) => patients[PATIENT_DEFS.findIndex((d) => d.mrn === mrn)];

  const readings: Reading[] = [];
  const alerts: Alert[] = [];
  const callLogs: CallLog[] = [];
  const notes: Note[] = [];
  const timeEntries: TimeEntry[] = [];
  const escalations: Escalation[] = [];
  const audit: AuditEvent[] = [];
  const handled = new Set<string>();

  // Mary Collins (demo patient): this morning's reading exists, the evening one is due.
  const maryMorning = new Date(Math.min(today(8, 2).getTime(), at(25).getTime()));
  const maryEscalationDay = today(8, 12, 7);

  PATIENT_DEFS.forEach((def, i) => {
    const patient = patients[i];
    const events = TODAY_EVENTS.filter((e) => e.mrn === def.mrn).map((e) => at(e.minsAgo).getTime());
    const isMary = def.mrn === '10482';
    readings.push(...generateHistory({
      def, patient, rng, now, days: HISTORY_DAYS, nextId: () => nextId('r'),
      skipSlot: (t, d) => {
        if (isMary && (d === 0 || t.toDateString() === maryEscalationDay.toDateString() && t.getHours() < 12)) return true;
        return events.some((e) => Math.abs(e - t.getTime()) < 90 * 60000);
      },
    }));
  });

  // --- Mary: this morning (sugar above range, nurse already handled it) ---
  const mary = byMrn('10482');
  const mMorning = makeReading(nextId('r'), mary, maryMorning, { systolic: 128, diastolic: 84, pulse: 76, spo2: 97, glucose: 162 }, { mealTiming: 'before' });
  const mMorningClosed = new Date(Math.min(maryMorning.getTime() + 95 * 60000, at(4).getTime()));
  const mMorningAlert: Alert = {
    id: nextId('a'), readingId: mMorning.id, patientId: mary.id, clinicId: LAKESIDE_ID, status: mMorning.status,
    createdAt: mMorning.takenAt, state: 'closed', assignedToId: 'u_nina', closedAt: mMorningClosed.toISOString(), closedById: 'u_nina',
  };
  const mCallAt = new Date(mMorningClosed.getTime() - 8 * 60000).toISOString();
  readings.push(mMorning);
  alerts.push(mMorningAlert);
  callLogs.push({ id: nextId('cl'), patientId: mary.id, alertId: mMorningAlert.id, staffId: 'u_nina', at: mCallAt, outcome: 'reached', liveConversation: true, minutes: 6 });
  timeEntries.push({ id: nextId('t'), patientId: mary.id, staffId: 'u_nina', start: mCallAt, minutes: 6, source: 'timer', activity: 'call' });
  notes.push({ id: nextId('n'), patientId: mary.id, alertId: mMorningAlert.id, authorId: 'u_nina', at: mMorningClosed.toISOString(), body: 'Sugar 162 before breakfast. Reached patient, had a late snack last night. Advised to keep taking the evening reading.' });
  handled.add(mMorning.id);

  // --- Mary: a week ago, BP above range → escalated → reviewed by Dr. Patel ---
  const mPast = makeReading(nextId('r'), mary, maryEscalationDay, { systolic: 148, diastolic: 92, pulse: 82, spo2: 96, glucose: 171 }, { mealTiming: 'before' });
  const pastCall = new Date(maryEscalationDay.getTime() + 91 * 60000);
  const pastReview = today(10, 15, 6);
  const mPastAlert: Alert = {
    id: nextId('a'), readingId: mPast.id, patientId: mary.id, clinicId: LAKESIDE_ID, status: mPast.status, createdAt: mPast.takenAt,
    state: 'closed', assignedToId: 'u_nina', closedAt: pastReview.toISOString(), closedById: 'u_patel',
  };
  readings.push(mPast);
  alerts.push(mPastAlert);
  callLogs.push({ id: nextId('cl'), patientId: mary.id, alertId: mPastAlert.id, staffId: 'u_nina', at: pastCall.toISOString(), outcome: 'reached', liveConversation: true, minutes: 8 });
  timeEntries.push({ id: nextId('t'), patientId: mary.id, staffId: 'u_nina', start: pastCall.toISOString(), minutes: 8, source: 'timer', activity: 'call' });
  notes.push({ id: nextId('n'), patientId: mary.id, alertId: mPastAlert.id, authorId: 'u_nina', at: pastCall.toISOString(), body: 'Patient missed evening Lisinopril twice. Advised to resume. Escalated to doctor.' });
  escalations.push({
    id: nextId('e'), alertId: mPastAlert.id, patientId: mary.id, fromId: 'u_nina', toDoctorId: 'u_patel',
    at: new Date(pastCall.getTime() + 2 * 60000).toISOString(), reason: 'BP 148/92 after two missed evening doses of Lisinopril.',
    state: 'reviewed', reviewedAt: pastReview.toISOString(), doctorResponse: 'Agree to keep current dose. Recheck in 2 weeks.',
  });
  handled.add(mPast.id);

  // --- Today's scripted queue ---
  for (const ev of TODAY_EVENTS) {
    const p = byMrn(ev.mrn);
    const r = makeReading(nextId('r'), p, at(ev.minsAgo), ev.values, { mealTiming: ev.values.glucose ? 'after' : undefined });
    readings.push(r);
    handled.add(r.id);
    const alert: Alert = {
      id: nextId('a'), readingId: r.id, patientId: p.id, clinicId: LAKESIDE_ID, status: r.status, createdAt: r.takenAt,
      state: ev.state, assignedToId: ev.assigned ? NURSE_IDS[ev.assigned] : null,
    };
    alerts.push(alert);
    if (ev.escalation && ev.assigned) {
      const staffId = NURSE_IDS[ev.assigned];
      const callAt = at(ev.minsAgo - 25).toISOString();
      callLogs.push({ id: nextId('cl'), patientId: p.id, alertId: alert.id, staffId, at: callAt, outcome: 'reached', liveConversation: true, minutes: 7 });
      timeEntries.push({ id: nextId('t'), patientId: p.id, staffId, start: callAt, minutes: 9, source: 'timer', activity: 'call' });
      notes.push({ id: nextId('n'), patientId: p.id, alertId: alert.id, authorId: staffId, at: callAt, body: ev.escalation.callNote });
      escalations.push({ id: nextId('e'), alertId: alert.id, patientId: p.id, fromId: staffId, toDoctorId: p.doctorId, at: at(ev.minsAgo - 32).toISOString(), reason: ev.escalation.reason, state: 'pending' });
    }
  }

  // --- Past alerts, calls, notes, time (billing mix) ---
  const ctx = { rng, now, nextId, alerts, callLogs, notes, timeEntries, escalations };
  PATIENT_DEFS.forEach((def, i) => {
    const own = readings.filter((r) => r.patientId === patients[i].id);
    generateCareActivity(ctx, def, patients[i], own, handled);
  });

  // --- Audit history ---
  const ev = (minsAgo: number, actorId: string, action: AuditEvent['action'], targetType: AuditEvent['targetType'], targetId: string, summary: string, clinicId: string | null = LAKESIDE_ID) =>
    audit.push({ id: nextId('au'), at: at(minsAgo).toISOString(), actorId, clinicId, action, targetType, targetId, summary });
  const james = byMrn('10391');
  const charles = byMrn('10288');
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('en-US', { month: 'long' });
  ev(12 * 24 * 60, 'u_sam', 'add_clinic', 'clinic', 'c_northgate', 'added clinic Northgate Senior Health', null);
  ev(INVITED_DAYS_AGO.u_tom * 24 * 60, 'u_rachel', 'invite_user', 'user', 'u_tom', 'invited Tom Becker as Call center');
  ev(22 * 60, 'u_dana', 'invite_user', 'user', 'u_dana', 'invited 3 team members', 'c_northgate');
  ev((now.getTime() - pastReview.getTime()) / 60000, 'u_patel', 'review_escalation', 'patient', mary.id, 'reviewed escalation for Mary Collins');
  ev(240, 'u_rachel', 'sign_in', 'user', 'u_rachel', 'signed in');
  ev(185, 'u_patel', 'sign_in', 'user', 'u_patel', 'signed in');
  ev(150, 'u_nina', 'sign_in', 'user', 'u_nina', 'signed in');
  ev(148, 'u_omar', 'sign_in', 'user', 'u_omar', 'signed in');
  ev(TODAY_EVENTS[5].minsAgo - 32, 'u_omar', 'escalate', 'patient', charles.id, 'escalated a reading for Charles Ward');
  ev((now.getTime() - maryMorning.getTime()) / 60000, 'u_mary', 'add_reading', 'patient', mary.id, 'added a reading');
  ev((now.getTime() - mMorningClosed.getTime()) / 60000, 'u_nina', 'close_alert', 'patient', mary.id, 'closed an alert for Mary Collins');
  ev(60, 'u_rachel', 'export_billing', 'report', 'billing', `exported ${prevMonth} billing report`);
  ev(14, 'u_patel', 'update_thresholds', 'patient', james.id, 'changed thresholds for James Turner');
  ev(2, 'u_nina', 'view_chart', 'patient', mary.id, 'viewed chart of Mary Collins');
  audit.sort((a, b) => b.at.localeCompare(a.at));

  readings.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  return {
    clinics, users, patients, readings, alerts, callLogs, notes, timeEntries, escalations, audit,
    clinicSettings: { [LAKESIDE_ID]: { defaultThresholds: structuredClone(DEFAULT_THRESHOLDS) } },
    clinicStats: CLINIC_STATS,
    invites: Object.fromEntries(Object.entries(INVITED_DAYS_AGO).map(([id, d]) => [id, at(d * 24 * 60).toISOString()])),
    seededAt: now.toISOString(),
  };
}
