import type {
  Alert, AuditEvent, CallLog, Clinic, Escalation, Note, Patient, Reading, Thresholds, TimeEntry, User,
} from './types';

export interface ClinicStats { staff: number; patients: number; adherence: number }

/** Everything the fake database holds. */
export interface DbData {
  clinics: Clinic[];
  users: User[];
  patients: Patient[];
  readings: Reading[];
  alerts: Alert[];
  callLogs: CallLog[];
  notes: Note[];
  timeEntries: TimeEntry[];
  escalations: Escalation[];
  audit: AuditEvent[];
  /** per-clinic settings (default thresholds for new patients) */
  clinicSettings: Record<string, { defaultThresholds: Thresholds }>;
  /** count-only stats for clinics without detailed demo data */
  clinicStats: Record<string, ClinicStats>;
  /** when each invited user was (last) invited */
  invites: Record<string, string>;
  seededAt: string;
}
