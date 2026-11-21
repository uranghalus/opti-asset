import { ReactNode } from 'react';

type Props = {
  totalAssets: number;
  totalPurchasePrice: string;
  totalAcquisitionCost?: string;
};

const fmtCurrency = (v: string) => {
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
};

export function AssetReportSummary({ totalAssets, totalPurchasePrice, totalAcquisitionCost }: Props) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm text-muted-foreground">
      <span className="font-medium text-foreground tabular-nums">{totalAssets.toLocaleString('id-ID')} aset</span>
      <span>•</span>
      <span>Total nilai pembelian: <span className="font-mono tabular-nums text-foreground">{fmtCurrency(totalPurchasePrice)}</span></span>
      {totalAcquisitionCost && (
        <>
          <span>•</span>
          <span>Total nilai perolehan: <span className="font-mono tabular-nums text-foreground">{fmtCurrency(totalAcquisitionCost)}</span></span>
        </>
      )}
    </div>
  );
}
