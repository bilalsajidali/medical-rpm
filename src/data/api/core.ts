import { useDb } from '@/data/db';
import type { DbData } from '@/data/tables';
import type { AuditEvent, Patient, Role, User } from '@/data/types';

/** The signed-in user as the fake API sees it (mimics a JWT's claims). */
export interface Session {
  userId: string;
  role: Role;
  clinicId: string | null;
}

export type StaffRef = Pick<User, 'id' | 'firstName' | 'lastName' | 'role' | 'title'>;

/** 200–400 ms of fake network latency. */
export function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 200));
}

/** Plain copy so screens never hold store references. */
export function copy<T>(value: T): T {
  return structuredClone(value);
}

export function db(): DbData {
  return useDb.getState();
}

export function write(update: (draft: DbData) => Partial<DbData>): void {
  useDb.setState((state) => update(state));
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function forbidden(): never {
  throw new Error('Forbidden');
}

/** Throws Forbidden unless the session has one of the roles. */
export function requireRole(s: Session | null, roles: Role[]): asserts s is Session {
  if (!s || !roles.includes(s.role)) forbidden();
}

/** Row-level security: clinic users only see their clinic; super admin sees all. */
export function inScope(s: Session, clinicId: string | null): boolean {
  return s.role === 'super_admin' || (s.clinicId !== null && s.clinicId === clinicId);
}

/** Patients this session may see: own clinic; doctors only their own; patients only themselves. */
export function visiblePatients(s: Session, data: DbData = db()): Patient[] {
  return data.patients.filter((p) => {
    if (!inScope(s, p.clinicId)) return false;
    if (s.role === 'doctor') return p.doctorId === s.userId;
    if (s.role === 'patient') return data.users.find((u) => u.id === s.userId)?.patientId === p.id;
    return true;
  });
}

export function getVisiblePatient(s: Session, patientId: string, data: DbData = db()): Patient {
  const p = visiblePatients(s, data).find((x) => x.id === patientId);
  if (!p) forbidden();
  return p;
}

export function staffRef(id: string | null | undefined, data: DbData = db()): StaffRef | null {
  const u = data.users.find((x) => x.id === id);
  return u ? { id: u.id, firstName: u.firstName, lastName: u.lastName, role: u.role, title: u.title } : null;
}

export function auditEvent(
  s: Session,
  action: AuditEvent['action'],
  targetType: AuditEvent['targetType'],
  targetId: string,
  summary: string,
  clinicId: string | null = s.clinicId,
): AuditEvent {
  return { id: newId('au'), at: new Date().toISOString(), actorId: s.userId, clinicId, action, targetType, targetId, summary };
}

/** Prepend audit events (newest first). */
export function withAudit(data: DbData, ...events: AuditEvent[]): Pick<DbData, 'audit'> {
  return { audit: [...events, ...data.audit] };
}
