export type Role = 'patient' | 'nurse' | 'doctor' | 'clinic_admin' | 'super_admin';
export type Status = 'critical' | 'atrisk' | 'normal';
export type VitalKey = 'systolic' | 'diastolic' | 'pulse' | 'spo2' | 'glucose';

export interface Clinic {
  id: string; name: string; city: string; state: string; specialty: string;
  status: 'active' | 'onboarding' | 'paused'; createdAt: string; // ISO
}

export interface User {                 // staff + patients who can sign in
  id: string; clinicId: string | null;  // null = super admin
  role: Role; firstName: string; lastName: string; title?: string; // "Dr.", "RN", "LVN"
  email: string; mfaEnabled: boolean;
  status: 'active' | 'invited' | 'disabled';
  lastActiveAt: string | null; patientId?: string; // set when role = patient
}

export interface Range { minCritical: number; minAtRisk: number; maxAtRisk: number; maxCritical: number; }
export type Thresholds = Record<VitalKey, Range>;

export interface Patient {
  id: string; clinicId: string; mrn: string;
  firstName: string; lastName: string; sex: 'Female' | 'Male'; dob: string;
  phone: string; preferredContact: 'sms' | 'phone' | 'email'; email: string;
  doctorId: string; nurseId: string;
  conditions: string[]; medications: string[]; allergies: string[];
  devices: ('bp' | 'glucose' | 'oximeter')[];
  rpmStatus: 'active' | 'paused' | 'discharged';
  consentSignedAt: string; enrolledAt: string;
  thresholds: Thresholds;
}

export interface Reading {
  id: string; patientId: string; takenAt: string; source: 'device' | 'manual';
  systolic?: number; diastolic?: number; pulse?: number; spo2?: number; glucose?: number;
  mealTiming?: 'before' | 'after';
  status: Status;                 // computed on save (rules/status.ts)
  flags: { vital: VitalKey; status: Status; limit: number; direction: 'below' | 'above' }[];
}

export interface Alert {           // created for every critical / at-risk reading
  id: string; readingId: string; patientId: string; clinicId: string;
  status: Status; createdAt: string;
  state: 'open' | 'in_progress' | 'escalated' | 'closed';
  assignedToId: string | null; closedAt?: string; closedById?: string;
}

export interface CallLog {
  id: string; patientId: string; alertId?: string; staffId: string; at: string;
  outcome: 'reached' | 'voicemail' | 'no_answer';
  liveConversation: boolean; minutes: number;
}

export interface Note { id: string; patientId: string; alertId?: string; authorId: string; at: string; body: string; }

export interface TimeEntry {       // billable staff minutes
  id: string; patientId: string; staffId: string; start: string; minutes: number;
  source: 'timer' | 'manual'; activity: 'call' | 'review' | 'care_coordination';
}

export interface Escalation {
  id: string; alertId: string; patientId: string; fromId: string; toDoctorId: string;
  at: string; reason: string;
  state: 'pending' | 'reviewed'; reviewedAt?: string; doctorResponse?: string;
}

export interface AuditEvent {
  id: string; at: string; actorId: string; clinicId: string | null;
  action: 'view_chart' | 'add_reading' | 'update_thresholds' | 'add_note' | 'log_call'
        | 'escalate' | 'review_escalation' | 'close_alert' | 'invite_user'
        | 'export_billing' | 'add_clinic' | 'sign_in';
  targetType: 'patient' | 'user' | 'clinic' | 'report'; targetId: string; summary: string;
}

export interface BillingRow {      // computed, never stored
  patientId: string; month: string; // 'YYYY-MM'
  readingDays: number; minutes: number; liveCall: boolean;
  deviceCode: '99454' | '99445' | null;
  timeCodes: string[];             // e.g. ['99457', '99458']
  result: 'ready' | 'device_only' | 'needs_live_call' | 'not_eligible';
}
