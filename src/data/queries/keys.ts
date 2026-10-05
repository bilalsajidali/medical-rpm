/** Query keys. Everything is scoped to the signed-in user because the cache is cleared on sign-in/out. */
export const qk = {
  patients: ['patients'] as const,
  patient: (id: string) => ['patients', id] as const,
  myPatient: ['patients', 'me'] as const,
  readings: (patientId: string, days?: number) => ['readings', patientId, days ?? 'all'] as const,
  readingsAll: ['readings'] as const,
  queue: ['alerts', 'queue'] as const,
  alerts: ['alerts'] as const,
  nurseCounts: ['alerts', 'counts'] as const,
  timeline: (patientId: string) => ['timeline', patientId] as const,
  timelineAll: ['timeline'] as const,
  latestNote: (patientId: string) => ['timeline', patientId, 'latest-note'] as const,
  calls: (mine: boolean) => ['calls', mine] as const,
  callsAll: ['calls'] as const,
  time: (opts: object) => ['time', opts] as const,
  timeAll: ['time'] as const,
  monthMinutes: (patientId: string) => ['time', 'month', patientId] as const,
  escalations: (state?: string) => ['escalations', state ?? 'all'] as const,
  escalationsAll: ['escalations'] as const,
  team: ['team'] as const,
  staff: ['team', 'staff'] as const,
  clinics: ['clinics'] as const,
  myClinic: ['clinics', 'mine'] as const,
  billing: (month: string) => ['billing', month] as const,
  billingAll: ['billing'] as const,
  audit: (filters: object) => ['audit', filters] as const,
  auditAll: ['audit'] as const,
  dashboards: ['dashboards'] as const,
  doctorDashboard: ['dashboards', 'doctor'] as const,
  adminOverview: ['dashboards', 'admin'] as const,
  superOverview: ['dashboards', 'super'] as const,
};

/** Everything that depends on readings, alerts, calls, notes or time. */
export const CARE_KEYS = [
  qk.patients, qk.readingsAll, qk.alerts, qk.timelineAll, qk.callsAll, qk.timeAll,
  qk.escalationsAll, qk.billingAll, qk.dashboards, qk.auditAll,
];
