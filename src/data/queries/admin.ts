import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { listAudit, type AuditFilters } from '@/data/api/audit';
import { getBillingReport, recordBillingExport } from '@/data/api/billing';
import { addClinic, getMyClinic, listClinics, setClinicStatus, updateClinicSettings, type AddClinicInput } from '@/data/api/clinics';
import { getAdminOverview, getDoctorDashboard, getSuperOverview } from '@/data/api/dashboards';
import { inviteUser, listClinicStaff, listTeam, resendInvite, updateUser, type InviteInput, type StaffRoleOption } from '@/data/api/team';
import type { Clinic, Thresholds } from '@/data/types';
import { qk } from './keys';
import { useApiMutation } from './util';

export function useDoctorDashboard() {
  const s = useSession();
  return useQuery({ queryKey: qk.doctorDashboard, queryFn: () => getDoctorDashboard(s), refetchInterval: 30_000 });
}

export function useAdminOverview() {
  const s = useSession();
  return useQuery({ queryKey: qk.adminOverview, queryFn: () => getAdminOverview(s) });
}

export function useSuperOverview() {
  const s = useSession();
  return useQuery({ queryKey: qk.superOverview, queryFn: () => getSuperOverview(s) });
}

export function useTeam() {
  const s = useSession();
  return useQuery({ queryKey: qk.team, queryFn: () => listTeam(s) });
}

export function useClinicStaff() {
  const s = useSession();
  return useQuery({ queryKey: qk.staff, queryFn: () => listClinicStaff(s) });
}

export function useInviteUser() {
  return useApiMutation((s, input: InviteInput) => inviteUser(s, input), [qk.team, qk.auditAll]);
}

export function useResendInvite() {
  return useApiMutation((s, userId: string) => resendInvite(s, userId), [qk.team, qk.auditAll]);
}

export function useUpdateUser() {
  return useApiMutation(
    (s, input: { id: string; role: StaffRoleOption; disabled: boolean }) => updateUser(s, input.id, input),
    [qk.team, qk.patients],
  );
}

export function useBillingReport(month: string) {
  const s = useSession();
  return useQuery({ queryKey: qk.billing(month), queryFn: () => getBillingReport(s, month) });
}

export function useRecordBillingExport() {
  return useApiMutation((s, month: string) => recordBillingExport(s, month), [qk.auditAll]);
}

export function useClinics() {
  const s = useSession();
  return useQuery({ queryKey: qk.clinics, queryFn: () => listClinics(s) });
}

export function useMyClinic(enabled = true) {
  const s = useSession();
  return useQuery({ queryKey: qk.myClinic, queryFn: () => getMyClinic(s), staleTime: 60_000, enabled: enabled && !!s && s.role !== 'super_admin' });
}

export function useUpdateClinicSettings() {
  return useApiMutation((s, input: { name: string; defaultThresholds: Thresholds }) => updateClinicSettings(s, input), [qk.myClinic, qk.clinics]);
}

export function useAddClinic() {
  return useApiMutation((s, input: AddClinicInput) => addClinic(s, input), [qk.clinics, qk.superOverview, qk.auditAll]);
}

export function useSetClinicStatus() {
  return useApiMutation(
    (s, input: { id: string; status: Clinic['status'] }) => setClinicStatus(s, input.id, input.status),
    [qk.clinics, qk.superOverview],
  );
}

export function useAudit(filters: AuditFilters) {
  const s = useSession();
  return useQuery({ queryKey: qk.audit(filters), queryFn: () => listAudit(s, filters) });
}
