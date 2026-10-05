import type { Reading, Thresholds, VitalKey } from '@/data/types';
import { VITAL_UNIT } from '@/lib/format';

const GROUPS: { vitals: VitalKey[]; label: string }[] = [
  { vitals: ['systolic', 'diastolic'], label: 'Blood pressure' },
  { vitals: ['glucose'], label: 'Glucose' },
  { vitals: ['spo2'], label: 'SpO2' },
  { vitals: ['pulse'], label: 'Pulse' },
];

/** The flagged vital shown big in the nurse panel, its limits text, and the other values for context. */
export function flaggedDetail(r: Reading, t: Thresholds) {
  const worst = r.flags.find((f) => f.status === r.status) ?? r.flags[0];
  const group = GROUPS.find((g) => worst && g.vitals.includes(worst.vital)) ?? GROUPS[0];
  const isBp = group.vitals.includes('systolic');
  const value = isBp ? `${r.systolic ?? '—'}/${r.diastolic ?? '—'}` : `${r[group.vitals[0]] ?? '—'}`;
  const unit = VITAL_UNIT[group.vitals[0]];

  let limits = '';
  if (worst) {
    const key = worst.status === 'critical'
      ? (worst.direction === 'below' ? 'minCritical' : 'maxCritical')
      : (worst.direction === 'below' ? 'minAtRisk' : 'maxAtRisk');
    const kind = `${worst.status === 'critical' ? 'critical' : 'at-risk'} ${worst.direction === 'below' ? 'minimum' : 'maximum'}`;
    const limit = isBp ? `${t.systolic[key]}/${t.diastolic[key]}` : `${t[worst.vital][key]}${worst.vital === 'spo2' ? '%' : ''}`;
    limits = `${worst.direction === 'below' ? 'Below' : 'Above'} ${kind} ${limit}`;
  }
  const others: string[] = [];
  if (!isBp && r.systolic !== undefined) others.push(`BP ${r.systolic}/${r.diastolic}`);
  if (group.label !== 'Pulse' && r.pulse !== undefined) others.push(`Pulse ${r.pulse} bpm`);
  if (group.label !== 'SpO2' && r.spo2 !== undefined) others.push(`SpO2 ${r.spo2}%`);
  if (group.label !== 'Glucose' && r.glucose !== undefined) others.push(`Glucose ${r.glucose}`);
  return { label: group.label, value, unit, text: [limits, ...others.slice(0, 1)].filter(Boolean).join(' · ') };
}
