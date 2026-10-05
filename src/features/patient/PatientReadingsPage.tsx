import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, QueryState } from '@/components/ui/States';
import { useMyPatient, useReadings } from '@/data/queries/patients';
import { usePageTitle } from '@/lib/usePageTitle';
import { PatientTrendCard } from './PatientTrendCard';
import { ReadingHistoryTable } from './ReadingHistoryTable';

export default function PatientReadingsPage() {
  usePageTitle('My readings');
  const navigate = useNavigate();
  const me = useMyPatient();
  const readings = useReadings(me.data?.patient.id);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 font-display text-[28px] leading-9 font-semibold sm:text-[32px] sm:leading-10">My readings</h1>
          <p className="m-0 text-base text-ink-muted">Every reading you have sent, newest first.</p>
        </div>
        <Button size="lg" icon={<Plus size={20} strokeWidth={2} />} onClick={() => navigate('/patient/add-reading')}>Add reading</Button>
      </div>
      {me.data && readings.data && readings.data.length > 0 && (
        <PatientTrendCard readings={readings.data} thresholds={me.data.patient.thresholds} className="hidden md:block" />
      )}
      <Card padding="lg" className="print-area flex flex-col gap-3">
        <CardHeader title="Reading history" size="lg" right={<Button variant="secondary" className="print-hide text-[15px] font-medium" onClick={() => window.print()}>Download PDF</Button>} />
        <QueryState
          query={readings}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title="No readings yet" body="Your readings will show here after you add the first one." />}
        >
          {(data) => <ReadingHistoryTable readings={data} pageSize={10} />}
        </QueryState>
      </Card>
    </>
  );
}
