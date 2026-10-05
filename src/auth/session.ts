import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Session } from '@/data/api/core';
import type { Role, User } from '@/data/types';

interface SessionState {
  user: User | null;
  setUser: (user: User | null) => void;
}

/** The signed-in user (persisted, like a token would be). Sign-in logic lives in data/queries/auth. */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    { name: 'rpm-session-v1', partialize: ({ user }) => ({ user }) },
  ),
);

export function toSession(user: User | null): Session | null {
  return user ? { userId: user.id, role: user.role, clinicId: user.clinicId } : null;
}

/** The fake API's view of the signed-in user (null when signed out). */
export function useSession(): Session | null {
  return useSessionStore(useShallow((s) => toSession(s.user)));
}

export function useCurrentUser(): User | null {
  return useSessionStore((s) => s.user);
}

export function getSession(): Session | null {
  return toSession(useSessionStore.getState().user);
}

export const HOME_BY_ROLE: Record<Role, string> = {
  patient: '/patient',
  nurse: '/nurse',
  doctor: '/doctor',
  clinic_admin: '/admin',
  super_admin: '/super',
};
