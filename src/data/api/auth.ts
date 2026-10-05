import type { Role, User } from '@/data/types';
import { DEMO_USER_IDS } from '@/lib/seed/constants';
import { copy, db, delay, write } from './core';

export interface SignInResult {
  user: User;
  /** staff accounts need the 6-digit code step */
  needsMfa: boolean;
}

/** Step 1: email + password (any password works in the prototype). */
export async function checkCredentials(email: string): Promise<SignInResult> {
  await delay();
  const user = db().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) throw new Error('We could not find an account with that email.');
  if (user.status === 'disabled') throw new Error('This account is disabled. Contact your clinic admin.');
  if (user.status === 'invited') throw new Error('This invite has not been accepted yet.');
  return { user: copy(user), needsMfa: user.role !== 'patient' };
}

/** Step 2 (staff): any 6 digits pass in the prototype. */
export async function verifyMfa(code: string): Promise<void> {
  await delay();
  if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit code from your authenticator app.');
}

/** Final step: records the sign-in and returns the user. */
export async function completeSignIn(userId: string): Promise<User> {
  await delay();
  const user = db().users.find((u) => u.id === userId);
  if (!user || user.status !== 'active') throw new Error('Forbidden');
  const now = new Date().toISOString();
  write((d) => ({
    users: d.users.map((u) => (u.id === userId ? { ...u, lastActiveAt: now } : u)),
    audit: [{
      id: `au_${crypto.randomUUID().slice(0, 8)}`, at: now, actorId: userId, clinicId: user.clinicId,
      action: 'sign_in', targetType: 'user', targetId: userId, summary: 'signed in',
    }, ...d.audit],
  }));
  return copy({ ...user, lastActiveAt: now });
}

export function demoUserId(role: Role): string {
  return DEMO_USER_IDS[role];
}

/** Synchronous lookup used by the session store (no network in the real app either: it's the JWT). */
export function findUser(userId: string): User | null {
  const u = db().users.find((x) => x.id === userId);
  return u && u.status === 'active' ? copy(u) : null;
}
