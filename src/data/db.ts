import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { generateSeed } from '@/lib/seed/generate';
import type { DbData } from './tables';

interface DbState extends DbData {
  resetDemo: () => void;
}

/**
 * The fake database. Only `data/api/*` may import this file.
 * Persisted to localStorage so the demo flows survive reloads.
 */
export const useDb = create<DbState>()(
  persist(
    (set) => ({
      ...generateSeed(),
      resetDemo: () => set(generateSeed()),
    }),
    {
      name: 'rpm-demo-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ resetDemo: _reset, ...data }) => data,
    },
  ),
);

export type { DbData };
