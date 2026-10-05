import { format, subMonths } from 'date-fns';
import type { BillingRow, Patient } from '@/data/types';
import { computeBillingRow } from '@/lib/rules/billing';
import { monthLabel } from '@/lib/format';
import { auditEvent, copy, db, delay, requireRole, staffRef, visiblePatients, withAudit, write, type Session, type StaffRef } from './core';

export interface BillingReportRow { row: BillingRow; patient: Patient; doctor: StaffRef | null }

export interface BillingReport {
  month: string;
  rows: BillingReportRow[];
  activePatients: number;
  daysInMonth: number;
  daysLeft: number;
}

/** Current month + previous 2, newest first ('YYYY-MM'). */
export function billingMonths(now: Date = new Date()): string[] {
  return [0, 1, 2].map((n) => format(subMonths(now, n), 'yyyy-MM'));
}

export async function getBillingReport(s: Session | null, month: string): Promise<BillingReport> {
  requireRole(s, ['clinic_admin']);
  await delay();
  const data = db();
  const patients = visiblePatients(s, data);
  const rows = patients.map((patient) => ({
    patient,
    doctor: staffRef(patient.doctorId, data),
    row: computeBillingRow({ patientId: patient.id, month, readings: data.readings, timeEntries: data.timeEntries, callLogs: data.callLogs }),
  }));
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const now = new Date();
  const isCurrent = format(now, 'yyyy-MM') === month;
  return copy({
    month,
    rows: rows.sort((a, b) => b.row.readingDays - a.row.readingDays || a.patient.lastName.localeCompare(b.patient.lastName)),
    activePatients: patients.filter((p) => p.rpmStatus === 'active').length,
    daysInMonth,
    daysLeft: isCurrent ? daysInMonth - now.getDate() : 0,
  });
}

/** Records the CSV export in the audit log. */
export async function recordBillingExport(s: Session | null, month: string): Promise<void> {
  requireRole(s, ['clinic_admin']);
  await delay();
  const label = monthLabel(month).split(' ')[0];
  write((d) => withAudit(d, auditEvent(s, 'export_billing', 'report', `billing_${month}`, `exported ${label} billing report`)));
}
