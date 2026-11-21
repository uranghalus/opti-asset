import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Columns3, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ASSET_REPORT_COLUMNS, LOCAL_STORAGE_KEY, ASSET_REPORT_COLUMN_KEYS } from '@/lib/asset-report-columns.tsx';

type Props = {
  columns: string[];
  onChange: (cols: string[]) => void;
};

export function AssetReportColumnPicker({ columns, onChange }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, typeof ASSET_REPORT_COLUMNS>();
    for (const col of ASSET_REPORT_COLUMNS) {
      if (!map.has(col.group)) map.set(col.group, []);
      map.get(col.group)!.push(col);
    }
    return Array.from(map.entries());
  }, []);

  const activeCount = columns.length;

  const toggle = (key: string) => {
    const isActive = columns.includes(key);
    let next: string[];
    if (isActive) {
      next = columns.filter(k => k !== key);
      if (next.length === 0) return;
    } else {
      next = [...columns, key];
    }
    // preserve canonical order
    next = ASSET_REPORT_COLUMN_KEYS.filter(k => next.includes(k));
    onChange(next);
  };

  const selectAll = () => {
    onChange([...ASSET_REPORT_COLUMN_KEYS]);
  };

  const reset = () => {
    onChange([...ASSET_REPORT_COLUMN_KEYS]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <Columns3 className="size-4" />
          Kolom
          <span className="ml-1 hidden sm:inline-flex rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">{activeCount}</span>
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px]">
        <DropdownMenuLabel>Pilih kolom</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); selectAll(); }}>
          Pilih semua
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); reset(); }}>
          Reset
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {groups.map(([group, cols]) => (
          <div key={group}>
            <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">{group}</DropdownMenuLabel>
            {cols.map(col => {
              const active = columns.includes(col.key);
              return (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={active}
                  onCheckedChange={() => toggle(col.key)}
                  disabled={activeCount === 1 && active}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
