import type { AuditEvent } from '@/data/types';
import { displayName } from '@/lib/format';
import { copy, db, delay, inScope, requireRole, type Session } from './core';

export interface AuditRow { event: AuditEvent; actor: string; clinic: string }

export interface AuditFilters { clinicId?: string; action?: AuditEvent['action']; from?: string; to?: string; limit?: number }

export const AUDIT_ACTION_LABEL: Record<AuditEvent['action'], string> = {
  view_chart: 'Viewed chart', add_reading: 'Added reading', update_thresholds: 'Updated thresholds', add_note: 'Added note',
  log_call: 'Logged call', escalate: 'Escalated', review_escalation: 'Reviewed escalation', close_alert: 'Closed alert',
  invite_user: 'Invited user', export_billing: 'Exported billing', add_clinic: 'Added clinic', sign_in: 'Signed in',
};

/** Audit log, newest first. Super admin sees every clinic; clinic admin sees their own. */
export async function listAudit(s: Session | null, filters: AuditFilters = {}): Promise<AuditRow[]> {
  requireRole(s, ['super_admin', 'clinic_admin']);
  await delay();
  const data = db();
  const rows: AuditRow[] = [];
  for (const event of [...data.audit].sort((a, b) => b.at.localeCompare(a.at))) {
    if (!inScope(s, event.clinicId)) continue;
    if (filters.clinicId && event.clinicId !== filters.clinicId) continue;
    if (filters.action && event.action !== filters.action) continue;
    if (filters.from && event.at < filters.from) continue;
    if (filters.to && event.at > filters.to) continue;
    const actor = data.users.find((u) => u.id === event.actorId);
    rows.push({
      event,
      actor: actor ? displayName(actor) : 'Unknown user',
      clinic: data.clinics.find((c) => c.id === event.clinicId)?.name ?? 'Platform',
    });
    if (filters.limit && rows.length >= filters.limit) break;
  }
  return copy(rows);
}
