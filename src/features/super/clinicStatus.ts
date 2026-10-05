import type { BadgeVariant } from '@/components/ui/Badge';
import type { Clinic } from '@/data/types';

export const CLINIC_STATUS: Record<Clinic['status'], { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  onboarding: { label: 'Onboarding', variant: 'accent' },
  paused: { label: 'Paused', variant: 'neutral' },
};
