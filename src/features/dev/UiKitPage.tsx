import { Bell, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusPill } from '@/components/ui/StatusPill';
import { PillTabs } from '@/components/ui/TopNav';
import { VitalCard } from '@/components/ui/VitalCard';
import { usePageTitle } from '@/lib/usePageTitle';
import { Brand } from '@/layouts/Brand';

const SWATCHES = [
  { name: 'Background', cls: 'bg-bg', hex: '#F3F5F9', usage: 'Page background' },
  { name: 'Card', cls: 'bg-surface', hex: '#FFFFFF', usage: 'All cards and panels' },
  { name: 'Border', cls: 'bg-border', hex: '#E6E9EF', usage: '1px card borders, dividers' },
  { name: 'Primary', cls: 'bg-ink', hex: '#0F172A', usage: 'Main buttons, active nav pill' },
  { name: 'Accent', cls: 'bg-accent', hex: '#2563EB', usage: 'Links, active tabs, chart lines' },
  { name: 'Text', cls: 'bg-ink', hex: '#0F172A', usage: 'Headings and body' },
  { name: 'Text muted', cls: 'bg-ink-muted', hex: '#5B6474', usage: 'Labels and captions' },
];
const STATUSES = [
  { s: 'critical' as const, bg: 'bg-critical-bg', ink: 'text-critical-ink', hex: '#DC2626', usage: 'Outside critical threshold. Goes to the top of the nurse queue.' },
  { s: 'atrisk' as const, bg: 'bg-atrisk-bg', ink: 'text-atrisk-ink', hex: '#F59E0B', usage: 'Outside at-risk threshold. Review the same day.' },
  { s: 'normal' as const, bg: 'bg-normal-bg', ink: 'text-normal-ink', hex: '#16A34A', usage: 'Within the patient’s thresholds. No action needed.' },
];
const TYPE = [
  ['Display · Jakarta 600 · 40/48', <span key="t1" className="font-display text-[40px] leading-[48px] font-semibold tracking-[-0.02em]">Good morning, Dr. Patel</span>],
  ['Vital number · Jakarta 500 · 48/52', <span key="t2" className="font-display text-[48px] leading-[52px] font-medium tabular">128/84 <span className="text-lg text-ink-muted">mmHg</span></span>],
  ['Heading · Jakarta 600 · 22/28', <span key="t3" className="font-display text-[22px] leading-7 font-semibold">Blood pressure · last 30 days</span>],
  ['Subheading · Jakarta 600 · 16/24', <span key="t4" className="font-display text-base font-semibold">Needs review</span>],
  ['Body · Inter 400 · 16/24', <span key="t5" className="text-base">Nurse called the patient and left a voicemail. Reading escalated to the clinic.</span>],
  ['Table · Inter 400 · 14/20', <span key="t6" className="text-sm tabular">09/30/2026 · 2:43 PM · 82/48 mmHg · Pulse 79</span>],
  ['Caption · Inter 500 · 12/16', <span key="t7" className="text-xs font-medium text-ink-muted">Last reading 18 min ago</span>],
] as const;

