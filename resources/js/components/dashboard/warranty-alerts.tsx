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
                      : 'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-300',
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
            <div className="rounded-2xl border border-[#D5D9DC] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-semibold tracking-widest text-[#00875A] uppercase">
                            Garansi
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-[#1A1A1A] dark:text-white">
                            Status Garansi
                        </h3>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-[#00875A]/10">
                        <ShieldAlert className="size-6 text-[#00875A]" />
                    </div>
                    <p className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                        Semua garansi aktif
                    </p>
                    <p className="text-xs text-[#86888C]">
                        Tidak ada aset dengan garansi kedaluwarsa atau mendekati
                        batas waktu.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[#D5D9DC] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-[#B95000] uppercase">
                        Peringatan
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#1A1A1A] dark:text-white">
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
                        className="group flex items-center justify-between gap-3 rounded-lg border border-transparent p-3 transition-all duration-200 hover:border-[#D5D9DC] hover:bg-[#F7F8F9]/50 dark:hover:border-[#1e293b] dark:hover:bg-white/[0.02]"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#1A1A1A] group-hover:text-[#006FCF] dark:text-white dark:group-hover:text-[#3B9FE8]">
                                {asset.kode_asset ?? '—'}
                            </p>
                            <p className="truncate text-xs text-[#86888C]">
                                {asset.brand
                                    ? `${asset.brand} ${asset.model ?? ''}`
                                    : 'Tanpa nama'}
                            </p>
                            <p className="mt-1 text-[11px] text-[#86888C]">
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
