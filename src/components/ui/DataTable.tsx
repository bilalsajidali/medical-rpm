import {
  flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { focusRing } from './Button';
import { IconButton } from './IconButton';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    align?: 'left' | 'right';
    className?: string;
  }
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  pageSize?: number;
  /** "patients", "entries" … for "Showing 1–10 of 40 patients" */
  noun?: string;
  minWidth?: number;
  onRowClick?: (row: T) => void;
  rowLabel?: (row: T) => string;
  selectedId?: string | null;
  rowClassName?: (row: T) => string | undefined;
  initialSorting?: SortingState;
  empty?: ReactNode;
  /** bigger text for patient screens */
  density?: 'staff' | 'patient';
  /** reset to page 1 when this changes (filters) */
  resetKey?: string;
}

export function DataTable<T>({
  data, columns, getRowId, pageSize, noun = 'rows', minWidth = 640, onRowClick, rowLabel, selectedId,
  rowClassName, initialSorting = [], empty, density = 'staff', resetKey,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: pageSize ?? 10_000 });
  // reset to the first page when filters change
  useEffect(() => setPagination((p) => ({ ...p, pageIndex: 0 })), [resetKey]);

  const table = useReactTable({
    data, columns, getRowId, state: { sorting, pagination },
    onSortingChange: setSorting, onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: pageSize ? getPaginationRowModel() : undefined,
    manualPagination: !pageSize,
    autoResetPageIndex: false,
  });

  const total = data.length;
  const rows = table.getRowModel().rows;
  const start = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const end = Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize);
  const pageCount = table.getPageCount();
  const patient = density === 'patient';

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className={cn('w-full border-collapse tabular', patient ? 'text-base' : 'text-sm')} style={{ minWidth }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="text-left">
                {hg.headers.map((h) => {
                  const sortable = h.column.getCanSort();
                  const dir = h.column.getIsSorted();
                  const align = h.column.columnDef.meta?.align;
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined}
                      className={cn(
                        'border-b border-border px-3 py-2.5 font-medium whitespace-nowrap text-ink-muted',
                        patient ? 'text-sm' : 'text-xs', align === 'right' && 'text-right',
                      )}
                    >
                      {h.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className={cn('inline-flex items-center gap-1 rounded-full font-medium hover:text-ink', focusRing)}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {dir === 'asc' && <ArrowUp size={12} aria-hidden="true" />}
                          {dir === 'desc' && <ArrowDown size={12} aria-hidden="true" />}
                        </button>
                      ) : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = selectedId === row.id;
              return (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={onRowClick ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row.original); }
                  } : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick && rowLabel ? rowLabel(row.original) : undefined}
                  aria-selected={onRowClick ? selected : undefined}
                  className={cn(
                    onRowClick && 'cursor-pointer outline-none hover:bg-subtle focus-visible:bg-accent/8 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
                    selected && 'bg-accent/8 hover:bg-accent/8',
                    rowClassName?.(row.original),
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'border-b border-divider px-3 py-3 align-middle',
                        cell.column.columnDef.meta?.align === 'right' && 'text-right',
                        cell.column.columnDef.meta?.className,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {total === 0 && (empty ?? <p className="py-8 text-center text-sm text-ink-muted">Nothing to show.</p>)}
      </div>

      {pageSize && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-ink-muted">Showing {start}–{end} of {total} {noun}</span>
          {pageCount > 1 && (
            <div className="flex gap-1.5">
              <IconButton size={36} aria-label="Previous page" icon={<ChevronLeft size={16} />} disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} />
              {Array.from({ length: pageCount }, (_, i) => i)
                .filter((i) => i < 3 || i === pageCount - 1 || Math.abs(i - pagination.pageIndex) <= 1)
                .map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Page ${i + 1}`}
                    aria-current={i === pagination.pageIndex ? 'page' : undefined}
                    onClick={() => table.setPageIndex(i)}
                    className={cn(
                      'h-9 min-w-9 rounded-full px-2.5 text-[13px] tabular', focusRing,
                      i === pagination.pageIndex ? 'bg-ink font-semibold text-surface' : 'border border-border-strong bg-surface text-ink hover:bg-subtle',
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              <IconButton size={36} aria-label="Next page" icon={<ChevronRight size={16} />} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
