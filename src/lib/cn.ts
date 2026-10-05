import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge about our custom radius and font-size-free tokens so classes merge correctly.
const twMerge = extendTailwindMerge({
  extend: {
    theme: { radius: ['card', 'inner'] },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
