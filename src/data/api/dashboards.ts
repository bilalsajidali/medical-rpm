import { isToday, subMonths } from 'date-fns';
import type { Reading } from '@/data/types';
import { monthKey } from '@/lib/rules/billing';
import { useDb } from '@/data/db';
import { copy, db, delay, inScope, requireRole, visiblePatients, type Session } from './core';
import { daysSoFarInMonth, summarizeAll, type PatientSummary } from './derive';

export interface DoctorDashboard {
  activePatients: number;
  enrolledThisMonth: number;
  criticalPatients: number;
  criticalReadingsToday: number;
  atRiskPatients: number;
  adherence: number;
  pendingEscalations: number;
  /** most recent escalation's patient (pending first) */
  featuredPatientId: string | null;
  needsReview: NeedsReviewRow[];
}

export interface NeedsReviewRow {
  key: string;
  summary: PatientSummary;
  readingId: string;
  reading: Reading | null;
  status: 'critical' | 'atrisk';
  nurseAction: string;
  receivedAt: string;
  escalationId: string | null;
}

const OUTCOME_ACTION = { reached: 'Reached patient', voicemail: 'Voicemail left', no_answer: 'No answer' } as const;

export async function getDoctorDashboard(s: Session | null): Promise<DoctorDashboard> {
  requireRole(s, ['doctor']);
  await delay();
  const data = db();
  const patients = visiblePatients(s, data).filter((p) => p.rpmStatus === 'active');
  const ids = new Set(patients.map((p) => p.id));
  const summaries = summarizeAll(data, patients);
  const byId = new Map(summaries.map((x) => [x.patient.id, x]));
  const openAlerts = data.alerts.filter((a) => ids.has(a.patientId) && a.state !== 'closed');
  const criticalOpen = openAlerts.filter((a) => a.status === 'critical');
  const pending = data.escalations.filter((e) => e.toDoctorId === s.userId && e.state === 'pending' && ids.has(e.patientId))
    .sort((a, b) => b.at.localeCompare(a.at));
  const latestEsc = pending[0] ?? data.escalations.filter((e) => e.toDoctorId === s.userId).sort((a, b) => b.at.localeCompare(a.at))[0];

  const nurseAction = (alertId: string, escalated: boolean) => {
    const call = data.callLogs.filter((c) => c.alertId === alertId).sort((a, b) => b.at.localeCompare(a.at))[0];
    if (!call) return escalated ? 'Escalated' : 'Not yet contacted';
    return `${OUTCOME_ACTION[call.outcome]}${escalated ? ', escalated' : ', note added'}`;
  };
  const rows: NeedsReviewRow[] = [];
  for (const e of pending) {
    const alert = data.alerts.find((a) => a.id === e.alertId);
    const summary = byId.get(e.patientId);
    if (!alert || !summary) continue;
    rows.push({
      key: e.id, summary, readingId: alert.readingId, reading: data.readings.find((r) => r.id === alert.readingId) ?? null, status: alert.status === 'critical' ? 'critical' : 'atrisk',
      nurseAction: nurseAction(alert.id, true), receivedAt: alert.createdAt, escalationId: e.id,
    });
  }
  for (const a of criticalOpen) {
    if (a.state === 'escalated') continue; // already listed through its escalation
    const summary = byId.get(a.patientId);
    if (!summary) continue;
    const inProgress = a.state === 'in_progress' && !data.callLogs.some((c) => c.alertId === a.id);
    rows.push({
      key: a.id, summary, readingId: a.readingId, reading: data.readings.find((r) => r.id === a.readingId) ?? null, status: 'critical',
      nurseAction: inProgress ? 'Call in progress' : nurseAction(a.id, false), receivedAt: a.createdAt, escalationId: null,
    });
  }
  rows.sort((x, y) => (x.status === y.status ? y.receivedAt.localeCompare(x.receivedAt) : x.status === 'critical' ? -1 : 1));

  const month = monthKey(new Date());
  const days = daysSoFarInMonth();
  return copy({
    activePatients: patients.length,
    enrolledThisMonth: patients.filter((p) => monthKey(p.enrolledAt) === month).length,
    criticalPatients: new Set(criticalOpen.map((a) => a.patientId)).size,
    criticalReadingsToday: data.readings.filter((r) => ids.has(r.patientId) && r.status === 'critical' && isToday(new Date(r.takenAt))).length,
    atRiskPatients: summaries.filter((x) => x.status === 'atrisk').length,
    adherence: summaries.length ? Math.round((summaries.reduce((n, x) => n + x.month.readingDays, 0) / (summaries.length * days)) * 100) : 0,
    pendingEscalations: pending.length,
    featuredPatientId: latestEsc?.patientId ?? summaries[0]?.patient.id ?? null,
    needsReview: rows,
  });
}

