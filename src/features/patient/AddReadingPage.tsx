import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ChevronLeft, Info } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { NumberField } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { toast } from '@/components/ui/Toaster';
import { useMyPatient, useAddReading } from '@/data/queries/patients';
import type { Reading, VitalKey } from '@/data/types';
import { usePageTitle } from '@/lib/usePageTitle';

const RANGES: Record<VitalKey, [number, number, string]> = {
  systolic: [50, 260, 'Top number'], diastolic: [30, 160, 'Bottom number'],
  pulse: [30, 220, 'Pulse'], spo2: [70, 100, 'Oxygen'], glucose: [20, 600, 'Sugar'],
};

const field = z.string().trim();
const schema = z.object({
  systolic: field, diastolic: field, pulse: field, spo2: field, glucose: field,
  mealTiming: z.enum(['before', 'after']),
}).superRefine((v, ctx) => {
  const keys = Object.keys(RANGES) as VitalKey[];
  for (const k of keys) {
    if (v[k] === '') continue;
    const n = Number(v[k]);
    const [min, max, label] = RANGES[k];
    if (!Number.isInteger(n) || n < min || n > max) ctx.addIssue({ code: 'custom', path: [k], message: `${label} should be between ${min} and ${max}.` });
  }
  if ((v.systolic === '') !== (v.diastolic === '')) {
    ctx.addIssue({ code: 'custom', path: [v.systolic === '' ? 'systolic' : 'diastolic'], message: 'Enter both blood pressure numbers.' });
  }
  if (keys.every((k) => v[k] === '')) ctx.addIssue({ code: 'custom', path: ['systolic'], message: 'Enter at least one reading.' });
});
type FormValues = z.infer<typeof schema>;

const NAMES: { vitals: VitalKey[]; name: string }[] = [
  { vitals: ['systolic', 'diastolic'], name: 'blood pressure' },
  { vitals: ['pulse'], name: 'pulse' },
  { vitals: ['spo2'], name: 'oxygen' },
  { vitals: ['glucose'], name: 'sugar' },
];

/** "Saved. Your blood pressure is above your range. Your care team has been notified." */
export function savedMessage(reading: Reading): string {
  if (reading.status === 'normal') return 'Saved. All your numbers are in your range.';
  const parts = NAMES.flatMap(({ vitals, name }) => {
    const flag = reading.flags.find((f) => vitals.includes(f.vital));
    return flag ? [`your ${name} is ${flag.direction} your range`] : [];
  });
  const sentence = parts.join(' and ');
  return `Saved. ${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}. Your care team has been notified.`;
}

export default function AddReadingPage() {
  const now = new Date();
  const slot = now.getHours() < 14 ? 'Morning reading' : 'Evening reading';
  usePageTitle('Add reading');
  const navigate = useNavigate();
  const me = useMyPatient();
  const add = useAddReading();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { systolic: '', diastolic: '', pulse: '', spo2: '', glucose: '', mealTiming: 'before' },
  });
  const { errors } = form.formState;
  const meal = useWatch({ control: form.control, name: 'mealTiming' });

  const onSubmit = form.handleSubmit(async (v) => {
    if (!me.data) return;
    const num = (s: string) => (s === '' ? undefined : Number(s));
    try {
      const { reading } = await add.mutateAsync({
        patientId: me.data.patient.id,
        values: { systolic: num(v.systolic), diastolic: num(v.diastolic), pulse: num(v.pulse), spo2: num(v.spo2), glucose: num(v.glucose) },
        mealTiming: v.mealTiming,
      });
      toast(savedMessage(reading));
      navigate('/patient');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save. Please try again.');
    }
  });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col bg-bg md:min-h-0">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 md:px-0 md:pt-0">
        <IconButton aria-label="Back" size={48} icon={<ChevronLeft size={22} strokeWidth={2} />} onClick={() => navigate('/patient')} />
        <div className="flex flex-col">
          <h1 className="m-0 font-display text-[22px] font-semibold">{slot}</h1>
          <span className="text-[15px] text-ink-muted">{format(now, 'EEE, MMM d · h:mm a')}</span>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex grow flex-col gap-3 px-5 pt-1 pb-4 md:px-0">
        <div className="flex items-start gap-2.5 rounded-inner border border-border bg-surface px-3.5 py-3 text-[15px] leading-[21px]">
          <Info size={20} strokeWidth={1.8} aria-hidden="true" className="mt-px shrink-0 text-accent" />
          <span>Sit quietly for 5 minutes before you measure.</span>
        </div>

        <fieldset className="m-0 flex flex-col gap-2.5 rounded-card border border-border bg-surface p-4">
          <legend className="px-1.5 text-base font-semibold">Blood pressure</legend>
          <div className="flex items-start gap-2.5">
            <NumberField big label="Top number" labelClassName="text-sm font-normal text-ink-muted" className="flex-1"
              error={errors.systolic?.message} {...form.register('systolic')} />
            <span aria-hidden="true" className="pt-10 text-[26px] text-ink-muted">/</span>
            <NumberField big label="Bottom number" labelClassName="text-sm font-normal text-ink-muted" className="flex-1"
              error={errors.diastolic?.message} {...form.register('diastolic')} />
            <span className="pt-12 text-[15px] text-ink-muted">mmHg</span>
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-card border border-border bg-surface px-4 py-3.5">
            <NumberField density="patient" label="Pulse" labelClassName="text-base" suffix="bpm" error={errors.pulse?.message} {...form.register('pulse')} />
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-3.5">
            <NumberField density="patient" label="Oxygen" labelClassName="text-base" suffix="%" error={errors.spo2?.message} {...form.register('spo2')} />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5">
          <NumberField density="patient" label="Sugar" labelClassName="text-base" suffix="mg/dL" placeholder="Optional"
            error={errors.glucose?.message} {...form.register('glucose')} />
          <SegmentedTabs aria-label="When did you eat" size="lg" block value={meal}
            onChange={(m) => form.setValue('mealTiming', m)}
            options={[{ value: 'before', label: 'Before meal' }, { value: 'after', label: 'After meal' }]}
            className="[&_button]:h-11"
          />
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          <Button type="submit" size="lg" block loading={add.isPending} disabled={!me.data} className="h-14 text-lg">Save reading</Button>
          <span className="text-center text-sm text-ink-muted">Your care team sees this right away.</span>
        </div>
      </form>
    </div>
  );
}
