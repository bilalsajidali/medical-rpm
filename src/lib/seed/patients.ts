import { format } from 'date-fns';
import type { Patient } from '@/data/types';
import { DEFAULT_THRESHOLDS, LAKESIDE_ID } from './constants';
import { DOCTOR_IDS, NURSE_IDS, type PatientDef } from './people';
import type { Rng } from './prng';

const MEDS: Record<string, string[]> = {
  Hypertension: ['Lisinopril 10 mg daily', 'Amlodipine 5 mg daily'],
  'Type 2 diabetes': ['Metformin 500 mg twice daily'],
  'CKD Stage 3': ['Atorvastatin 20 mg nightly'],
  'CKD Stage 4': ['Sodium bicarbonate 650 mg twice daily', 'Atorvastatin 20 mg nightly'],
  CHF: ['Furosemide 40 mg daily', 'Carvedilol 6.25 mg twice daily'],
};
const ALLERGIES = [[], [], ['Penicillin'], ['Sulfa drugs'], [], ['Shellfish'], ['Iodine contrast']];

export const pad = (n: number, width = 2) => n.toString().padStart(width, '0');

export function buildPatient(def: PatientDef, index: number, now: Date, rng: Rng): Patient {
  const isMary = def.mrn === '10482';
  const meds = isMary
    ? ['Lisinopril 10 mg daily', 'Metformin 500 mg twice daily', 'Atorvastatin 20 mg nightly']
    : Array.from(new Set(def.conditions.flatMap((c) => MEDS[c] ?? []))).slice(0, 3);
  const devices: Patient['devices'] = ['bp'];
  if (isMary || def.conditions.includes('Type 2 diabetes')) devices.push('glucose');
  if (isMary || def.conditions.includes('CHF') || index % 3 === 0) devices.push('oximeter');

  const dob = isMary
    ? new Date(1954, 2, 14)
    : new Date(now.getFullYear() - def.age, (index * 5) % 12, 1 + ((index * 7) % 27));
  if (!isMary && dob.getMonth() > now.getMonth()) dob.setFullYear(dob.getFullYear() - 1); // keep the listed age

  const enrolled = isMary
    ? new Date(2025, 6, 1, 10)
    : new Date(now.getTime() - (def.enrolledDaysAgo ?? 60 + index * 11) * 864e5);

  return {
    id: `p_${pad(index + 1)}`,
    clinicId: LAKESIDE_ID,
    mrn: def.mrn,
    firstName: def.first,
    lastName: def.last,
    sex: def.sex,
    dob: format(dob, 'yyyy-MM-dd'),
    phone: `(918) 555-01${pad(index)}`,
    preferredContact: isMary ? 'sms' : rng.pick(['sms', 'phone', 'phone', 'email'] as const),
    email: `${def.first}.${def.last}@mail.example`.toLowerCase(),
    doctorId: DOCTOR_IDS[def.doctor],
    nurseId: NURSE_IDS[def.nurse],
    conditions: def.conditions,
    medications: meds,
    allergies: isMary ? ['Penicillin'] : ALLERGIES[index % ALLERGIES.length],
    devices,
    rpmStatus: 'active',
    consentSignedAt: enrolled.toISOString(),
    enrolledAt: enrolled.toISOString(),
    thresholds: structuredClone(DEFAULT_THRESHOLDS),
  };
}
