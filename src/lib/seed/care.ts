import type { Alert, CallLog, Escalation, Note, Patient, Reading, TimeEntry } from '@/data/types';
import { monthKey } from '@/lib/rules/billing';
import type { PatientDef } from './people';
import type { Rng } from './prng';

const VITAL_LABEL: Record<string, string> = {
  systolic: 'BP', diastolic: 'BP', pulse: 'pulse', spo2: 'oxygen', glucose: 'sugar',
};

const REACHED_NOTES = [
  'Reached patient. Feels well, no symptoms. Reminded to sit 5 minutes before measuring.',
  'Reached patient. Had a salty meal last night. Advised low-sodium diet and recheck tonight.',
  'Reached patient. Missed one dose this week. Advised to resume as prescribed.',
  'Reached patient. Reports mild headache, resolved. Will recheck in the evening.',
  'Reached patient. Reviewed device technique, cuff was placed too low.',
];
const VOICEMAIL_NOTES = [
  'Left voicemail on primary number with callback line.',
  'Left voicemail. Sent SMS reminder to call back.',
];
const NO_ANSWER_NOTES = ['No answer. Will try again on the next reading.'];
const REVIEW_NOTES = [
  'Reviewed reading. Single value, next reading back in range. No call needed.',
  'Reviewed reading against recent trend. Within expected variation. No call needed.',
];

interface CareContext {
  rng: Rng; now: Date; nextId: (prefix: string) => string;
  alerts: Alert[]; callLogs: CallLog[]; notes: Note[]; timeEntries: TimeEntry[]; escalations: Escalation[];
}

const addMin = (iso: string | Date, min: number) => new Date(new Date(iso).getTime() + min * 60000);

/**
 * Past (before today) out-of-range readings → closed alerts with calls, notes and time entries.
 * Each patient gets a minutes budget per month (5–45) so the billing report has a realistic mix.
 */
export function generateCareActivity(
  ctx: CareContext, def: PatientDef, patient: Patient, readings: Reading[], handledReadingIds: Set<string>,
) {
  const { rng, now, nextId } = ctx;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonth = monthKey(now);
  const past = readings.filter((r) => r.status !== 'normal' && !handledReadingIds.has(r.id) && new Date(r.takenAt) < startOfToday);
  const months = Array.from(new Set(readings.map((r) => monthKey(r.takenAt))));

  for (const month of months) {
    const isCurrent = month === currentMonth;
    const liveAllowed = isCurrent ? def.liveThisMonth ?? rng.chance(0.75) : rng.chance(0.8);
    let budget = isCurrent ? rng.int(5, 32) : rng.int(5, 45);
    let hadLive = false;

    for (const reading of past.filter((r) => monthKey(r.takenAt) === month)) {
      const alert: Alert = {
        id: nextId('a'), readingId: reading.id, patientId: patient.id, clinicId: patient.clinicId,
        status: reading.status, createdAt: reading.takenAt, state: 'closed', assignedToId: patient.nurseId,
        closedAt: addMin(reading.takenAt, rng.int(25, 150)).toISOString(), closedById: patient.nurseId,
      };
      ctx.alerts.push(alert);
      const callAt = addMin(alert.closedAt!, -rng.int(5, 15)).toISOString();
      const flagged = reading.flags.map((f) => VITAL_LABEL[f.vital]).filter((v, i, a) => a.indexOf(v) === i).join(' and ');

      if (budget >= 3) {
        const roll = rng.next();
        const outcome: CallLog['outcome'] = liveAllowed && roll < 0.65 ? 'reached' : roll < 0.9 ? 'voicemail' : 'no_answer';
        const minutes = outcome === 'reached' ? Math.min(budget, rng.int(4, 10)) : rng.int(1, 2);
        const live = outcome === 'reached';
        hadLive ||= live;
        ctx.callLogs.push({ id: nextId('cl'), patientId: patient.id, alertId: alert.id, staffId: patient.nurseId, at: callAt, outcome, liveConversation: live, minutes });
        ctx.timeEntries.push({ id: nextId('t'), patientId: patient.id, staffId: patient.nurseId, start: callAt, minutes, source: 'timer', activity: 'call' });
        const body = outcome === 'reached' ? rng.pick(REACHED_NOTES) : outcome === 'voicemail' ? rng.pick(VOICEMAIL_NOTES) : rng.pick(NO_ANSWER_NOTES);
        ctx.notes.push({ id: nextId('n'), patientId: patient.id, alertId: alert.id, authorId: patient.nurseId, at: alert.closedAt!, body: `${capitalize(flagged)} out of range. ${body}` });
        budget -= minutes;

        if (reading.status === 'critical') {
          const escAt = addMin(callAt, 3).toISOString();
          alert.closedAt = addMin(escAt, rng.int(60, 300)).toISOString();
          alert.closedById = patient.doctorId;
          ctx.escalations.push({
            id: nextId('e'), alertId: alert.id, patientId: patient.id, fromId: patient.nurseId, toDoctorId: patient.doctorId,
            at: escAt, reason: `Critical ${flagged} reading. ${outcome === 'reached' ? 'Patient reached.' : 'Could not reach patient.'}`,
            state: 'reviewed', reviewedAt: alert.closedAt, doctorResponse: 'Reviewed. Continue current plan and recheck tomorrow morning.',
          });
        }
      } else {
        ctx.notes.push({ id: nextId('n'), patientId: patient.id, alertId: alert.id, authorId: patient.nurseId, at: alert.closedAt!, body: rng.pick(REVIEW_NOTES) });
      }
    }

    // Monthly check-in call (counts as the live conversation) and remaining review time.
    const monthReadings = readings.filter((r) => monthKey(r.takenAt) === month && new Date(r.takenAt) < now);
    if (monthReadings.length === 0) continue;
    const pickTime = () => {
      const r = monthReadings[rng.int(0, monthReadings.length - 1)];
      const t = new Date(r.takenAt);
      t.setHours(rng.int(10, 15), rng.int(0, 59));
      return t.getTime() < now.getTime() ? t : addMin(now, -rng.int(30, 90));
    };
    if (liveAllowed && !hadLive && budget >= 4) {
      const at = pickTime().toISOString();
      const minutes = Math.min(budget, rng.int(6, 14));
      ctx.callLogs.push({ id: nextId('cl'), patientId: patient.id, staffId: patient.nurseId, at, outcome: 'reached', liveConversation: true, minutes });
      ctx.timeEntries.push({ id: nextId('t'), patientId: patient.id, staffId: patient.nurseId, start: at, minutes, source: 'timer', activity: 'call' });
      ctx.notes.push({ id: nextId('n'), patientId: patient.id, authorId: patient.nurseId, at, body: 'Monthly check-in call. Reviewed readings, no concerns.' });
      budget -= minutes;
    }
    if (budget > 0) {
      ctx.timeEntries.push({
        id: nextId('t'), patientId: patient.id, staffId: patient.nurseId, start: pickTime().toISOString(),
        minutes: budget, source: 'manual', activity: rng.chance(0.5) ? 'review' : 'care_coordination',
      });
    }
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