/** Dev-only: the design system page (Main.dc.html) rebuilt from the UI kit. */
export default function UiKitPage() {
  usePageTitle('Design system');
  const [nav, setNav] = useState('dashboard');
  const [q, setQ] = useState('');
  return (
    <div className="min-h-dvh bg-bg px-4 py-10 sm:px-16 sm:py-16">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <Brand />
            <h1 className="m-0 font-display text-5xl leading-[56px] font-semibold tracking-[-0.02em]">Design System</h1>
            <p className="m-0 max-w-[720px] text-base text-ink-muted">One look for every portal: Patient, Nurse / Call Center, Doctor, Clinic Admin and Super Admin. Same colors, fonts and shapes everywhere; only the layout density changes.</p>
          </div>
          <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-muted">v0.1 · Draft</span>
        </div>

        <Card padding="none" className="flex flex-col gap-6 p-8">
          <CardHeader title="Color" size="lg" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {SWATCHES.map((s) => (
              <div key={s.name} className="flex flex-col gap-2.5">
                <div className={`h-24 rounded-inner border border-border ${s.cls}`} />
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="text-[13px] text-ink-muted tabular">{s.hex}</span>
                <span className="text-xs leading-[17px] text-ink-muted">{s.usage}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-border" />
          <div className="flex flex-wrap items-center gap-2.5"><h3 className="m-0 text-[15px] font-semibold">Status colors</h3><span className="text-[13px] text-ink-muted">Reserved for patient readings only. Never used for buttons, charts or decoration.</span></div>
          <div className="grid gap-4 md:grid-cols-3">
            {STATUSES.map((s) => (
              <div key={s.s} className={`flex flex-col gap-3 rounded-inner p-5 ${s.bg}`}>
                <div className="flex items-center justify-between"><StatusPill status={s.s} size="lg" onTint /><span className={`text-[13px] font-semibold tabular ${s.ink}`}>{s.hex}</span></div>
                <span className={`text-[13px] leading-[19px] ${s.ink}`}>{s.usage}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="none" className="flex flex-col gap-5 p-8">
          <CardHeader title="Typography" size="lg" right={<span className="text-[13px] text-ink-muted">Plus Jakarta Sans for headings and big numbers · Inter for tables and body text</span>} />
          <div className="grid grid-cols-1 items-baseline gap-x-6 gap-y-[18px] md:grid-cols-[200px_minmax(0,1fr)]">
            {TYPE.map(([label, sample]) => <div key={label} className="contents"><span className="text-xs text-ink-muted">{label}</span>{sample}</div>)}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card padding="none" className="flex flex-col gap-5 p-8">
            <CardHeader title="Buttons" size="lg" />
            <div className="flex flex-wrap items-center gap-3">
              <Button className="px-[22px] text-[15px]">Primary</Button>
              <Button variant="accent" className="px-[22px] text-[15px]">Accent</Button>
              <Button variant="secondary" className="px-[22px] text-[15px]">Secondary</Button>
              <Button variant="ghost" className="text-[15px] underline">Text</Button>
              <IconButton aria-label="Notifications" className="border-border-strong" icon={<Bell size={18} strokeWidth={1.8} />} />
            </div>
            <p className="m-0 text-[13px] leading-[19px] text-ink-muted">Black is the main action. Accent is for links, active tabs and chart lines. Height 44px on desktop, 52px in the patient app.</p>
            <div className="h-px bg-border" />
            <h3 className="m-0 text-[15px] font-semibold">Top pill navigation</h3>
            <PillTabs aria-label="Example navigation" value={nav} onChange={setNav} className="self-start"
              items={[{ value: 'dashboard', label: 'Dashboard' }, { value: 'patients', label: 'Patients' }, { value: 'alerts', label: 'Alerts' }, { value: 'reports', label: 'Reports' }]} />
          </Card>
          <Card padding="none" className="flex flex-col gap-5 p-8">
            <CardHeader title="Inputs and status pills" size="lg" />
            <div className="flex flex-wrap gap-3">
              <SearchInput value={q} onChange={setQ} placeholder="Search patients" className="grow" />
              <Button variant="secondary" className="font-medium" icon={undefined}>This month <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" /></Button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <StatusPill status="critical" size="lg" /><StatusPill status="atrisk" size="lg" /><StatusPill status="normal" size="lg" />
              <StatusPill status="missed" size="lg" label="No reading 2 days" />
            </div>
            <p className="m-0 text-[13px] leading-[19px] text-ink-muted">Status always shows a dot and a word, never color alone.</p>
            <div className="h-px bg-border" />
            <h3 className="m-0 text-[15px] font-semibold">Vital card</h3>
            <div className="flex flex-wrap gap-4">
              <VitalCard className="flex-1" label="Blood pressure" value="128/84" unit="mmHg" status="normal" timestamp="Today, 8:02 AM" spark={[25, 16, 21, 9, 19, 23, 21].map((y) => 36 - y)} />
              <VitalCard className="flex-1" label="Glucose" value="182" unit="mg/dL" status="atrisk" timestamp="Today, 7:48 AM" />
            </div>
            <div className="flex flex-wrap gap-2"><Badge variant="success">Active</Badge><Badge variant="neutral">Invited</Badge><Badge variant="accent">Ready</Badge></div>
          </Card>
        </div>

        <Card padding="none" className="grid gap-8 p-8 md:grid-cols-3">
          <div className="flex flex-col gap-3.5">
            <CardHeader title="Shape" size="lg" />
            <div className="flex items-end gap-3.5">
              {[['Card 20', 'h-14 w-[72px] rounded-card'], ['Inner 14', 'h-14 w-[72px] rounded-inner'], ['Pill 999', 'h-10 w-24 rounded-full']].map(([l, c]) => (
                <div key={l} className="flex flex-col items-center gap-1.5"><div className={`border border-border-strong bg-bg ${c}`} /><span className="text-xs text-ink-muted">{l}</span></div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <CardHeader title="Spacing" size="lg" />
            <div className="flex items-end gap-3">
              {[4, 8, 12, 16, 24, 32].map((n) => (
                <div key={n} className="flex flex-col items-center gap-1.5"><div className="rounded bg-accent" style={{ width: n, height: n }} /><span className="text-xs text-ink-muted">{n}</span></div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <CardHeader title="Density per portal" size="lg" />
            {[['Patient', 'Low · top nav · 16px min text'], ['Doctor', 'Medium · top nav'], ['Nurse / Call center', 'High · sidebar'], ['Clinic & Super Admin', 'Med-high · sidebar']].map(([a, b]) => (
              <div key={a} className="flex justify-between border-b border-border py-1.5 text-sm last:border-0"><span>{a}</span><span className="text-ink-muted">{b}</span></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
