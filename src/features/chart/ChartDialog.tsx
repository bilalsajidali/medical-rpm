import { Dialog } from '@/components/ui/Dialog';
import { usePatient } from '@/data/queries/patients';
import { patientName } from '@/lib/format';
import { PatientChart } from './PatientChartPage';

/** Patient chart in a large popup, so lists and the dashboard never leave the page. */
export function ChartDialog({ patientId, onClose }: { patientId: string | null; onClose: () => void }) {
  const summary = usePatient(patientId ?? undefined);
  return (
    <Dialog
      open={patientId !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={summary.data ? patientName(summary.data.patient) : 'Patient chart'}
      size="xl"
      hideTitle
    >
      {patientId && <PatientChart key={patientId} patientId={patientId} embedded />}
    </Dialog>
  );
}
