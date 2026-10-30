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
            <span className="inline-flex items-center gap-1 rounded-full bg-status-dsp-bg px-2 py-0.5 text-[10px] font-bold text-status-dsp-text ring-1 ring-status-dsp-border dark:text-status-dsp-text">
                <ShieldAlert className="size-3" />
                Kadaluarsa {Math.abs(days)} hari lalu
            </span>
        );
    }

    if (days === 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-rpr-bg px-2 py-0.5 text-[10px] font-bold text-status-rpr-text ring-1 ring-status-rpr-border dark:text-status-rpr-text">
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
                    ? 'bg-status-dsp-bg text-status-dsp-text ring-status-dsp-border dark:text-status-dsp-text'
                    : days <= 14
                      ? 'bg-status-rpr-bg text-status-rpr-text ring-status-rpr-border dark:text-status-rpr-text'
                      : 'bg-brand-subtle text-brand ring-brand/30 dark:text-brand',
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
                    <p className="text-[10px] font-semibold tracking-widest text-text-tertiary uppercase">
                        Garansi
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-text-primary">
                        Status Garansi
                    </h3>
                </div>
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-status-act-bg">
                        <ShieldAlert className="size-6 text-status-act-text" />
                    </div>
                    <p className="text-sm font-medium text-text-primary">
                        Semua garansi aktif
                    </p>
                    <p className="text-xs text-text-tertiary">
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
                    <p className="text-[10px] font-semibold tracking-widest text-text-tertiary uppercase">
                        Peringatan
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-text-primary">
                        Garansi Mendekati Batas Waktu
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {alerts.expired > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-status-dsp-bg px-2 py-1 text-[11px] font-semibold text-status-dsp-text ring-1 ring-status-dsp-border dark:text-status-dsp-text">
                            <AlertTriangle className="size-3" />
                            {alerts.expired} kadaluarsa
                        </span>
                    )}
                    {alerts.expiring_soon > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-status-rpr-bg px-2 py-1 text-[11px] font-semibold text-status-rpr-text ring-1 ring-status-rpr-border dark:text-status-rpr-text">
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
                        className="group flex items-center justify-between gap-3 rounded-lg border border-transparent p-3 transition-all duration-200 hover:border-border-subtle hover:bg-brand-subtle"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-text-primary group-hover:text-brand">
                                {asset.kode_asset ?? '—'}
                            </p>
                            <p className="truncate text-xs text-text-tertiary">
                                {asset.brand
                                    ? `${asset.brand} ${asset.model ?? ''}`
                                    : 'Tanpa nama'}
                            </p>
                            <p className="mt-1 text-[11px] text-text-tertiary">
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
