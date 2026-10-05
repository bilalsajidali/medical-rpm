import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCurrentUser } from '@/auth/session';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { EmptyState, QueryState } from '@/components/ui/States';
import { toast } from '@/components/ui/Toaster';
import type { TeamRow } from '@/data/api/team';
import { useAdminOverview, useMyClinic, useResendInvite, useTeam } from '@/data/queries/admin';
import type { User } from '@/data/types';
import { displayName, roleLabel, timeAgo } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';
import { EditUserDialog, InviteDialog } from './TeamDialogs';

type Filter = 'all' | 'doctor' | 'nurse' | 'clinic_admin';
const STATUS_BADGE = { active: ['success', 'Active'], invited: ['neutral', 'Invited'], disabled: ['faint', 'Disabled'] } as const;

function lastActive(r: TeamRow): string {
  if (r.user.status === 'invited') return r.invitedAt ? `Sent ${format(new Date(r.invitedAt), 'MMM d')}` : 'Invite sent';
  if (!r.user.lastActiveAt) return '—';
  const ago = timeAgo(r.user.lastActiveAt);
  return ago === 'Just now' || ago.endsWith('min ago') && parseInt(ago, 10) < 5 ? 'Now' : ago;
}

export default function TeamPage() {
  usePageTitle('Team');
  const me = useCurrentUser();
  const team = useTeam();
  const overview = useAdminOverview();
  const clinic = useMyClinic();
  const resend = useResendInvite();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const rows = useMemo(() => team.data ?? [], [team.data]);
  const visible = rows.filter((r) => (filter === 'all' || r.user.role === filter)
    && (!q.trim() || `${displayName(r.user)} ${r.user.email}`.toLowerCase().includes(q.trim().toLowerCase())));

  const columns: ColumnDef<TeamRow>[] = [
    {
      id: 'name', header: 'Name', accessorFn: (r) => r.user.lastName,
      cell: ({ row: { original: r } }) => (
        <div className="flex items-center gap-2.5">
          <Avatar firstName={r.user.firstName} lastName={r.user.lastName} />
          <div className="flex flex-col"><span className="font-semibold">{displayName(r.user)}</span><span className="text-xs text-ink-muted">{r.user.email}</span></div>
        </div>
      ),
    },
    { id: 'role', header: 'Role', enableSorting: false, cell: ({ row }) => <Badge variant="tag" className="font-semibold">{roleLabel(row.original.user)}</Badge> },
    { id: 'patients', header: 'Patients', accessorFn: (r) => r.patients ?? -1, cell: ({ row }) => row.original.patients ?? '—' },
    { id: 'mfa', header: 'Two-factor', enableSorting: false, cell: ({ row }) => <span className={row.original.user.mfaEnabled ? 'font-medium text-normal-ink' : 'font-medium text-ink-muted'}>{row.original.user.mfaEnabled ? 'On' : 'Not set'}</span> },
    { id: 'last', header: 'Last active', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{lastActive(row.original)}</span> },
    {
      id: 'status', header: 'Status', enableSorting: false,
      cell: ({ row }) => { const [v, l] = STATUS_BADGE[row.original.user.status]; return <Badge variant={v}>{l}</Badge>; },
    },
    {
      id: 'action', header: 'Action', enableSorting: false, meta: { align: 'right' },
      cell: ({ row: { original: r } }) => r.user.status === 'invited'
        ? <Button variant="secondary" size="sm" onClick={() => resend.mutate(r.user.id, { onSuccess: () => toast(`Invite resent to ${r.user.email}.`) })}>Resend invite</Button>
        : <Button variant="secondary" size="sm" onClick={() => setEditing(r.user)}>Edit</Button>,
    },
  ];

  const count = (f: (r: TeamRow) => boolean) => (team.data ? rows.filter(f).length : '…');
  return (
    <>
      <PageHeader title="Team" subtitle={`Doctors, nurses and staff who can sign in to ${clinic.data?.clinic.name ?? 'your clinic'}`}
        actions={<Button icon={<Plus size={18} strokeWidth={2} />} onClick={() => setInviting(true)}>Invite team member</Button>} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <KpiCard size="md" label="Doctors" value={count((r) => r.user.role === 'doctor' && r.user.status !== 'disabled')} />
        <KpiCard size="md" label="Nurses & call center" value={count((r) => r.user.role === 'nurse' && r.user.status !== 'disabled')} />
        <KpiCard size="md" label="Active patients" value={overview.data?.activePatients ?? '…'} />
        <KpiCard size="md" label="Pending invites" value={count((r) => r.user.status === 'invited')} />
      </div>
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedTabs aria-label="Role" value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'All', count: rows.length }, { value: 'doctor', label: 'Doctors' }, { value: 'nurse', label: 'Nurses' }, { value: 'clinic_admin', label: 'Admins' },
          ]} />
          <SearchInput value={q} onChange={setQ} placeholder="Search team" className="w-full sm:w-auto" inputClassName="sm:w-[180px]" />
        </div>
        <QueryState query={team} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No team members yet" body="Invite your first doctor or nurse." />}>
          {() => <DataTable data={visible} columns={columns} getRowId={(r) => r.user.id} minWidth={880} resetKey={`${filter}-${q}`}
            empty={<EmptyState title="Nobody matches" body="Try another filter or search." />} />}
        </QueryState>
      </Card>
      <InviteDialog open={inviting} onOpenChange={setInviting} />
      {editing && <EditUserDialog key={editing.id} user={editing} onClose={() => setEditing(null)} selfId={me?.id} />}
    </>
  );
}
