import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button, focusRing } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState, QueryState, SkeletonRows } from '@/components/ui/States';
import type { ClinicRow } from '@/data/api/clinics';
import { useAudit, useClinics, useSuperOverview } from '@/data/queries/admin';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';
import { AddClinicDialog, ManageClinicSheet } from './ClinicDialogs';
import { CLINIC_STATUS } from './clinicStatus';

function AuditCard() {
  const audit = useAudit({ limit: 6 });
  return (
    <Card padding="md" className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5">
      <CardHeader title="Audit log" right={<Link to="/super/audit" className={cn('rounded-full text-[13px] font-semibold text-accent no-underline', focusRing)}>View all</Link>} />
      <span className="-mt-2 text-[13px] text-ink-muted">Who viewed or changed patient data</span>
      {audit.isPending ? <SkeletonRows rows={5} /> : !audit.data?.length ? <EmptyState title="No activity yet" className="py-4" /> : (
        <ul className="m-0 flex list-none flex-col p-0">
          {audit.data.map((a) => (
            <li key={a.event.id} className="flex flex-col gap-0.5 border-b border-divider py-3 first:pt-0 last:border-0">
              <span className="text-sm"><strong className="font-semibold">{a.actor}</strong> {a.event.summary}</span>
              <span className="text-xs text-ink-muted">{a.clinic} · {timeAgo(a.event.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function ClinicsPage() {
  usePageTitle('Clinics');
  const clinics = useClinics();
  const overview = useSuperOverview();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState<ClinicRow | null>(null);
  const o = overview.data;

  const columns: ColumnDef<ClinicRow>[] = [
    { id: 'clinic', header: 'Clinic', accessorFn: (r) => r.clinic.name, cell: ({ row: { original: r } }) => <div className="flex flex-col"><span className="font-semibold">{r.clinic.name}</span><span className="text-xs text-ink-muted">{r.clinic.city}, {r.clinic.state} · since {format(new Date(r.clinic.createdAt), 'MMM yyyy')}</span></div> },
    { id: 'spec', header: 'Specialty', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{row.original.clinic.specialty}</span> },
    { id: 'staff', header: 'Staff', accessorFn: (r) => r.staff },
    { id: 'patients', header: 'Patients', accessorFn: (r) => r.patients, cell: ({ row }) => row.original.patients.toLocaleString() },
    { id: 'adh', header: 'Adherence', accessorFn: (r) => r.adherence, cell: ({ row: { original: r } }) => <div className="flex items-center gap-2"><ProgressBar height={6} value={r.adherence} label={`Adherence for ${r.clinic.name}`} className="w-[70px]" /><span>{r.adherence}%</span></div> },
    { id: 'status', header: 'Status', enableSorting: false, cell: ({ row }) => { const s = CLINIC_STATUS[row.original.clinic.status]; return <Badge variant={s.variant}>{s.label}</Badge>; } },
    { id: 'action', header: 'Action', enableSorting: false, meta: { align: 'right' }, cell: ({ row }) => <Button variant="secondary" size="sm" onClick={() => setManaging(row.original)}>Manage</Button> },
  ];
  const visible = (clinics.data ?? []).filter((r) => !q.trim() || `${r.clinic.name} ${r.clinic.city}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PageHeader title="Clinics" subtitle="Every clinic on the platform. Each clinic only sees its own data."
        actions={<Button icon={<Plus size={18} strokeWidth={2} />} onClick={() => setAdding(true)}>Add clinic</Button>} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <KpiCard size="md" label="Clinics" value={o?.clinics ?? '…'} sub={o ? `${o.onboarding} onboarding` : undefined} />
        <KpiCard size="md" label="Active patients" value={o ? o.activePatients.toLocaleString() : '…'} sub={o ? `+${o.enrolledThisMonth} this month` : undefined} />
        <KpiCard size="md" label="Readings this month" value={o ? o.readingsThisMonth.toLocaleString() : '…'} sub={o ? `Avg ${o.readingsPerPatientDay} per patient per day` : undefined} />
        <KpiCard size="md" label="Staff users" value={o?.staffUsers ?? '…'} sub={o ? (o.allMfa ? 'All with two-factor on' : 'Some without two-factor') : undefined} />
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <Card padding="md" className="flex min-w-0 flex-[2_1_640px] flex-col gap-3.5">
          <CardHeader title="All clinics" right={<SearchInput value={q} onChange={setQ} placeholder="Search clinics" className="w-full sm:w-auto" inputClassName="sm:w-[170px]" />} />
          <QueryState query={clinics} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No clinics yet" />}>
            {() => <DataTable data={visible} columns={columns} getRowId={(r) => r.clinic.id} minWidth={760} resetKey={q} empty={<EmptyState title="No clinics match" />} />}
          </QueryState>
        </Card>
        <AuditCard />
      </div>
      <AddClinicDialog open={adding} onOpenChange={setAdding} />
      {managing && <ManageClinicSheet row={managing} onClose={() => setManaging(null)} />}
    </>
  );
}
