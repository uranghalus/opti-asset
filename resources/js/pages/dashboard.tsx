import { Head, usePage } from '@inertiajs/react';
import { CalendarDays, Download } from 'lucide-react';
import { useState } from 'react';
import { ChartOverview } from '@/components/dashboard/chart-overview';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { StatusDonut } from '@/components/dashboard/status-donut';
import { WarrantyAlerts } from '@/components/dashboard/warranty-alerts';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

type AssetByStatus = {
    ACT: number;
    LOAN: number;
    RPR: number;
    MUT: number;
    DSP: number;
};

type Stats = {
    total_assets: number;
    asset_by_status: AssetByStatus;
    pending_transfers: number;
};

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

type RecentAsset = {
    id: string;
    item_id: string | null;
    kode_asset: string | null;
    brand: string | null;
    model: string | null;
    status: string;
    created_at: string;
    item?: { id: string; name: string } | null;
};

type PageProps = {
    stats: Stats;
    warranty_alerts: WarrantyAlerts;
    recent_assets: RecentAsset[];
};

function GreetingHeader() {
    const { auth } = usePage().props;
    const name = auth?.user?.name?.split(' ')[0] ?? 'User';

    const [greeting] = useState(() => {
        const hour = new Date().getHours();

        return hour < 12
            ? 'Selamat pagi'
            : hour < 18
              ? 'Selamat siang'
              : 'Selamat malam';
    });

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002A6E] via-[#00175A] to-[#000C3D] p-6 shadow-lg shadow-[#00175A]/20 sm:p-7">
            <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-[#006FCF]/25 blur-3xl" />
            <div className="pointer-events-none absolute top-8 right-32 size-32 rounded-full bg-[#3B9FE8]/10 blur-2xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-[#8FB4E8] uppercase">
                        {greeting}
                    </p>
                    <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-[28px]">
                        Halo, {name}
                    </h1>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-[#B7C3D9]">
                        Berikut ringkasan portofolio aset perusahaan hari ini.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 rounded-lg border-white/15 bg-white/[0.06] px-3 text-[13px] font-medium text-white backdrop-blur-sm hover:bg-white/[0.12] hover:text-white"
                    >
                        <CalendarDays className="h-4 w-4 text-[#8FB4E8]" />
                        {new Date().toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold text-[#00175A] shadow-sm hover:bg-white/90"
                    >
                        <Download className="h-4 w-4" />
                        Ekspor
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { stats, warranty_alerts } = usePage()
        .props as unknown as PageProps;

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <GreetingHeader />

                <KpiCards stats={stats} />

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <ChartOverview />
                    </div>
                    <div>
                        <StatusDonut stats={stats} />
                    </div>
                </div>

                <WarrantyAlerts alerts={warranty_alerts} />
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
