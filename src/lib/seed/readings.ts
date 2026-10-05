import type { Patient, Reading } from '@/data/types';
import { computeReadingStatus, type ReadingValues } from '@/lib/rules/status';
import type { PatientDef } from './people';
import type { Rng } from './prng';

interface Baseline { sys: number; dia: number; pulse: number; spo2: number; glu: number }

function baselineFor(def: PatientDef, rng: Rng): Baseline {
  const htn = def.conditions.includes('Hypertension');
  const chf = def.conditions.includes('CHF');
  const dm = def.conditions.includes('Type 2 diabetes');
  return {
    sys: (htn ? 131 : 123) + rng.int(-3, 3),
    dia: (htn ? 83 : 78) + rng.int(-2, 2),
    pulse: (chf ? 78 : 72) + rng.int(-4, 4),
    spo2: chf ? 95 : 97,
    glu: dm ? 138 : 104,
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Values that stay inside the default normal ranges. */
function normalValues(rng: Rng, b: Baseline, devices: Patient['devices']): ReadingValues {
  const v: ReadingValues = {
    systolic: clamp(rng.around(b.sys, 9), 106, 138),
    diastolic: clamp(rng.around(b.dia, 6), 61, 88),
    pulse: clamp(rng.around(b.pulse, 7), 62, 100),
  };
  if (devices.includes('oximeter')) v.spo2 = clamp(rng.around(b.spo2, 2), 93, 99);
  if (devices.includes('glucose')) v.glucose = clamp(rng.around(b.glu, 20), 72, 158);
  return v;
}

/** Push one vital out of range (mostly at-risk, rarely critical). */
function outOfRange(rng: Rng, v: ReadingValues, critical: boolean): ReadingValues {
  const options: (keyof ReadingValues)[] = ['systolic', 'systolic', 'diastolic', 'pulse'];
  if (v.spo2 !== undefined) options.push('spo2');
  if (v.glucose !== undefined) options.push('glucose', 'glucose');
  const vital = rng.pick(options);
  const out = { ...v };
  if (critical) {
    if (vital === 'glucose') out.glucose = rng.int(301, 335);
    else if (vital === 'spo2') out.spo2 = rng.int(84, 87);
    else { out.systolic = rng.int(182, 192); out.diastolic = rng.int(104, 114); }
    return out;
  }
  switch (vital) {
    case 'systolic':
      if (rng.chance(0.15)) { out.systolic = rng.int(97, 103); out.diastolic = rng.int(56, 62); }
      else { out.systolic = rng.int(142, 166); out.diastolic = rng.int(86, 98); }
      break;
    case 'diastolic': out.diastolic = rng.int(91, 99); break;
    case 'pulse': out.pulse = rng.int(110, 117); break;
    case 'spo2': out.spo2 = rng.int(89, 91); break;
    case 'glucose': out.glucose = rng.int(162, 248); break;
    default: break;
  }
  return out;
}

export function makeReading(
  id: string, patient: Patient, takenAt: Date, values: ReadingValues,
  extra: Partial<Pick<Reading, 'source' | 'mealTiming'>> = {},
): Reading {
  const { status, flags } = computeReadingStatus(values, patient.thresholds);
  return {
    id, patientId: patient.id, takenAt: takenAt.toISOString(),
    source: extra.source ?? 'device', mealTiming: extra.mealTiming, ...values, status, flags,
  };
}

interface GenerateOptions {
  def: PatientDef; patient: Patient; rng: Rng; now: Date; days: number;
  nextId: () => string;
  /** return true to drop a generated slot (special readings take its place) */
  skipSlot: (takenAt: Date, dayOffset: number) => boolean;
}

/** ~2 readings/day for `days` days, ~10% of slots skipped, risk injected per patient. */
export function generateHistory({ def, patient, rng, now, days, nextId, skipSlot }: GenerateOptions): Reading[] {
  const base = baselineFor(def, rng);
  const out: Reading[] = [];
  const enrolledAt = new Date(patient.enrolledAt).getTime();
  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const slots = [
      new Date(day.getFullYear(), day.getMonth(), day.getDate(), 7, 30 + rng.int(0, 70)),
      new Date(day.getFullYear(), day.getMonth(), day.getDate(), 18, 40 + rng.int(0, 60)),
    ];
    for (const takenAt of slots) {
      const skipped = rng.chance(0.1);
      const values = normalValues(rng, base, patient.devices);
      const roll = rng.next();
      if (skipped || takenAt.getTime() > now.getTime() || takenAt.getTime() < enrolledAt) continue;
      if (def.gapDays !== undefined && d < def.gapDays) continue;
      if (skipSlot(takenAt, d)) continue;
      // today's generated readings stay normal so the live queue only shows the scripted alerts
      const final = d === 0 || roll >= def.risk ? values : outOfRange(rng, values, roll < def.risk * 0.04);
      const meal = final.glucose !== undefined ? (takenAt.getHours() < 12 ? 'before' : 'after') : undefined;
      out.push(makeReading(nextId(), patient, takenAt, final, { mealTiming: meal, source: rng.chance(0.12) ? 'manual' : 'device' }));
    }
  }
  return out;
}
