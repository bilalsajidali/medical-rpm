import { describe, expect, it } from 'vitest';
import { billingResult, computeBillingRow, deviceCodeFor, formatTimeCodes, timeCodesFor } from './billing';

describe('deviceCodeFor', () => {
  it.each([
    [0, null], [1, null], [2, '99445'], [15, '99445'], [16, '99454'], [30, '99454'],
  ] as const)('%d reading days → %s', (days, code) => {
    expect(deviceCodeFor(days)).toBe(code);
  });
});

describe('timeCodesFor', () => {
  it('gives no time codes without a live call', () => {
    expect(timeCodesFor(9, false)).toEqual([]);
    expect(timeCodesFor(20, false)).toEqual([]);
    expect(timeCodesFor(60, false)).toEqual([]);
  });

  it.each([
    [0, []],
    [9, []],
    [10, ['99470']],
    [19, ['99470']],
    [20, ['99457']],
    [39, ['99457']],
    [40, ['99457', '99458']],
    [59, ['99457', '99458']],
    [60, ['99457', '99458', '99458']],
  ] as const)('%d min with live call → %j', (minutes, codes) => {
    expect(timeCodesFor(minutes, true)).toEqual(codes);
  });
});

describe('billingResult', () => {
  it('is not eligible without a device code', () => {
    expect(billingResult(null, [], 45, true)).toBe('not_eligible');
  });
  it('is ready with a device code and a time code', () => {
    expect(billingResult('99454', ['99457'], 24, true)).toBe('ready');
    expect(billingResult('99445', ['99470'], 12, true)).toBe('ready');
  });
  it('needs a live call when minutes ≥ 10 but no live conversation', () => {
    expect(billingResult('99454', [], 10, false)).toBe('needs_live_call');
    expect(billingResult('99454', [], 22, false)).toBe('needs_live_call');
  });
  it('is device only otherwise', () => {
    expect(billingResult('99454', [], 9, false)).toBe('device_only');
    expect(billingResult('99445', [], 6, true)).toBe('device_only');
  });
});

describe('computeBillingRow', () => {
  const month = '2026-09';
  const day = (d: number, h = 8) => new Date(2026, 8, d, h, 0).toISOString();

  it('counts distinct reading days, sums minutes and finds a live call in the month only', () => {
    const readings = [
      ...Array.from({ length: 16 }, (_, i) => ({ patientId: 'p1', takenAt: day(i + 1) })),
      { patientId: 'p1', takenAt: day(1, 19) },                         // same day, counted once
      { patientId: 'p1', takenAt: new Date(2026, 9, 1, 8).toISOString() }, // next month
      { patientId: 'p2', takenAt: day(20) },                            // other patient
    ];
    const timeEntries = [
      { patientId: 'p1', start: day(3), minutes: 25 },
      { patientId: 'p1', start: day(9), minutes: 15 },
      { patientId: 'p1', start: new Date(2026, 7, 31, 12).toISOString(), minutes: 30 }, // previous month
    ];
    const callLogs = [{ patientId: 'p1', at: day(3), liveConversation: true }];
    const row = computeBillingRow({ patientId: 'p1', month, readings, timeEntries, callLogs });
    expect(row).toEqual({
      patientId: 'p1', month, readingDays: 16, minutes: 40, liveCall: true,
      deviceCode: '99454', timeCodes: ['99457', '99458'], result: 'ready',
    });
  });

  it('15 reading days, 22 min, no live call → 99445, needs live call', () => {
    const readings = Array.from({ length: 15 }, (_, i) => ({ patientId: 'p1', takenAt: day(i + 1) }));
    const row = computeBillingRow({
      patientId: 'p1', month, readings,
      timeEntries: [{ patientId: 'p1', start: day(2), minutes: 22 }],
      callLogs: [{ patientId: 'p1', at: day(2), liveConversation: false }],
    });
    expect(row.deviceCode).toBe('99445');
    expect(row.liveCall).toBe(false);
    expect(row.timeCodes).toEqual([]);
    expect(row.result).toBe('needs_live_call');
  });

  it('1 reading day → not eligible', () => {
    const row = computeBillingRow({
      patientId: 'p1', month, readings: [{ patientId: 'p1', takenAt: day(4) }], timeEntries: [], callLogs: [],
    });
    expect(row.readingDays).toBe(1);
    expect(row.result).toBe('not_eligible');
  });
});

describe('formatTimeCodes', () => {
  it('formats code lists', () => {
    expect(formatTimeCodes([])).toBe('—');
    expect(formatTimeCodes(['99470'])).toBe('99470');
    expect(formatTimeCodes(['99457'])).toBe('99457');
    expect(formatTimeCodes(['99457', '99458'])).toBe('99457 + 99458');
    expect(formatTimeCodes(['99457', '99458', '99458'])).toBe('99457 + 99458 ×2');
  });
});
