import { ReactNode } from 'react';
import { StatusBadge } from '@/lib/asset-status';
import { TipeBadge } from '@/lib/asset-status';
import { cn } from '@/lib/utils';

export type AssetRow = {
  id: string;
  kode_asset: string | null;
  item: { code: string | null; name: string } | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  part_number: string | null;
  purchase_date: string | null;
  purchase_price: string | null;
  vendor_name: string | null;
  location: { name: string } | null;
  department: { nama_department: string } | null;
  asset_type: 'fixed_asset' | 'equipment' | null;
  acquisition_cost: string | null;
  useful_life_years: number | null;
  depreciation_method: string | null;
  accumulated_depreciation: string | null;
  in_come_date: string | null;
  warranty_expire: string | null;
  garansi_exp: string | null;
  broken_date: string | null;
  status: string;
  condition: string | null;
  no_spb: string | null;
  document_number: string | null;
  pic: string[] | null;
  photo_url: string[] | null;
  document_url: string[] | null;
  notes: string | null;
};

export type AssetReportColumn = {
  key: string;
  label: string;
  group: string;
  align?: 'left' | 'right';
  mono?: boolean;
  sortable?: boolean;
  render: (asset: AssetRow) => ReactNode;
};

const fmtDate = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID');
};

const fmtCurrency = (v: string | null) => {
  if (!v) return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
};

const depLabel: Record<string, string> = {
  straight_line: 'Garisan Lurus',
  declining_balance: 'Saldo Menurun',
  none: 'Tidak Disusutkan',
};

