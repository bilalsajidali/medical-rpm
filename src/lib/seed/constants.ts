import type { Thresholds } from '@/data/types';

/** Clinic default thresholds (minCritical / minAtRisk / maxAtRisk / maxCritical). */
export const DEFAULT_THRESHOLDS: Thresholds = {
  systolic: { minCritical: 94, minAtRisk: 104, maxAtRisk: 140, maxCritical: 180 },
  diastolic: { minCritical: 49, minAtRisk: 59, maxAtRisk: 90, maxCritical: 110 },
  pulse: { minCritical: 50, minAtRisk: 60, maxAtRisk: 109, maxCritical: 119 },
  spo2: { minCritical: 88, minAtRisk: 92, maxAtRisk: 100, maxCritical: 101 },
  glucose: { minCritical: 51, minAtRisk: 61, maxAtRisk: 160, maxCritical: 299 },
};

export const CONDITIONS = ['CKD Stage 3', 'CKD Stage 4', 'Hypertension', 'Type 2 diabetes', 'CHF'] as const;

export const LAKESIDE_ID = 'c_lakeside';

/** Seeded demo accounts used by the login "Demo mode" switcher. */
export const DEMO_USER_IDS = {
  patient: 'u_mary',
  nurse: 'u_nina',
  doctor: 'u_patel',
  clinic_admin: 'u_rachel',
  super_admin: 'u_sam',
} as const;
