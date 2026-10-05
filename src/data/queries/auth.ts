import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/auth/session';
import { checkCredentials, completeSignIn, demoUserId, verifyMfa } from '@/data/api/auth';
import { resetDemo } from '@/data/api/dashboards';
import type { Role } from '@/data/types';

export function useCheckCredentials() {
  return useMutation({ mutationFn: (email: string) => checkCredentials(email) });
}

export function useVerifyMfa() {
  return useMutation({ mutationFn: (code: string) => verifyMfa(code) });
}

/** Finishes sign-in for a user id (after password/MFA, or from the demo switcher). */
export function useCompleteSignIn() {
  const client = useQueryClient();
  const setUser = useSessionStore((s) => s.setUser);
  return useMutation({
    mutationFn: (userId: string) => completeSignIn(userId),
    onSuccess: (user) => {
      client.clear();
      setUser(user);
    },
  });
}

export function useDemoSignIn() {
  const complete = useCompleteSignIn();
  return { ...complete, signInAs: (role: Role) => complete.mutateAsync(demoUserId(role)) };
}

export function useSignOut() {
  const client = useQueryClient();
  const setUser = useSessionStore((s) => s.setUser);
  return () => {
    setUser(null);
    client.clear();
  };
}

/** Re-runs the seed and signs out. */
export function useResetDemo() {
  const signOut = useSignOut();
  return useMutation({ mutationFn: resetDemo, onSuccess: signOut });
}
