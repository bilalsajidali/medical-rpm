import { describe, expect, it } from 'vitest';
import { isMissed } from '@/lib/rules/missed';
import { generateSeed } from './generate';

const now = new Date(2026, 9, 5, 15, 0);
const data = generateSeed(now);
const byName = (first: string) => data.patients.find((p) => p.firstName === first)!;

describe('seed', () => {
  it('is deterministic for the same "now"', () => {
    expect(generateSeed(now)).toEqual(data);
  });

  it('has 6 clinics, 40 Lakeside patients and the named staff', () => {
    expect(data.clinics).toHaveLength(6);
    expect(data.patients).toHaveLength(40);
    for (const email of ['a.patel@lakesidekidney.example', 'n.lopez@lakesidekidney.example', 'r.green@lakesidekidney.example']) {
      expect(data.users.some((u) => u.email === email)).toBe(true);
    }
    expect(data.users.find((u) => u.firstName === 'Tom')?.status).toBe('invited');
  });

  it('has exactly 4 open critical alerts today for the scripted patients', () => {
    const critical = data.alerts.filter((a) => a.status === 'critical' && a.state !== 'closed');
    const names = critical.map((a) => data.patients.find((p) => p.id === a.patientId)!.firstName).sort();
    expect(names).toEqual(['Barbara', 'James', 'Linda', 'Robert']);
  });

  it('has exactly 3 missed patients', () => {
    const missed = data.patients.filter((p) => {
      const latest = data.readings.filter((r) => r.patientId === p.id).at(-1);
      return isMissed(p, latest?.takenAt ?? null, now);
    });
    expect(missed.map((p) => p.firstName).sort()).toEqual(['Ellen', 'George', 'Walter']);
  });

  it('gives Mary a morning reading today and no evening reading yet', () => {
    const mary = byName('Mary');
    const today = data.readings.filter((r) => r.patientId === mary.id && new Date(r.takenAt).toDateString() === now.toDateString());
    expect(today).toHaveLength(1);
    expect(new Date(today[0].takenAt).getHours()).toBeLessThan(12);
    expect(data.alerts.some((a) => a.patientId === mary.id && a.state !== 'closed')).toBe(false);
  });

  it('keeps every reading status consistent with the patient thresholds', () => {
    expect(data.readings.every((r) => (r.flags.length === 0) === (r.status === 'normal'))).toBe(true);
  });

  it('is roughly 10% out of range', () => {
    const share = data.readings.filter((r) => r.status !== 'normal').length / data.readings.length;
    expect(share).toBeGreaterThan(0.04);
    expect(share).toBeLessThan(0.16);
  });

  it('has one pending escalation for Dr. Patel', () => {
    expect(data.escalations.filter((e) => e.state === 'pending' && e.toDoctorId === 'u_patel')).toHaveLength(1);
  });

  it('uses fake contact details', () => {
    expect(data.patients.every((p) => /555-01\d\d$/.test(p.phone) && p.email.endsWith('.example'))).toBe(true);
  });
});
