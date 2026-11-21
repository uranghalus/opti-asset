import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { ASSET_REPORT_COLUMNS, AssetRow } from '@/lib/asset-report-columns.tsx';
import { Button } from '@/components/ui/button';

type Props = {
  assets: AssetRow[];
  columns: string[];
  sort: { column: string; direction: 'asc' | 'desc' };
  onSort: (column: string) => void;
};

export function AssetReportTable({ assets, columns, sort, onSort }: Props) {
  const visibleCols = useMemo(() => {
    return ASSET_REPORT_COLUMNS.filter(c => columns.includes(c.key));
  }, [columns]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleCols.map(col => (
              <TableHead key={col.key} className="whitespace-nowrap">
                {col.sortable ? (
                  <Button variant="ghost" size="sm" onClick={() => onSort(col.key)} className="h-auto p-0 font-medium">
                    {col.label}
                    <ArrowUpDown className="ml-1 size-3" />
                  </Button>
                ) : (
                  col.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleCols.length} className="text-center py-8 text-muted-foreground">
                Tidak ada aset yang cocok dengan filter.
              </TableCell>
            </TableRow>
          ) : (
            assets.map(asset => (
              <TableRow key={asset.id}>
                {visibleCols.map(col => (
                  <TableCell key={col.key} className={cn(col.mono && 'font-mono tabular-nums', col.align === 'right' && 'text-right')}>
                    {col.render(asset)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
