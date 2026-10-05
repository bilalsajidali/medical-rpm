import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import type { Session } from '@/data/api/core';

/** A mutation that calls a fake API function with the session and invalidates the given keys. */
export function useApiMutation<TInput, TResult>(
  fn: (s: Session | null, input: TInput) => Promise<TResult>,
  invalidate: readonly QueryKey[],
) {
  const session = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => fn(session, input),
    onSuccess: async () => {
      await Promise.all(invalidate.map((queryKey) => client.invalidateQueries({ queryKey })));
    },
  });
}
