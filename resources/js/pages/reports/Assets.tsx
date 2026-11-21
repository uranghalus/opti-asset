import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AssetReportSummary } from '@/pages/reports/components/asset-report-summary';
import { AssetReportFilterPanel } from '@/pages/reports/components/asset-report-filter-panel';
import { AssetReportColumnPicker } from '@/pages/reports/components/asset-report-column-picker';
import { AssetReportTable } from '@/pages/reports/components/asset-report-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import { ASSET_REPORT_COLUMN_KEYS, LOCAL_STORAGE_KEY } from '@/lib/asset-report-columns.tsx';
import { index as assetReportIndex, exportMethod as assetReportExport } from '@/routes/tenant/reports/assets';

type Props = {
  assets: {
    data: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: Record<string, string | string[] | null>;
  summary: { total_assets: number; total_purchase_price: string; total_acquisition_cost: string };
  sort: { column: string; direction: 'asc' | 'desc' };
  items: { id: string; code: string; name: string }[];
  locations: { id: string; name: string }[];
  departments: { id_department: string; nama_department: string }[];
  employees: { id_employee: string; nama_employee: string }[];
};

export default function AssetsReport() {
  const page = usePage<Props & { tenant: string }>();
  const { assets, filters, summary, sort, items, locations, departments, employees, tenant } = page.props;

  const [filterState, setFilterState] = useState<Record<string, any>>(filters);
  const [columns, setColumns] = useState<string[]>(ASSET_REPORT_COLUMN_KEYS);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const valid = Array.isArray(parsed) ? parsed.filter((k: string) => ASSET_REPORT_COLUMN_KEYS.includes(k)) : [];
          if (valid.length > 0) setColumns(valid.length ? valid : ASSET_REPORT_COLUMN_KEYS);
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(columns));
    }
  }, [columns]);

  useEffect(() => {
    setFilterState(filters);
  }, [filters]);

  const applyFilters = () => {
    const params: Record<string, any> = {};
    Object.entries(filterState).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) return;
      if (Array.isArray(v) && v.length === 0) return;
      params[k] = v;
    });
    router.get(assetReportIndex({ tenant }).url, params, {
      preserveState: true,
      preserveScroll: true,
      only: ['assets', 'filters', 'summary'],
    });
  };

  const exportFile = (format: 'xlsx' | 'pdf' | 'print') => {
    if (format === 'print') {
      window.print();
      return;
    }
    const params = { ...filters, format, columns };
    const url = assetReportExport({ tenant }, { query: params }).url;
    window.location.assign(url);
  };

  const onSort = (column: string) => {
    const direction = sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc';
    router.get(assetReportIndex({ tenant }).url, { ...filters, sort: column, direction, page: 1 }, {
      preserveState: true,
      preserveScroll: true,
      only: ['assets', 'filters', 'summary'],
    });
  };

  return (
    <>
      <Head title="Laporan Daftar Aset" />
      <div className="mx-auto max-w-[1400px] p-6" data-print-scope="asset-report">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Laporan Daftar Aset</h1>
            <p className="text-sm text-muted-foreground">Filter dan ekspor daftar aset</p>
          </div>
          <div className="flex items-center gap-2">
            <AssetReportColumnPicker columns={columns} onChange={setColumns} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><FileDown className="mr-2 size-4" />Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => exportFile('xlsx')}><FileSpreadsheet className="mr-2 size-4" />Unduh XLSX</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportFile('pdf')}>Unduh PDF</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportFile('print')}><Printer className="mr-2 size-4" />Cetak</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <AssetReportSummary totalAssets={summary.total_assets} totalPurchasePrice={summary.total_purchase_price} totalAcquisitionCost={summary.total_acquisition_cost} />

        <div className="my-6">
          <AssetReportFilterPanel filterState={filterState} onChange={(k,v)=> setFilterState(s=> ({...s, [k]: v}))} onApply={applyFilters} onReset={()=> { setFilterState({}); applyFilters(); }} items={items} locations={locations} departments={departments} employees={employees} />
        </div>

        <div className="rounded-lg border bg-card">
          <AssetReportTable assets={assets.data} columns={columns} sort={sort} onSort={onSort} />
        </div>
      </div>
    </>
  );
}
