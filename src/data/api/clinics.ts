import type { Clinic, Thresholds, User } from '@/data/types';
import { DEFAULT_THRESHOLDS } from '@/lib/seed/constants';
import { auditEvent, copy, db, delay, forbidden, inScope, newId, requireRole, withAudit, write, type Session } from './core';
import { daysSoFarInMonth, summarizeAll } from './derive';

export interface ClinicRow {
  clinic: Clinic; staff: number; patients: number; adherence: number; admin: User | null;
}

function clinicRows(): ClinicRow[] {
  const data = db();
  return data.clinics.map((clinic) => {
    const stats = data.clinicStats[clinic.id];
    const patients = data.patients.filter((p) => p.clinicId === clinic.id && p.rpmStatus === 'active');
    const admin = data.users.find((u) => u.clinicId === clinic.id && u.role === 'clinic_admin') ?? null;
    if (patients.length === 0 && stats) return { clinic, ...stats, admin };
    const summaries = summarizeAll(data, patients);
    const days = daysSoFarInMonth();
    const adherence = summaries.length
      ? Math.round((summaries.reduce((sum, x) => sum + x.month.readingDays, 0) / (summaries.length * days)) * 100)
      : 0;
    const staff = data.users.filter((u) => u.clinicId === clinic.id && u.role !== 'patient' && u.status !== 'disabled').length;
    return { clinic, staff, patients: patients.length, adherence, admin };
  });
}

export async function listClinics(s: Session | null): Promise<ClinicRow[]> {
  requireRole(s, ['super_admin']);
  await delay();
  return copy(clinicRows());
}

export async function getMyClinic(s: Session | null): Promise<{ clinic: Clinic; defaultThresholds: Thresholds }> {
  requireRole(s, ['clinic_admin', 'doctor', 'nurse', 'patient']);
  await delay();
  const data = db();
  const clinic = data.clinics.find((c) => c.id === s.clinicId);
  if (!clinic) forbidden();
  return copy({ clinic, defaultThresholds: data.clinicSettings[clinic.id]?.defaultThresholds ?? DEFAULT_THRESHOLDS });
}

export async function updateClinicSettings(s: Session | null, input: { name: string; defaultThresholds: Thresholds }): Promise<void> {
  requireRole(s, ['clinic_admin']);
  await delay();
  const id = s.clinicId!;
  const name = input.name.trim();
  if (!name) throw new Error('Clinic name is required.');
  write((d) => ({
    clinics: d.clinics.map((c) => (c.id === id ? { ...c, name } : c)),
    clinicSettings: { ...d.clinicSettings, [id]: { defaultThresholds: input.defaultThresholds } },
  }));
}

export interface AddClinicInput { name: string; city: string; state: string; specialty: string; adminEmail: string }

/** Creates an onboarding clinic plus an invited first admin. */
export async function addClinic(s: Session | null, input: AddClinicInput): Promise<Clinic> {
  requireRole(s, ['super_admin']);
  await delay();
  const email = input.adminEmail.trim().toLowerCase();
  if (db().users.some((u) => u.email.toLowerCase() === email)) throw new Error('That admin email is already in use.');
  const now = new Date().toISOString();
  const clinic: Clinic = {
    id: newId('c'), name: input.name.trim(), city: input.city.trim(), state: input.state.trim().toUpperCase(),
    specialty: input.specialty.trim(), status: 'onboarding', createdAt: now,
  };
  const local = email.split('@')[0].split(/[._-]/).filter(Boolean);
  const cap = (x: string | undefined, fallback: string) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : fallback);
  const admin: User = {
    id: newId('u'), clinicId: clinic.id, role: 'clinic_admin', firstName: cap(local[0], 'Clinic'), lastName: cap(local[1], 'Admin'),
    email, mfaEnabled: false, status: 'invited', lastActiveAt: null,
  };
  write((d) => ({
    clinics: [...d.clinics, clinic],
    users: [...d.users, admin],
    invites: { ...d.invites, [admin.id]: now },
    clinicSettings: { ...d.clinicSettings, [clinic.id]: { defaultThresholds: copy(DEFAULT_THRESHOLDS) } },
    ...withAudit(d,
      auditEvent(s, 'invite_user', 'user', admin.id, `invited ${email} as clinic admin`, clinic.id),
      auditEvent(s, 'add_clinic', 'clinic', clinic.id, `added clinic ${clinic.name}`, clinic.id)),
  }));
  return copy(clinic);
}

export async function setClinicStatus(s: Session | null, clinicId: string, status: Clinic['status']): Promise<void> {
  requireRole(s, ['super_admin']);
  await delay();
  const clinic = db().clinics.find((c) => c.id === clinicId);
  if (!clinic || !inScope(s, clinic.id)) forbidden();
  write((d) => ({ clinics: d.clinics.map((c) => (c.id === clinicId ? { ...c, status } : c)) }));
}
