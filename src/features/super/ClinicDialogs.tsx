import type { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, Sheet } from '@/components/ui/Dialog';
import { TextField } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toaster';
import type { ClinicRow } from '@/data/api/clinics';
import { useAddClinic, useSetClinicStatus } from '@/data/queries/admin';
import { displayName, formatDate } from '@/lib/format';
import { CLINIC_STATUS } from './clinicStatus';

const schema = z.object({
  name: z.string().trim().min(2, 'Clinic name is required.'),
  city: z.string().trim().min(2, 'City is required.'),
  state: z.string().trim().regex(/^[A-Za-z]{2}$/, 'Use the 2-letter state code, e.g. OK.'),
  specialty: z.string().trim().min(2, 'Specialty is required.'),
  adminEmail: z.email('Enter the first admin’s email.'),
});
type Values = z.infer<typeof schema>;

export function AddClinicDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const add = useAddClinic();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', city: '', state: '', specialty: '', adminEmail: '' } });
  const { errors } = form.formState;
  const submit = form.handleSubmit(async (v) => {
    try {
      const c = await add.mutateAsync(v);
      toast(`${c.name} added. Invite sent to ${v.adminEmail}.`);
      form.reset();
      onOpenChange(false);
    } catch (e) {
      form.setError('adminEmail', { message: e instanceof Error ? e.message : 'Could not add the clinic.' });
    }
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Add clinic" description="The clinic starts in Onboarding. Its first admin gets an invite."
      footer={<>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={() => void submit()} loading={add.isPending}>Add clinic</Button>
      </>}
    >
      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Clinic name" className="sm:col-span-2" error={errors.name?.message} {...form.register('name')} />
        <TextField label="City" error={errors.city?.message} {...form.register('city')} />
        <TextField label="State" maxLength={2} placeholder="OK" error={errors.state?.message} {...form.register('state')} />
        <TextField label="Specialty" className="sm:col-span-2" placeholder="e.g. Nephrology" error={errors.specialty?.message} {...form.register('specialty')} />
        <TextField label="First admin email" type="email" className="sm:col-span-2" error={errors.adminEmail?.message} {...form.register('adminEmail')} />
      </form>
    </Dialog>
  );
}

export function ManageClinicSheet({ row, onClose }: { row: ClinicRow | null; onClose: () => void }) {
  const setStatus = useSetClinicStatus();
  if (!row) return null;
  const { clinic } = row;
  const st = CLINIC_STATUS[clinic.status];
  const next = clinic.status === 'paused' ? 'active' : 'paused';
  const change = async () => {
    await setStatus.mutateAsync({ id: clinic.id, status: next });
    toast(`${clinic.name} is now ${next === 'active' ? 'active' : 'paused'}.`);
    onClose();
  };
  const item = (k: string, v: ReactNode) => (
    <div className="flex flex-col gap-1 border-b border-divider py-3"><dt className="text-xs text-ink-muted">{k}</dt><dd className="m-0 text-sm font-medium tabular">{v}</dd></div>
  );
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={clinic.name} description={`${clinic.city}, ${clinic.state} · ${clinic.specialty}`}
      footer={<Button variant={next === 'paused' ? 'secondary' : 'primary'} onClick={() => void change()} loading={setStatus.isPending}>
        {next === 'paused' ? 'Pause clinic' : 'Activate clinic'}
      </Button>}
    >
      <dl className="m-0">
        {item('Status', <Badge variant={st.variant}>{st.label}</Badge>)}
        {item('On the platform since', formatDate(clinic.createdAt))}
        {item('Staff users', row.staff)}
        {item('Active patients', row.patients.toLocaleString())}
        {item('Reading adherence', `${row.adherence}%`)}
        {item('Clinic admin', row.admin ? `${displayName(row.admin)} · ${row.admin.email}${row.admin.status === 'invited' ? ' (invited)' : ''}` : '—')}
      </dl>
      <p className="mt-4 text-[13px] text-ink-muted">Pausing stops new readings and alerts for this clinic’s patients. Data is kept.</p>
    </Sheet>
  );
}
