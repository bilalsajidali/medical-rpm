import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { TextArea } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toaster';
import type { StaffRef } from '@/data/api/core';
import { CALL_REQUEST_PREFIX } from '@/data/api/notes';
import { useAddNote } from '@/data/queries/care';
import { nameWithCredential } from '@/lib/format';

const messageSchema = z.object({ body: z.string().trim().min(2, 'Write a short message.').max(1000, 'Keep it under 1000 characters.') });

function MessageDialog({ open, onOpenChange, patientId }: { open: boolean; onOpenChange: (o: boolean) => void; patientId: string }) {
  const addNote = useAddNote();
  const form = useForm<z.infer<typeof messageSchema>>({ resolver: zodResolver(messageSchema), defaultValues: { body: '' } });
  const submit = form.handleSubmit(async ({ body }) => {
    await addNote.mutateAsync({ patientId, body });
    toast('Message sent. Your care team will reply within one business day.');
    form.reset();
    onOpenChange(false);
  });
  return (
    <Dialog
      open={open} onOpenChange={onOpenChange} title="Send a message"
      description="Your nurse reads messages on weekdays. For an emergency, call 911."
      footer={<>
        <Button variant="secondary" size="lg" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button size="lg" onClick={() => void submit()} loading={addNote.isPending}>Send message</Button>
      </>}
    >
      <form onSubmit={submit} noValidate>
        <TextArea label="Message" rows={5} labelClassName="text-base" className="[&_textarea]:text-base"
          error={form.formState.errors.body?.message} {...form.register('body')} />
      </form>
    </Dialog>
  );
}

function Member({ person, role }: { person: StaffRef; role: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar firstName={person.firstName} lastName={person.lastName} size={44} tone="staff" />
      <div className="flex grow flex-col">
        <span className="text-base font-semibold">{nameWithCredential(person)}</span>
        <span className="text-sm text-ink-muted">{role}</span>
      </div>
    </div>
  );
}

export function CareTeamCard({ patientId, doctor, nurse, specialty }: {
  patientId: string; doctor: StaffRef | null; nurse: StaffRef | null; specialty?: string;
}) {
  const [open, setOpen] = useState(false);
  const addNote = useAddNote();
  const requestCall = async () => {
    await addNote.mutateAsync({ patientId, body: `${CALL_REQUEST_PREFIX}: the patient asked for a phone call from the care team.` });
    toast('Call requested. Your nurse will call you soon.');
  };
  return (
    <Card padding="none" className="p-[22px]">
      <div className="flex flex-col gap-3">
        <CardHeader title="Your care team" />
        {doctor && <Member person={doctor} role={`Your doctor${specialty ? ` · ${specialty}` : ''}`} />}
        {nurse && <Member person={nurse} role="Your nurse · Mon–Fri, 8 AM–5 PM" />}
        <div className="flex flex-wrap gap-2.5">
          <Button className="h-12 flex-1 text-[15px]" onClick={() => setOpen(true)}>Send a message</Button>
          <Button variant="secondary" className="h-12 flex-1 text-[15px]" onClick={() => void requestCall()} loading={addNote.isPending}>Request a call</Button>
        </div>
      </div>
      <MessageDialog open={open} onOpenChange={setOpen} patientId={patientId} />
    </Card>
  );
}
