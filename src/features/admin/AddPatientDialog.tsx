import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Checkbox, SelectField, TextField } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toaster';
import { useClinicStaff } from '@/data/queries/admin';
import { useAddPatient } from '@/data/queries/patients';
import { displayName, nameWithCredential } from '@/lib/format';
import { CONDITIONS } from '@/lib/seed/constants';

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  dob: z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v) < new Date(), 'Enter a valid date of birth.'),
  sex: z.enum(['Female', 'Male']),
  phone: z.string().trim().regex(/^[\d\s()+-]{10,}$/, 'Enter a phone number, e.g. (918) 555-0142.'),
  email: z.email('Enter a valid email.'),
  doctorId: z.string().min(1, 'Choose a doctor.'),
  nurseId: z.string().min(1, 'Choose a nurse.'),
  conditions: z.array(z.string()).min(1, 'Choose at least one condition.'),
  consent: z.boolean().refine((v) => v, 'The patient must sign RPM consent before enrollment.'),
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  firstName: '', lastName: '', dob: '', sex: 'Female', phone: '', email: '', doctorId: '', nurseId: '', conditions: [], consent: false,
};

export function AddPatientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const staff = useClinicStaff();
  const add = useAddPatient();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const { errors } = form.formState;
  const doctors = (staff.data ?? []).filter((u) => u.role === 'doctor' && u.status === 'active');
  const nurses = (staff.data ?? []).filter((u) => u.role === 'nurse' && (u.title === 'RN' || u.title === 'LVN') && u.status === 'active');

  const submit = form.handleSubmit(async (v) => {
    try {
      const p = await add.mutateAsync(v);
      toast(`${p.firstName} ${p.lastName} enrolled (MRN ${p.mrn}). Status shows Missed until the first reading arrives.`);
      form.reset(EMPTY);
      onOpenChange(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not add the patient.');
    }
  });

  return (
    <Dialog
      open={open} onOpenChange={onOpenChange} size="lg" title="Add patient"
      description="Enroll a patient in remote monitoring. They get the clinic’s default thresholds."
      footer={<>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={() => void submit()} loading={add.isPending}>Add patient</Button>
      </>}
    >
      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="First name" autoComplete="off" error={errors.firstName?.message} {...form.register('firstName')} />
        <TextField label="Last name" autoComplete="off" error={errors.lastName?.message} {...form.register('lastName')} />
        <TextField label="Date of birth" type="date" error={errors.dob?.message} {...form.register('dob')} />
        <SelectField label="Sex" options={[{ value: 'Female', label: 'Female' }, { value: 'Male', label: 'Male' }]} {...form.register('sex')} />
        <TextField label="Phone" type="tel" placeholder="(918) 555-0142" error={errors.phone?.message} {...form.register('phone')} />
        <TextField label="Email" type="email" placeholder="name@mail.example" error={errors.email?.message} {...form.register('email')} />
        <SelectField label="Doctor" error={errors.doctorId?.message}
          options={[{ value: '', label: 'Choose a doctor' }, ...doctors.map((d) => ({ value: d.id, label: displayName(d) }))]} {...form.register('doctorId')} />
        <SelectField label="Nurse" error={errors.nurseId?.message}
          options={[{ value: '', label: 'Choose a nurse' }, ...nurses.map((n) => ({ value: n.id, label: nameWithCredential(n) }))]} {...form.register('nurseId')} />
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0 sm:col-span-2">
          <legend className="mb-2 text-sm font-semibold">Conditions</legend>
          <Controller control={form.control} name="conditions" render={({ field }) => (
            <div className="flex flex-wrap gap-x-5 gap-y-2.5">
              {CONDITIONS.map((c) => (
                <Checkbox key={c} label={c} checked={field.value.includes(c)}
                  onChange={(e) => field.onChange(e.target.checked ? [...field.value, c] : field.value.filter((x) => x !== c))} />
              ))}
            </div>
          )} />
          {errors.conditions && <span role="alert" className="text-[13px] font-medium text-critical-ink">{errors.conditions.message}</span>}
        </fieldset>
        <Checkbox className="sm:col-span-2" label="Patient signed RPM consent (required)" error={errors.consent?.message} {...form.register('consent')} />
      </form>
    </Dialog>
  );
}
