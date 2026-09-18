import { Link } from '@inertiajs/react';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type WarrantyAsset = {
    id: string;
    kode_asset: string | null;
    brand: string | null;
    model: string | null;
    warranty_expire: string;
    days_until: number;
};

type WarrantyAlerts = {
    expired: number;
    expiring_soon: number;
    expiring_30: number;
    assets: WarrantyAsset[];
};

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function DaysBadge({ days }: { days: number }) {
    if (days < 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-300">
                <ShieldAlert className="size-3" />
                Kadaluarsa {Math.abs(days)} hari lalu
            </span>
        );
    }

    if (days === 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-300">
                <Clock className="size-3" />
                Berakhir hari ini
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1',
                days <= 7
                    ? 'bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-300'
                    : days <= 14
                      ? 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-300'
                      : 'bg-[#5EEAD4]/10 text-teal-700 ring-[#5EEAD4]/30 dark:text-teal-300',
            )}
        >
            <Clock className="size-3" />
            {days} hari lagi
        </span>
    );
}

export function WarrantyAlerts({ alerts }: { alerts: WarrantyAlerts }) {
    if (alerts.expired === 0 && alerts.expiring_soon === 0) {
        return (
            <div className="flex flex-col gap-4">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-[#0D9488] uppercase">
                        Garansi
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                        Status Garansi
                    </h3>
                </div>
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-[#5EEAD4]/10">
                        <ShieldAlert className="size-6 text-[#5EEAD4]" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                        Semua garansi aktif
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Tidak ada aset dengan garansi kedaluwarsa atau mendekati
                        batas waktu.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-[#D97706] uppercase">
                        Peringatan
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                        Garansi Mendekati Batas Waktu
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {alerts.expired > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-300">
                            <AlertTriangle className="size-3" />
                            {alerts.expired} kadaluarsa
                        </span>
                    )}
                    {alerts.expiring_soon > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-300">
                            <Clock className="size-3" />
                            {alerts.expiring_soon} segera berakhir
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {alerts.assets.map((asset) => (
                    <Link
                        key={asset.id}
                        href={`/assets/${asset.id}`}
                        className="group flex items-center justify-between gap-3 rounded-lg border border-transparent p-3 transition-all duration-200 hover:border-border hover:bg-accent/50"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                                {asset.kode_asset ?? '—'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {asset.brand
                                    ? `${asset.brand} ${asset.model ?? ''}`
                                    : 'Tanpa nama'}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Berakhir: {formatDate(asset.warranty_expire)}
                            </p>
                        </div>
                        <DaysBadge days={asset.days_until} />
                    </Link>
                ))}
            </div>
        </div>
    );
}
