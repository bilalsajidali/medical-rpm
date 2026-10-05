import type { User } from '@/data/types';
import { displayName } from '@/lib/format';
import { auditEvent, copy, db, delay, forbidden, inScope, newId, requireRole, withAudit, write, type Session } from './core';

export interface TeamRow { user: User; patients: number | null; invitedAt: string | null }

export type StaffRoleOption = 'doctor' | 'nurse_rn' | 'nurse_lvn' | 'medical_assistant' | 'call_center' | 'clinic_admin';

export const STAFF_ROLE_OPTIONS: { value: StaffRoleOption; label: string }[] = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse_rn', label: 'Nurse (RN)' },
  { value: 'nurse_lvn', label: 'Nurse (LVN)' },
  { value: 'medical_assistant', label: 'Medical assistant' },
  { value: 'call_center', label: 'Call center' },
  { value: 'clinic_admin', label: 'Clinic admin' },
];

export function roleFromOption(option: StaffRoleOption): Pick<User, 'role' | 'title'> {
  switch (option) {
    case 'doctor': return { role: 'doctor', title: 'Dr.' };
    case 'nurse_rn': return { role: 'nurse', title: 'RN' };
    case 'nurse_lvn': return { role: 'nurse', title: 'LVN' };
    case 'medical_assistant': return { role: 'nurse', title: 'MA' };
    case 'call_center': return { role: 'nurse', title: 'Call center' };
    case 'clinic_admin': return { role: 'clinic_admin', title: undefined };
  }
}

export function optionFromUser(u: Pick<User, 'role' | 'title'>): StaffRoleOption {
  if (u.role === 'doctor') return 'doctor';
  if (u.role === 'clinic_admin') return 'clinic_admin';
  if (u.title === 'LVN') return 'nurse_lvn';
  if (u.title === 'MA') return 'medical_assistant';
  if (u.title === 'Call center') return 'call_center';
  return 'nurse_rn';
}

/** Staff of the admin's clinic, with how many patients each looks after. */
export async function listTeam(s: Session | null): Promise<TeamRow[]> {
  requireRole(s, ['clinic_admin']);
  await delay();
  const data = db();
  const rows = data.users
    .filter((u) => u.role !== 'patient' && u.role !== 'super_admin' && inScope(s, u.clinicId))
    .map((user) => {
      const owns = user.role === 'doctor' || (user.role === 'nurse' && (user.title === 'RN' || user.title === 'LVN'));
      const patients = owns
        ? data.patients.filter((p) => p.clinicId === user.clinicId && (p.doctorId === user.id || p.nurseId === user.id)).length
        : null;
      return { user, patients, invitedAt: data.invites[user.id] ?? null };
    });
  return copy(rows);
}

/** Clinic doctors and nurses (for Add patient, filters). */
export async function listClinicStaff(s: Session | null): Promise<User[]> {
  requireRole(s, ['clinic_admin', 'doctor', 'nurse']);
  await delay();
  return copy(db().users.filter((u) => (u.role === 'doctor' || u.role === 'nurse') && u.status !== 'disabled' && inScope(s, u.clinicId)));
}

export interface InviteInput { firstName: string; lastName: string; email: string; role: StaffRoleOption }

export async function inviteUser(s: Session | null, input: InviteInput): Promise<User> {
  requireRole(s, ['clinic_admin']);
  await delay();
  const email = input.email.trim().toLowerCase();
  if (db().users.some((u) => u.email.toLowerCase() === email)) throw new Error('Someone already uses that email.');
  const user: User = {
    id: newId('u'), clinicId: s.clinicId, ...roleFromOption(input.role),
    firstName: input.firstName.trim(), lastName: input.lastName.trim(), email,
    mfaEnabled: false, status: 'invited', lastActiveAt: null,
  };
  const now = new Date().toISOString();
  write((d) => ({
    users: [...d.users, user],
    invites: { ...d.invites, [user.id]: now },
    ...withAudit(d, auditEvent(s, 'invite_user', 'user', user.id, `invited ${displayName(user)}`)),
  }));
  return copy(user);
}

function scopedStaff(s: Session, userId: string): User {
  const u = db().users.find((x) => x.id === userId);
  if (!u || u.role === 'patient' || !inScope(s, u.clinicId)) forbidden();
  return u;
}

export async function resendInvite(s: Session | null, userId: string): Promise<void> {
  requireRole(s, ['clinic_admin']);
  await delay();
  const u = scopedStaff(s, userId);
  if (u.status !== 'invited') throw new Error('This person already accepted the invite.');
  const now = new Date().toISOString();
  write((d) => ({
    invites: { ...d.invites, [userId]: now },
    ...withAudit(d, auditEvent(s, 'invite_user', 'user', userId, `resent invite to ${displayName(u)}`)),
  }));
}

export async function updateUser(
  s: Session | null, userId: string, input: { role: StaffRoleOption; disabled: boolean },
): Promise<void> {
  requireRole(s, ['clinic_admin']);
  await delay();
  const u = scopedStaff(s, userId);
  if (u.id === s.userId && input.disabled) throw new Error('You cannot disable your own account.');
  const status: User['status'] = input.disabled ? 'disabled' : u.status === 'disabled' ? 'active' : u.status;
  write((d) => ({ users: d.users.map((x) => (x.id === userId ? { ...x, ...roleFromOption(input.role), status } : x)) }));
}
