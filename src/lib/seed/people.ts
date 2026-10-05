import type { Clinic, User } from '@/data/types';
import { LAKESIDE_ID } from './constants';

type DoctorKey = 'patel' | 'carter' | 'kim';
type NurseKey = 'nina' | 'omar';

export interface PatientDef {
  first: string; last: string; sex: 'Female' | 'Male'; age: number; mrn: string;
  conditions: string[]; doctor: DoctorKey; nurse: NurseKey;
  /** extra chance of an at-risk reading per slot */
  risk: number;
  /** days without readings at the end (missed patients) */
  gapDays?: number;
  /** enrolled this many days ago (default: months ago) */
  enrolledDaysAgo?: number;
  /** a live call happened this month */
  liveThisMonth?: boolean;
}

export const DOCTOR_IDS: Record<DoctorKey, string> = { patel: 'u_patel', carter: 'u_carter', kim: 'u_kim' };
export const NURSE_IDS: Record<NurseKey, string> = { nina: 'u_nina', omar: 'u_omar' };

/** 40 Lakeside patients. The first ones match the design references. */
export const PATIENT_DEFS: PatientDef[] = [
  { first: 'Mary', last: 'Collins', sex: 'Female', age: 72, mrn: '10482', conditions: ['CKD Stage 3', 'Hypertension', 'Type 2 diabetes'], doctor: 'patel', nurse: 'nina', risk: 0, liveThisMonth: true },
  { first: 'James', last: 'Turner', sex: 'Male', age: 68, mrn: '10391', conditions: ['Hypertension'], doctor: 'patel', nurse: 'nina', risk: 0.08, liveThisMonth: false },
  { first: 'Linda', last: 'Brooks', sex: 'Female', age: 75, mrn: '10422', conditions: ['Type 2 diabetes'], doctor: 'patel', nurse: 'omar', risk: 0.12, liveThisMonth: true },
  { first: 'Robert', last: 'Hayes', sex: 'Male', age: 81, mrn: '10237', conditions: ['CHF'], doctor: 'patel', nurse: 'omar', risk: 0.1, liveThisMonth: true },
  { first: 'Thomas', last: 'Reed', sex: 'Male', age: 77, mrn: '10155', conditions: ['Hypertension'], doctor: 'carter', nurse: 'nina', risk: 0.12, liveThisMonth: true },
  { first: 'Kathleen', last: 'Owens', sex: 'Female', age: 82, mrn: '10318', conditions: ['CKD Stage 4'], doctor: 'carter', nurse: 'omar', risk: 0.03, liveThisMonth: true },
  { first: 'Morris', last: 'Neal', sex: 'Male', age: 80, mrn: '10274', conditions: ['Hypertension'], doctor: 'carter', nurse: 'nina', risk: 0.02, liveThisMonth: false },
  { first: 'Zelda', last: 'Roberts', sex: 'Female', age: 86, mrn: '10196', conditions: ['CHF'], doctor: 'kim', nurse: 'omar', risk: 0.06, liveThisMonth: true },
  { first: 'Susan', last: 'Price', sex: 'Female', age: 66, mrn: '10509', conditions: ['Type 2 diabetes'], doctor: 'patel', nurse: 'omar', risk: 0.12, liveThisMonth: true },
  { first: 'George', last: 'Hill', sex: 'Male', age: 79, mrn: '10447', conditions: ['CKD Stage 3'], doctor: 'kim', nurse: 'nina', risk: 0.04, gapDays: 3, liveThisMonth: false },
  { first: 'Barbara', last: 'Ellis', sex: 'Female', age: 73, mrn: '10466', conditions: ['Hypertension', 'CKD Stage 3'], doctor: 'patel', nurse: 'nina', risk: 0.1, liveThisMonth: true },
  { first: 'Charles', last: 'Ward', sex: 'Male', age: 70, mrn: '10288', conditions: ['Hypertension', 'CHF'], doctor: 'patel', nurse: 'omar', risk: 0.1, liveThisMonth: true },
  { first: 'Patricia', last: 'Moore', sex: 'Female', age: 69, mrn: '10351', conditions: ['CHF'], doctor: 'kim', nurse: 'nina', risk: 0.1, liveThisMonth: true },
  { first: 'Ellen', last: 'Ford', sex: 'Female', age: 71, mrn: '10533', conditions: ['CKD Stage 3'], doctor: 'kim', nurse: 'omar', risk: 0, gapDays: 4, enrolledDaysAgo: 8, liveThisMonth: false },
  { first: 'Walter', last: 'Grant', sex: 'Male', age: 84, mrn: '10129', conditions: ['CKD Stage 4', 'Hypertension'], doctor: 'carter', nurse: 'nina', risk: 0.05, gapDays: 5, liveThisMonth: true },
  { first: 'Dorothy', last: 'Fields', sex: 'Female', age: 78, mrn: '10372', conditions: ['Hypertension'], doctor: 'patel', nurse: 'nina', risk: 0.1 },
  { first: 'Harold', last: 'Jensen', sex: 'Male', age: 74, mrn: '10214', conditions: ['Type 2 diabetes', 'CKD Stage 3'], doctor: 'carter', nurse: 'omar', risk: 0.12 },
  { first: 'Margaret', last: 'Lin', sex: 'Female', age: 67, mrn: '10495', conditions: ['Hypertension'], doctor: 'kim', nurse: 'nina', risk: 0.06 },
  { first: 'Frank', last: 'Russo', sex: 'Male', age: 76, mrn: '10168', conditions: ['CHF', 'Hypertension'], doctor: 'patel', nurse: 'omar', risk: 0.1 },
  { first: 'Evelyn', last: 'Park', sex: 'Female', age: 83, mrn: '10307', conditions: ['CKD Stage 4'], doctor: 'carter', nurse: 'nina', risk: 0.05 },
  { first: 'Raymond', last: 'Cole', sex: 'Male', age: 65, mrn: '10441', conditions: ['Type 2 diabetes'], doctor: 'kim', nurse: 'omar', risk: 0.14 },
  { first: 'Gloria', last: 'Simmons', sex: 'Female', age: 72, mrn: '10259', conditions: ['Hypertension', 'Type 2 diabetes'], doctor: 'patel', nurse: 'nina', risk: 0.1 },
  { first: 'Arthur', last: 'Bell', sex: 'Male', age: 88, mrn: '10102', conditions: ['CHF'], doctor: 'carter', nurse: 'omar', risk: 0.08 },
  { first: 'Joan', last: 'Whitaker', sex: 'Female', age: 70, mrn: '10386', conditions: ['CKD Stage 3'], doctor: 'kim', nurse: 'nina', risk: 0.03 },
  { first: 'Eugene', last: 'Ross', sex: 'Male', age: 79, mrn: '10227', conditions: ['Hypertension'], doctor: 'patel', nurse: 'omar', risk: 0.09 },
  { first: 'Helen', last: 'Castillo', sex: 'Female', age: 64, mrn: '10518', conditions: ['Type 2 diabetes'], doctor: 'carter', nurse: 'nina', risk: 0.11 },
  { first: 'Albert', last: 'Nguyen', sex: 'Male', age: 73, mrn: '10343', conditions: ['CKD Stage 3', 'Type 2 diabetes'], doctor: 'kim', nurse: 'omar', risk: 0.08 },
  { first: 'Ruth', last: 'Dawson', sex: 'Female', age: 85, mrn: '10141', conditions: ['CHF', 'CKD Stage 4'], doctor: 'patel', nurse: 'nina', risk: 0.1 },
  { first: 'Carl', last: 'Peterson', sex: 'Male', age: 69, mrn: '10402', conditions: ['Hypertension'], doctor: 'carter', nurse: 'omar', risk: 0.04 },
  { first: 'Shirley', last: 'Mason', sex: 'Female', age: 77, mrn: '10265', conditions: ['Type 2 diabetes', 'Hypertension'], doctor: 'kim', nurse: 'nina', risk: 0.1 },
  { first: 'Victor', last: 'Ramos', sex: 'Male', age: 62, mrn: '10527', conditions: ['CKD Stage 3'], doctor: 'patel', nurse: 'omar', risk: 0.05 },
  { first: 'Irene', last: 'Foster', sex: 'Female', age: 80, mrn: '10178', conditions: ['Hypertension'], doctor: 'carter', nurse: 'nina', risk: 0.07 },
  { first: 'Lawrence', last: 'Kelly', sex: 'Male', age: 75, mrn: '10314', conditions: ['CHF'], doctor: 'kim', nurse: 'omar', risk: 0.09 },
  { first: 'Norma', last: 'Vasquez', sex: 'Female', age: 68, mrn: '10459', conditions: ['Type 2 diabetes'], doctor: 'patel', nurse: 'nina', risk: 0.12 },
  { first: 'Roy', last: 'Hughes', sex: 'Male', age: 82, mrn: '10233', conditions: ['CKD Stage 4', 'Hypertension'], doctor: 'carter', nurse: 'omar', risk: 0.06 },
  { first: 'Theresa', last: 'Bryant', sex: 'Female', age: 74, mrn: '10398', conditions: ['Hypertension'], doctor: 'kim', nurse: 'nina', risk: 0.05 },
  { first: 'Wayne', last: 'Morales', sex: 'Male', age: 66, mrn: '10501', conditions: ['Type 2 diabetes', 'CKD Stage 3'], doctor: 'patel', nurse: 'omar', risk: 0.1 },
  { first: 'Alice', last: 'Murphy', sex: 'Female', age: 87, mrn: '10117', conditions: ['CHF'], doctor: 'carter', nurse: 'nina', risk: 0.08 },
  { first: 'Dennis', last: 'Howard', sex: 'Male', age: 71, mrn: '10426', conditions: ['Hypertension'], doctor: 'kim', nurse: 'omar', risk: 0.04 },
  { first: 'Lillian', last: 'Gray', sex: 'Female', age: 79, mrn: '10282', conditions: ['CKD Stage 3', 'Hypertension'], doctor: 'patel', nurse: 'nina', risk: 0.06 },
];

