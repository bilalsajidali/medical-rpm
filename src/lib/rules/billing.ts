import { format } from 'date-fns';
import type { BillingRow, CallLog, Reading, TimeEntry } from '@/data/types';

export const BILLING_DISCLAIMER = 'Report only. Codes per CMS 2026 rules. No claims are sent.';

/** 'YYYY-MM' for a date, in local time. */
export function monthKey(date: Date | string): string {
  return format(typeof date === 'string' ? new Date(date) : date, 'yyyy-MM');
}

export function deviceCodeFor(readingDays: number): BillingRow['deviceCode'] {
  if (readingDays >= 16) return '99454';
  if (readingDays >= 2) return '99445';
  return null;
}

/** Time codes need a live conversation in the month. */
export function timeCodesFor(minutes: number, liveCall: boolean): string[] {
  if (!liveCall) return [];
  if (minutes >= 20) {
    const extra = Math.floor((minutes - 20) / 20);
    return ['99457', ...Array.from({ length: extra }, () => '99458')];
  }
  if (minutes >= 10) return ['99470'];
  return [];
}

export function billingResult(
  deviceCode: BillingRow['deviceCode'],
  timeCodes: string[],
  minutes: number,
  liveCall: boolean,
): BillingRow['result'] {
  if (!deviceCode) return 'not_eligible';
  if (timeCodes.length > 0) return 'ready';
  if (minutes >= 10 && !liveCall) return 'needs_live_call';
  return 'device_only';
}

interface BillingInput {
  patientId: string;
  month: string; // 'YYYY-MM'
  readings: Pick<Reading, 'patientId' | 'takenAt'>[];
  timeEntries: Pick<TimeEntry, 'patientId' | 'start' | 'minutes'>[];
  callLogs: Pick<CallLog, 'patientId' | 'at' | 'liveConversation'>[];
}

/** Billing codes for one patient in one calendar month. Inputs may include other patients and months. */
export function computeBillingRow({ patientId, month, readings, timeEntries, callLogs }: BillingInput): BillingRow {
  const days = new Set<string>();
  for (const r of readings) {
    if (r.patientId === patientId && monthKey(r.takenAt) === month) days.add(format(new Date(r.takenAt), 'yyyy-MM-dd'));
  }
  const minutes = timeEntries
    .filter((t) => t.patientId === patientId && monthKey(t.start) === month)
    .reduce((sum, t) => sum + t.minutes, 0);
  const liveCall = callLogs.some((c) => c.patientId === patientId && c.liveConversation && monthKey(c.at) === month);
  const readingDays = days.size;
  const deviceCode = deviceCodeFor(readingDays);
  const timeCodes = timeCodesFor(minutes, liveCall);
  return {
    patientId, month, readingDays, minutes, liveCall, deviceCode, timeCodes,
    result: billingResult(deviceCode, timeCodes, minutes, liveCall),
  };
}

/** "99457 + 99458" / "99457 + 99458 ×2" style label. */
export function formatTimeCodes(codes: string[]): string {
  if (codes.length === 0) return '—';
  const extra = codes.filter((c) => c === '99458').length;
  if (extra === 0) return codes[0];
  return extra === 1 ? `${codes[0]} + 99458` : `${codes[0]} + 99458 ×${extra}`;
}

export const BILLING_RESULT_LABEL: Record<BillingRow['result'], string> = {
  ready: 'Ready',
  device_only: 'Device only',
  needs_live_call: 'Needs live call',
  not_eligible: 'Not eligible',
};
