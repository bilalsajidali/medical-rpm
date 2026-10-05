import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import {
  addPatient, getMyPatient, getPatient, listPatients, logChartView, updateMedicalHistory, updateThresholds,
  type MedicalHistoryInput, type NewPatientInput,
} from '@/data/api/patients';
import { addReading, listReadings, type AddReadingInput } from '@/data/api/readings';
import type { Session } from '@/data/api/core';
import type { Thresholds } from '@/data/types';
import { CARE_KEYS, qk } from './keys';
import { useApiMutation } from './util';

export function usePatients() {
  const s = useSession();
  return useQuery({ queryKey: qk.patients, queryFn: () => listPatients(s) });
}

export function usePatient(id: string | undefined) {
  const s = useSession();
  return useQuery({ queryKey: qk.patient(id ?? ''), queryFn: () => getPatient(s, id!), enabled: !!id });
}

export function useMyPatient() {
  const s = useSession();
  return useQuery({ queryKey: qk.myPatient, queryFn: () => getMyPatient(s) });
}

export function useReadings(patientId: string | undefined, days?: number) {
  const s = useSession();
  return useQuery({
    queryKey: qk.readings(patientId ?? '', days),
    queryFn: () => listReadings(s, patientId!, days),
    enabled: !!patientId,
  });
}

export function useAddReading() {
  return useApiMutation((s, input: AddReadingInput) => addReading(s, input), CARE_KEYS);
}

export function useLogChartView() {
  return useApiMutation((s, id: string) => logChartView(s, id), [qk.auditAll]);
}

export function useAddPatient() {
  return useApiMutation((s, input: NewPatientInput) => addPatient(s, input), [qk.patients, qk.dashboards, qk.billingAll, qk.clinics]);
}

export function useUpdateMedicalHistory() {
  return useApiMutation(
    (s: Session | null, input: { id: string; data: MedicalHistoryInput }) => updateMedicalHistory(s, input.id, input.data),
    [qk.patients],
  );
}

export function useUpdateThresholds() {
  return useApiMutation(
    (s: Session | null, input: { id: string; thresholds: Thresholds }) => updateThresholds(s, input.id, input.thresholds),
    [qk.patients, qk.auditAll],
  );
}
