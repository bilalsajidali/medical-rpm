import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Checkbox, SelectField, TextField } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toaster';
import { optionFromUser, STAFF_ROLE_OPTIONS, type StaffRoleOption } from '@/data/api/team';
import { useInviteUser, useUpdateUser } from '@/data/queries/admin';
import type { User } from '@/data/types';
import { displayName } from '@/lib/format';

const ROLE_VALUES = STAFF_ROLE_OPTIONS.map((o) => o.value) as [StaffRoleOption, ...StaffRoleOption[]];
const inviteSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: z.email('Enter a valid work email.'),
  role: z.enum(ROLE_VALUES),
});
type InviteValues = z.infer<typeof inviteSchema>;

export function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const invite = useInviteUser();
  const form = useForm<InviteValues>({ resolver: zodResolver(inviteSchema), defaultValues: { firstName: '', lastName: '', email: '', role: 'nurse_rn' } });
  const { errors } = form.formState;
  const submit = form.handleSubmit(async (v) => {
    try {
      const u = await invite.mutateAsync(v);
      toast(`Invite sent to ${u.email}.`);
      form.reset();
      onOpenChange(false);
    } catch (e) {
      form.setError('email', { message: e instanceof Error ? e.message : 'Could not send the invite.' });
    }
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Invite team member"
      description="They get an email to set a password and turn on two-factor sign-in."
      footer={<>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={() => void submit()} loading={invite.isPending}>Send invite</Button>
      </>}
    >
      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="First name" error={errors.firstName?.message} {...form.register('firstName')} />
        <TextField label="Last name" error={errors.lastName?.message} {...form.register('lastName')} />
        <TextField label="Work email" type="email" className="sm:col-span-2" placeholder="name@lakesidekidney.example" error={errors.email?.message} {...form.register('email')} />
        <SelectField label="Role" className="sm:col-span-2" options={STAFF_ROLE_OPTIONS} {...form.register('role')} />
      </form>
    </Dialog>
  );
}

export function EditUserDialog({ user, onClose, selfId }: { user: User | null; onClose: () => void; selfId?: string }) {
  const update = useUpdateUser();
  const [role, setRole] = useState<StaffRoleOption>(user ? optionFromUser(user) : 'nurse_rn');
  const [disabled, setDisabled] = useState(user?.status === 'disabled');
  if (!user) return null;
  const save = async () => {
    try {
      await update.mutateAsync({ id: user.id, role, disabled });
      toast(`${displayName(user)} updated.`);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save.');
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={`Edit ${displayName(user)}`} description={user.email}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => void save()} loading={update.isPending}>Save</Button>
      </>}
    >
      <div className="flex flex-col gap-4">
        <SelectField label="Role" options={STAFF_ROLE_OPTIONS} value={role} onChange={(e) => setRole(e.target.value as StaffRoleOption)} />
        <Checkbox label="Disable this account (they can no longer sign in)" checked={disabled}
          disabled={user.id === selfId} onChange={(e) => setDisabled(e.target.checked)} />
      </div>
    </Dialog>
  );
}
