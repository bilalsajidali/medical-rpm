import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { listQueue, nurseCounts, openAlert, resolveAlert, type ResolveAlertInput } from '@/data/api/alerts';
import { listCalls, logCall, type LogCallInput } from '@/data/api/calls';
import { listEscalations, reviewEscalation } from '@/data/api/escalations';
import { addNote, latestStaffNote, listTimeline } from '@/data/api/notes';
import { addTimeEntry, listTimeEntries, patientMonthMinutes, type AddTimeInput } from '@/data/api/time';
import type { Escalation } from '@/data/types';
import { CARE_KEYS, qk } from './keys';
import { useApiMutation } from './util';

const QUEUE_POLL_MS = 15_000;

export function useQueue() {
  const s = useSession();
  return useQuery({ queryKey: qk.queue, queryFn: () => listQueue(s), refetchInterval: QUEUE_POLL_MS });
}

export function useNurseCounts(enabled = true) {
  const s = useSession();
  return useQuery({ queryKey: qk.nurseCounts, queryFn: () => nurseCounts(s), refetchInterval: QUEUE_POLL_MS, enabled: enabled && s?.role === 'nurse' });
}

export function useOpenAlert() {
  return useApiMutation((s, alertId: string) => openAlert(s, alertId), [qk.alerts]);
}

export function useResolveAlert() {
  return useApiMutation((s, input: ResolveAlertInput) => resolveAlert(s, input), CARE_KEYS);
}

export function useTimeline(patientId: string | undefined) {
  const s = useSession();
  return useQuery({ queryKey: qk.timeline(patientId ?? ''), queryFn: () => listTimeline(s, patientId!), enabled: !!patientId });
}

export function useLatestStaffNote(patientId: string | undefined) {
  const s = useSession();
  return useQuery({ queryKey: qk.latestNote(patientId ?? ''), queryFn: () => latestStaffNote(s, patientId!), enabled: !!patientId });
}

export function useAddNote() {
  return useApiMutation((s, input: { patientId: string; body: string; alertId?: string }) => addNote(s, input), [qk.timelineAll, qk.auditAll]);
}

export function useCalls(mine = false) {
  const s = useSession();
  return useQuery({ queryKey: qk.calls(mine), queryFn: () => listCalls(s, { mine }) });
}

export function useLogCall() {
  return useApiMutation((s, input: LogCallInput) => logCall(s, input), CARE_KEYS);
}

export function useTimeEntries(opts: { patientId?: string; mine?: boolean; month?: string }) {
  const s = useSession();
  return useQuery({
    queryKey: qk.time(opts),
    queryFn: () => listTimeEntries(s, opts),
    enabled: opts.mine === true || !!opts.patientId,
  });
}

export function useMonthMinutes(patientId: string | undefined) {
  const s = useSession();
  return useQuery({ queryKey: qk.monthMinutes(patientId ?? ''), queryFn: () => patientMonthMinutes(s, patientId!), enabled: !!patientId });
}

export function useAddTimeEntry() {
  return useApiMutation((s, input: AddTimeInput) => addTimeEntry(s, input), [qk.timeAll, qk.patients, qk.billingAll, qk.alerts]);
}

export function useEscalations(state?: Escalation['state']) {
  const s = useSession();
  return useQuery({ queryKey: qk.escalations(state), queryFn: () => listEscalations(s, state) });
}

export function useReviewEscalation() {
  return useApiMutation((s, input: { id: string; response: string }) => reviewEscalation(s, input.id, input.response), CARE_KEYS);
}
