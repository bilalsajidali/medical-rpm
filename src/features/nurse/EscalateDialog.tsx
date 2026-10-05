import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextArea } from '@/components/ui/Field';

const schema = z.object({ reason: z.string().trim().min(5, 'Tell the doctor why (at least a few words).').max(600) });

export function EscalateDialog({ open, onOpenChange, doctorName, onConfirm, saving }: {
  open: boolean; onOpenChange: (o: boolean) => void; doctorName: string;
  onConfirm: (reason: string) => Promise<void>; saving: boolean;
}) {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { reason: '' } });
  const submit = form.handleSubmit(async ({ reason }) => {
    await onConfirm(reason);
    form.reset();
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Escalate to doctor"
      description={`${doctorName} will see this in Needs review. Your call outcome, note and time are saved with it.`}
      footer={<>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={() => void submit()} loading={saving}>Escalate</Button>
      </>}
    >
      <form onSubmit={submit} noValidate>
        <TextArea label="Reason" rows={4} placeholder="What should the doctor review?" autoFocus
          error={form.formState.errors.reason?.message} {...form.register('reason')} />
      </form>
    </Dialog>
  );
}
