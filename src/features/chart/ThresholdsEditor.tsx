import type { Range, Thresholds, VitalKey } from '@/data/types';
import { VITAL_LABEL, VITAL_UNIT } from '@/lib/format';
import { VITAL_KEYS } from '@/lib/rules/status';

const COLS: { key: keyof Range; label: string; tone: string }[] = [
  { key: 'minCritical', label: 'Critical below', tone: 'text-critical-ink' },
  { key: 'minAtRisk', label: 'At-risk below', tone: 'text-atrisk-ink' },
  { key: 'maxAtRisk', label: 'At-risk above', tone: 'text-atrisk-ink' },
  { key: 'maxCritical', label: 'Critical above', tone: 'text-critical-ink' },
];

export type ThresholdDraft = Record<VitalKey, Record<keyof Range, string>>;

export function toDraft(t: Thresholds): ThresholdDraft {
  return Object.fromEntries(VITAL_KEYS.map((k) => [k, Object.fromEntries(COLS.map((c) => [c.key, String(t[k][c.key])]))])) as ThresholdDraft;
}

/** Validates order minCritical < minAtRisk < maxAtRisk < maxCritical for every vital. */
export function fromDraft(d: ThresholdDraft): { thresholds: Thresholds } | { error: string } {
  const out = {} as Thresholds;
  for (const k of VITAL_KEYS) {
    const r = Object.fromEntries(COLS.map((c) => [c.key, Number(d[k][c.key])])) as unknown as Range;
    if (COLS.some((c) => d[k][c.key].trim() === '' || !Number.isFinite(r[c.key]))) return { error: `${VITAL_LABEL[k]}: every limit needs a number.` };
    if (!(r.minCritical < r.minAtRisk && r.minAtRisk < r.maxAtRisk && r.maxAtRisk < r.maxCritical)) {
      return { error: `${VITAL_LABEL[k]}: limits must go up from left to right.` };
    }
    out[k] = r;
  }
  return { thresholds: out };
}

/** Thresholds table; editable inputs when `onChange` is given. */
export function ThresholdsEditor({ draft, onChange }: { draft: ThresholdDraft; onChange?: (d: ThresholdDraft) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm tabular">
        <thead>
          <tr className="text-left">
            <th scope="col" className="border-b border-border px-3 py-2.5 text-xs font-medium text-ink-muted">Vital</th>
            {COLS.map((c) => <th key={c.key} scope="col" className={`border-b border-border px-3 py-2.5 text-xs font-medium ${c.tone}`}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {VITAL_KEYS.map((k) => (
            <tr key={k}>
              <th scope="row" className="border-b border-divider px-3 py-3 text-left font-semibold">
                {VITAL_LABEL[k]} <span className="font-normal text-ink-muted">({VITAL_UNIT[k]})</span>
              </th>
              {COLS.map((c) => (
                <td key={c.key} className="border-b border-divider px-3 py-2">
                  {onChange ? (
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label={`${VITAL_LABEL[k]} ${c.label}`}
                      value={draft[k][c.key]}
                      onChange={(e) => onChange({ ...draft, [k]: { ...draft[k], [c.key]: e.target.value } })}
                      className="h-9 w-24 rounded-full border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  ) : draft[k][c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