export const ASSET_REPORT_COLUMNS: AssetReportColumn[] = [
  // Item Aset
  {
    key: 'kode_asset',
    label: 'Kode Aset',
    group: 'Item Aset',
    align: 'left',
    mono: true,
    sortable: true,
    render: (a) => <span className="font-mono tabular-nums">{a.kode_asset ?? '—'}</span>,
  },
  {
    key: 'item',
    label: 'Item',
    group: 'Item Aset',
    render: (a) => {
      if (!a.item) return '—';
      const code = a.item.code ? `${a.item.code} - ` : '';
      return <span>{code}{a.item.name}</span>;
    },
  },
  // Informasi Produk
  {
    key: 'brand',
    label: 'Brand',
    group: 'Informasi Produk',
    sortable: true,
    render: (a) => a.brand ?? '—',
  },
  {
    key: 'model',
    label: 'Model',
    group: 'Informasi Produk',
    sortable: true,
    render: (a) => a.model ?? '—',
  },
  {
    key: 'serial_number',
    label: 'Serial Number',
    group: 'Informasi Produk',
    mono: true,
    sortable: true,
    render: (a) => <span className="font-mono">{a.serial_number ?? '—'}</span>,
  },
  {
    key: 'part_number',
    label: 'Part Number',
    group: 'Informasi Produk',
    mono: true,
    sortable: true,
    render: (a) => <span className="font-mono">{a.part_number ?? '—'}</span>,
  },
  // Foto & Dokumen
  {
    key: 'photo_url',
    label: 'Foto Aset',
    group: 'Foto & Dokumen',
    render: (a) => (a.photo_url && a.photo_url.length > 0 ? 'Ya' : 'Tidak'),
  },
  {
    key: 'document_url',
    label: 'Dokumen Pendukung',
    group: 'Foto & Dokumen',
    render: (a) => (a.document_url && a.document_url.length > 0 ? 'Ya' : 'Tidak'),
  },
  // Pembelian & Penempatan
  {
    key: 'purchase_date',
    label: 'Tanggal Pembelian',
    group: 'Pembelian & Penempatan',
    sortable: true,
    render: (a) => fmtDate(a.purchase_date),
  },
  {
    key: 'purchase_price',
    label: 'Harga Pembelian',
    group: 'Pembelian & Penempatan',
    align: 'right',
    mono: true,
    sortable: true,
    render: (a) => <span className="font-mono tabular-nums">{fmtCurrency(a.purchase_price)}</span>,
  },
  {
    key: 'vendor_name',
    label: 'Vendor',
    group: 'Pembelian & Penempatan',
    sortable: true,
    render: (a) => a.vendor_name ?? '—',
  },
  {
    key: 'location',
    label: 'Lokasi',
    group: 'Pembelian & Penempatan',
    render: (a) => a.location?.name ?? '—',
  },
  {
    key: 'department',
    label: 'Department',
    group: 'Pembelian & Penempatan',
    render: (a) => a.department?.nama_department ?? '—',
  },
  // Tipe Aset & Data Akuntansi
  {
    key: 'asset_type',
    label: 'Tipe Aset',
    group: 'Tipe Aset & Data Akuntansi',
    sortable: true,
    render: (a) => <TipeBadge value={a.asset_type} />,
  },
  {
    key: 'acquisition_cost',
    label: 'Nilai Perolehan',
    group: 'Tipe Aset & Data Akuntansi',
    align: 'right',
    mono: true,
    sortable: true,
    render: (a) => <span className="font-mono tabular-nums">{fmtCurrency(a.acquisition_cost)}</span>,
  },
  {
    key: 'useful_life_years',
    label: 'Masa Manfaat (Tahun)',
    group: 'Tipe Aset & Data Akuntansi',
    align: 'right',
    mono: true,
    sortable: true,
    render: (a) => (a.useful_life_years != null ? `${a.useful_life_years} thn` : '—'),
  },
  {
    key: 'depreciation_method',
    label: 'Metode Penyusutan',
    group: 'Tipe Aset & Data Akuntansi',
    sortable: true,
    render: (a) => depLabel[a.depreciation_method ?? ''] ?? a.depreciation_method ?? '—',
  },
  {
    key: 'accumulated_depreciation',
    label: 'Akumulasi Penyusutan',
    group: 'Tipe Aset & Data Akuntansi',
    align: 'right',
    mono: true,
    sortable: true,
    render: (a) => <span className="font-mono tabular-nums">{fmtCurrency(a.accumulated_depreciation)}</span>,
  },
  // Garansi & Siklus Hidup
  {
    key: 'in_come_date',
    label: 'Tanggal Masuk',
    group: 'Garansi & Siklus Hidup',
    sortable: true,
    render: (a) => fmtDate(a.in_come_date),
  },
  {
    key: 'warranty_expire',
    label: 'Masa Garansi (habis)',
    group: 'Garansi & Siklus Hidup',
    sortable: true,
    render: (a) => fmtDate(a.warranty_expire),
  },
  {
    key: 'garansi_exp',
    label: 'Garansi Vendor (habis)',
    group: 'Garansi & Siklus Hidup',
    sortable: true,
    render: (a) => fmtDate(a.garansi_exp),
  },
  {
    key: 'broken_date',
    label: 'Tanggal Rusak',
    group: 'Garansi & Siklus Hidup',
    sortable: true,
    render: (a) => fmtDate(a.broken_date),
  },
  // Status & Kondisi
  {
    key: 'status',
    label: 'Status',
    group: 'Status & Kondisi',
    sortable: true,
    render: (a) => <StatusBadge value={a.status} />,
  },
  {
    key: 'condition',
    label: 'Kondisi',
    group: 'Status & Kondisi',
    sortable: true,
    render: (a) => a.condition ?? '—',
  },
  // Dokumen & Penanggung Jawab
  {
    key: 'no_spb',
    label: 'No. SPB',
    group: 'Dokumen & Penanggung Jawab',
    sortable: true,
    render: (a) => a.no_spb ?? '—',
  },
  {
    key: 'document_number',
    label: 'Nomor Dokumen',
    group: 'Dokumen & Penanggung Jawab',
    sortable: true,
    render: (a) => a.document_number ?? '—',
  },
  {
    key: 'pic',
    label: 'PIC',
    group: 'Dokumen & Penanggung Jawab',
    render: (a) => {
      if (!a.pic || a.pic.length === 0) return '—';
      const txt = a.pic.join(', ');
      return <span title={txt} className="block max-w-[200px] truncate">{txt}</span>;
    },
  },
  // Catatan Tambahan
  {
    key: 'notes',
    label: 'Catatan',
    group: 'Catatan Tambahan',
    render: (a) => {
      if (!a.notes) return '—';
      return <span title={a.notes} className="block max-w-[320px] line-clamp-2">{a.notes}</span>;
    },
  },
];

export const ASSET_REPORT_COLUMN_KEYS = ASSET_REPORT_COLUMNS.map(c => c.key);

export const LOCAL_STORAGE_KEY = 'asset-report:columns:v1';