export interface AdminOverview {
  activePatients: number; alertsToday: number; openAlerts: number;
  avgResponseMinutes: number | null; readyToBill: number; staff: number; missed: number;
}

export async function getAdminOverview(s: Session | null): Promise<AdminOverview> {
  requireRole(s, ['clinic_admin']);
  await delay();
  const data = db();
  const patients = visiblePatients(s, data);
  const summaries = summarizeAll(data, patients);
  const alerts = data.alerts.filter((a) => inScope(s, a.clinicId));
  const closed = alerts.filter((a) => a.closedAt && new Date(a.createdAt) > subMonths(new Date(), 1));
  const avg = closed.length
    ? Math.round(closed.reduce((n, a) => n + (new Date(a.closedAt!).getTime() - new Date(a.createdAt).getTime()) / 60000, 0) / closed.length)
    : null;
  return copy({
    activePatients: patients.filter((p) => p.rpmStatus === 'active').length,
    alertsToday: alerts.filter((a) => isToday(new Date(a.createdAt))).length,
    openAlerts: alerts.filter((a) => a.state === 'open' || a.state === 'in_progress').length,
    avgResponseMinutes: avg,
    readyToBill: summaries.filter((x) => x.month.billing.result === 'ready').length,
    staff: data.users.filter((u) => inScope(s, u.clinicId) && u.role !== 'patient' && u.status === 'active').length,
    missed: summaries.filter((x) => x.missed).length,
  });
}

export interface SuperOverview {
  clinics: number; onboarding: number; activePatients: number; enrolledThisMonth: number;
  readingsThisMonth: number; readingsPerPatientDay: number; staffUsers: number; allMfa: boolean;
}

export async function getSuperOverview(s: Session | null): Promise<SuperOverview> {
  requireRole(s, ['super_admin']);
  await delay();
  const data = db();
  const month = monthKey(new Date());
  const days = daysSoFarInMonth();
  const detailedClinics = new Set(data.patients.map((p) => p.clinicId));
  const realPatients = data.patients.filter((p) => p.rpmStatus === 'active').length;
  const countOnly = Object.entries(data.clinicStats).filter(([id]) => !detailedClinics.has(id));
  const otherPatients = countOnly.reduce((n, [, st]) => n + st.patients, 0);
  const realReadings = data.readings.filter((r) => monthKey(r.takenAt) === month).length;
  // count-only clinics: estimate from adherence (≈ 2 readings per reading day)
  const otherReadings = countOnly.reduce((n, [, st]) => n + Math.round(st.patients * days * (st.adherence / 100) * 2), 0);
  const staff = data.users.filter((u) => u.role !== 'patient' && u.role !== 'super_admin' && u.status !== 'disabled');
  const otherStaff = countOnly.reduce((n, [id, st]) => n + Math.max(0, st.staff - staff.filter((u) => u.clinicId === id).length), 0);
  const activePatients = realPatients + otherPatients;
  const readingsThisMonth = realReadings + otherReadings;
  return copy({
    clinics: data.clinics.length,
    onboarding: data.clinics.filter((c) => c.status === 'onboarding').length,
    activePatients,
    enrolledThisMonth: data.patients.filter((p) => monthKey(p.enrolledAt) === month).length,
    readingsThisMonth,
    readingsPerPatientDay: activePatients ? Math.round((readingsThisMonth / (activePatients * days)) * 10) / 10 : 0,
    staffUsers: staff.length + otherStaff,
    allMfa: staff.filter((u) => u.status === 'active').every((u) => u.mfaEnabled),
  });
}

/** "Reset demo data": re-runs the seed. */
export async function resetDemo(): Promise<void> {
  await delay();
  useDb.getState().resetDemo();
}
