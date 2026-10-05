import type { Role } from '@/data/types';

/** Where a role's patient list and charts live (admins have no chart route). */
export function patientsBase(role: Role | undefined): string {
  if (role === 'doctor') return '/doctor/patients';
  if (role === 'clinic_admin') return '/admin/patients';
  return '/nurse/patients';
}

export function chartPath(role: Role | undefined, patientId: string): string | null {
  if (role === 'doctor' || role === 'nurse') return `${patientsBase(role)}/${patientId}`;
  return null;
}
