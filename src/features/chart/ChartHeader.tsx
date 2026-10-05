import { Phone } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import type { PatientSummary } from '@/data/api/patients';
import { ageOf, DEVICE_LABEL, formatDate, formatDob, nameWithCredential, patientName, PREFERRED_CONTACT } from '@/lib/format';

export function ChartHeader({ summary, isDoctor, onEditThresholds, onAddNote, onCall }: {
  summary: PatientSummary; isDoctor: boolean;
  onEditThresholds: () => void; onAddNote: () => void; onCall?: () => void;
}) {
  const p = summary.patient;
  const devices = p.devices.map((d) => DEVICE_LABEL[d]).join(', ');
  const tel = `tel:${p.phone.replace(/[^\d+]/g, '')}`;
  const info = [
    ['Phone', `${p.phone} · Mobile`],
    ['Preferred contact', `${PREFERRED_CONTACT[p.preferredContact]}, weekdays 8 AM–5 PM`],
    ['Doctor · Nurse', `${summary.doctor ? nameWithCredential(summary.doctor) : '—'} · ${summary.nurse ? nameWithCredential(summary.nurse) : '—'}`],
    ['Enrolled', `${formatDate(p.enrolledAt)} · ${p.consentSignedAt ? 'Consent signed' : 'Consent missing'}`],
    ['Devices', devices.charAt(0).toUpperCase() + devices.slice(1)],
  ];
  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar firstName={p.firstName} lastName={p.lastName} size={64} />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="m-0 font-display text-[28px] leading-[34px] font-semibold">{patientName(p)}</h1>
              <StatusPill status={summary.status} />
              <Badge variant={p.rpmStatus === 'active' ? 'accent' : 'neutral'}>RPM {p.rpmStatus === 'active' ? 'Active' : p.rpmStatus === 'paused' ? 'Paused' : 'Discharged'}</Badge>
            </div>
            <span className="text-sm text-ink-muted tabular">{p.sex} · {ageOf(p.dob)} years · DOB {formatDob(p.dob)} · MRN {p.mrn}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {isDoctor && <Button variant="secondary" onClick={onEditThresholds}>Edit thresholds</Button>}
          <Button variant="secondary" onClick={onAddNote}>Add note</Button>
          {onCall
            ? <Button icon={<Phone size={16} strokeWidth={1.8} />} onClick={onCall}>Call patient</Button>
            : <a href={tel} className={buttonClasses('primary', 'md')}><Phone size={16} strokeWidth={1.8} aria-hidden="true" />Call patient</a>}
        </div>
      </div>
      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 border-t border-divider pt-4">
        {info.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1">
            <dt className="text-xs text-ink-muted">{k}</dt>
            <dd className="m-0 text-sm font-medium tabular">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