export function buildClinics(now: Date): Clinic[] {
  const y = now.getFullYear();
  const iso = (month: number) => new Date(y, month, 6, 10).toISOString();
  return [
    { id: LAKESIDE_ID, name: 'Lakeside Kidney Care', city: 'Tulsa', state: 'OK', specialty: 'Nephrology', status: 'active', createdAt: iso(0) },
    { id: 'c_prairie', name: 'Prairie Heart Associates', city: 'Wichita', state: 'KS', specialty: 'Cardiology', status: 'active', createdAt: iso(1) },
    { id: 'c_riverbend', name: 'Riverbend Family Medicine', city: 'Little Rock', state: 'AR', specialty: 'Primary care', status: 'active', createdAt: iso(2) },
    { id: 'c_summit', name: 'Summit Endocrine Clinic', city: 'Denver', state: 'CO', specialty: 'Endocrinology', status: 'active', createdAt: iso(4) },
    { id: 'c_bayview', name: 'Bayview Internal Medicine', city: 'Corpus Christi', state: 'TX', specialty: 'Internal medicine', status: 'active', createdAt: iso(6) },
    { id: 'c_northgate', name: 'Northgate Senior Health', city: 'Omaha', state: 'NE', specialty: 'Geriatrics', status: 'onboarding', createdAt: new Date(now.getTime() - 12 * 864e5).toISOString() },
  ];
}

