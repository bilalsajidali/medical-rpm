import { describe, expect, it } from 'vitest';
import type { Thresholds } from '@/data/types';
import { DEFAULT_THRESHOLDS } from '@/lib/seed/constants';
import { computeReadingStatus, evaluateVital, patientStatus, vitalStatus, worstStatus } from './status';

const T: Thresholds = DEFAULT_THRESHOLDS;

describe('vitalStatus', () => {
  const sys = T.systolic; // 94 / 104 / 140 / 180

  it('is critical below minCritical', () => {
    expect(vitalStatus(93, sys)).toBe('critical');
  });
  it('is at-risk at minCritical (not below it) and below minAtRisk', () => {
    expect(vitalStatus(94, sys)).toBe('atrisk');
    expect(vitalStatus(103, sys)).toBe('atrisk');
  });
  it('is normal from minAtRisk to maxAtRisk inclusive', () => {
    expect(vitalStatus(104, sys)).toBe('normal');
    expect(vitalStatus(140, sys)).toBe('normal');
  });
  it('is at-risk above maxAtRisk up to maxCritical', () => {
    expect(vitalStatus(141, sys)).toBe('atrisk');
    expect(vitalStatus(180, sys)).toBe('atrisk');
  });
  it('is critical above maxCritical', () => {
    expect(vitalStatus(181, sys)).toBe('critical');
  });

  it.each([
    ['diastolic', 48, 'critical'], ['diastolic', 58, 'atrisk'], ['diastolic', 75, 'normal'], ['diastolic', 91, 'atrisk'], ['diastolic', 111, 'critical'],
    ['pulse', 49, 'critical'], ['pulse', 59, 'atrisk'], ['pulse', 80, 'normal'], ['pulse', 110, 'atrisk'], ['pulse', 120, 'critical'],
    ['spo2', 87, 'critical'], ['spo2', 91, 'atrisk'], ['spo2', 92, 'normal'], ['spo2', 100, 'normal'],
    ['glucose', 50, 'critical'], ['glucose', 60, 'atrisk'], ['glucose', 120, 'normal'], ['glucose', 161, 'atrisk'], ['glucose', 300, 'critical'],
  ] as const)('%s %d → %s', (vital, value, expected) => {
    expect(vitalStatus(value, T[vital])).toBe(expected);
  });
});

describe('evaluateVital', () => {
  it('reports the crossed limit and direction', () => {
    expect(evaluateVital(82, T.systolic)).toEqual({ status: 'critical', limit: 94, direction: 'below' });
    expect(evaluateVital(186, T.systolic)).toEqual({ status: 'critical', limit: 180, direction: 'above' });
    expect(evaluateVital(100, T.systolic)).toEqual({ status: 'atrisk', limit: 104, direction: 'below' });
    expect(evaluateVital(152, T.systolic)).toEqual({ status: 'atrisk', limit: 140, direction: 'above' });
    expect(evaluateVital(120, T.systolic)).toBeNull();
  });
});

describe('worstStatus', () => {
  it('picks critical over at-risk over normal', () => {
    expect(worstStatus([])).toBe('normal');
    expect(worstStatus(['normal', 'normal'])).toBe('normal');
    expect(worstStatus(['normal', 'atrisk'])).toBe('atrisk');
    expect(worstStatus(['atrisk', 'critical', 'normal'])).toBe('critical');
  });
});

describe('computeReadingStatus', () => {
  it('is normal with no flags when every vital is in range', () => {
    expect(computeReadingStatus({ systolic: 128, diastolic: 84, pulse: 76, spo2: 97 }, T)).toEqual({ status: 'normal', flags: [] });
  });

  it('uses the worst vital and flags every non-normal one', () => {
    const r = computeReadingStatus({ systolic: 82, diastolic: 48, pulse: 79 }, T);
    expect(r.status).toBe('critical');
    expect(r.flags).toEqual([
      { vital: 'systolic', status: 'critical', limit: 94, direction: 'below' },
      { vital: 'diastolic', status: 'critical', limit: 49, direction: 'below' },
    ]);
  });

  it('mixes at-risk and critical flags', () => {
    const r = computeReadingStatus({ systolic: 150, glucose: 312 }, T);
    expect(r.status).toBe('critical');
    expect(r.flags.map((f) => [f.vital, f.status])).toEqual([['systolic', 'atrisk'], ['glucose', 'critical']]);
  });

  it('ignores vitals that are not present', () => {
    expect(computeReadingStatus({ spo2: 88 }, T)).toEqual({
      status: 'atrisk',
      flags: [{ vital: 'spo2', status: 'atrisk', limit: 92, direction: 'below' }],
    });
  });

  it('applies changed thresholds (Flow 4: systolic max at-risk 155)', () => {
    const custom: Thresholds = { ...T, systolic: { ...T.systolic, maxAtRisk: 155 } };
    const r = computeReadingStatus({ systolic: 152, diastolic: 96 }, custom);
    expect(r.status).toBe('atrisk');
    expect(r.flags).toEqual([{ vital: 'diastolic', status: 'atrisk', limit: 90, direction: 'above' }]);
  });
});

describe('patientStatus', () => {
  it('is missed when missed or no reading, else the latest status', () => {
    expect(patientStatus(null, false)).toBe('missed');
    expect(patientStatus({ status: 'critical' }, true)).toBe('missed');
    expect(patientStatus({ status: 'atrisk' }, false)).toBe('atrisk');
  });
});