/** Count-only stats for the clinics that have no detailed demo data. */
export const CLINIC_STATS: Record<string, { staff: number; patients: number; adherence: number }> = {
  c_prairie: { staff: 9, patients: 312, adherence: 82 },
  c_riverbend: { staff: 8, patients: 274, adherence: 79 },
  c_summit: { staff: 7, patients: 196, adherence: 88 },
  c_bayview: { staff: 9, patients: 184, adherence: 74 },
  c_northgate: { staff: 4, patients: 0, adherence: 0 },
};

export function buildUsers(now: Date): User[] {
  const ago = (min: number) => new Date(now.getTime() - min * 60000).toISOString();
  const staff = (u: Omit<User, 'mfaEnabled' | 'status' | 'clinicId'> & Partial<User>): User => ({
    clinicId: LAKESIDE_ID, mfaEnabled: true, status: 'active', ...u,
  });
  return [
    staff({ id: 'u_patel', role: 'doctor', firstName: 'A.', lastName: 'Patel', title: 'Dr.', email: 'a.patel@lakesidekidney.example', lastActiveAt: ago(40) }),
    staff({ id: 'u_carter', role: 'doctor', firstName: 'Brad', lastName: 'Carter', title: 'Dr.', email: 'b.carter@lakesidekidney.example', lastActiveAt: ago(95) }),
    staff({ id: 'u_kim', role: 'doctor', firstName: 'Hannah', lastName: 'Kim', title: 'Dr.', email: 'h.kim@lakesidekidney.example', lastActiveAt: ago(26 * 60) }),
    staff({ id: 'u_nina', role: 'nurse', firstName: 'Nina', lastName: 'Lopez', title: 'RN', email: 'n.lopez@lakesidekidney.example', lastActiveAt: ago(1) }),
    staff({ id: 'u_omar', role: 'nurse', firstName: 'Omar', lastName: 'Khan', title: 'LVN', email: 'o.khan@lakesidekidney.example', lastActiveAt: ago(2) }),
    staff({ id: 'u_valerie', role: 'nurse', firstName: 'Valerie', lastName: 'Ortiz', title: 'MA', email: 'v.ortiz@lakesidekidney.example', lastActiveAt: ago(180) }),
    staff({ id: 'u_tom', role: 'nurse', firstName: 'Tom', lastName: 'Becker', title: 'Call center', email: 't.becker@lakesidekidney.example', mfaEnabled: false, status: 'invited', lastActiveAt: null }),
    staff({ id: 'u_rachel', role: 'clinic_admin', firstName: 'Rachel', lastName: 'Green', email: 'r.green@lakesidekidney.example', lastActiveAt: ago(3) }),
    { id: 'u_sam', clinicId: null, role: 'super_admin', firstName: 'Sam', lastName: 'Avery', email: 'sam.avery@rpmplatform.example', mfaEnabled: true, status: 'active', lastActiveAt: ago(5) },
    { id: 'u_dana', clinicId: 'c_northgate', role: 'clinic_admin', firstName: 'Dana', lastName: 'Ruiz', email: 'd.ruiz@northgatesenior.example', mfaEnabled: true, status: 'active', lastActiveAt: ago(22 * 60) },
    { id: 'u_mary', clinicId: LAKESIDE_ID, role: 'patient', firstName: 'Mary', lastName: 'Collins', email: 'mary.collins@mail.example', mfaEnabled: false, status: 'active', lastActiveAt: ago(600), patientId: 'p_01' },
  ];
}

/** Invite timestamp for invited users (shown as "Sent …"). */
export const INVITED_DAYS_AGO: Record<string, number> = { u_tom: 7 };
