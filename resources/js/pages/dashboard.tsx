import { Head, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    Building2,
    CalendarDays,
    Download,
    Inbox,
    Layers,
    MapPin,
    MoveRight,
    ShieldCheck,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { StatusDonut } from '@/components/dashboard/status-donut';
import { WarrantyAlerts } from '@/components/dashboard/warranty-alerts';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
    pending_disposals: number;
};

type ClassificationSlice = { name: string; count: number };
type AssetTypeSlice = {
    type: string;
    label: string;
    count: number;
    value: string;
    book_value: string;
};
type LocationSlice = { name: string; count: number };
type RecentTransfer = {
    id: string;
    asset_kode: string;
    from: string;
    to: string;
    status: string;
    date: string;
};
type RecentDisposal = {
    id: string;
    asset_kode: string;
    reason: string;
    status: string;
    date: string;
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

type PageProps = {
    stats: Stats;
    asset_by_classification: ClassificationSlice[];
    asset_by_type: AssetTypeSlice[];
    asset_by_location: LocationSlice[];
    recent_transfers: RecentTransfer[];
    recent_disposals: RecentDisposal[];
    integrity_score: number;
    warranty_alerts: WarrantyAlerts;
};

function GreetingHeader({ name, score }: { name: string; score: number }) {
    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? 'Selamat pagi'
            : hour < 18
              ? 'Selamat siang'
              : 'Selamat malam';
    const integrityGood = score >= 95;

    return (
        <section className="relative overflow-hidden rounded-xl border border-brand/30 bg-brand p-6 sm:p-8">
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-muted/90 uppercase">
                        {greeting}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Halo, {name}
                    </h1>
                    <p className="max-w-md text-sm leading-relaxed text-brand-muted/90">
                        Ringkasan portofolio aset hari ini. Skor kelengkapan
                        klasifikasi:{' '}
                        <span className="font-semibold text-white">
                            {score}%
                        </span>{' '}
                        (target 95%).
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <span
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1',
                                integrityGood
                                    ? 'bg-white/15 text-white ring-white/30'
                                    : 'bg-white/5 text-white ring-white/25',
                            )}
                        >
                            <ShieldCheck className="size-3" />
                            {integrityGood
                                ? 'Target Tercapai'
                                : 'Di Bawah Target'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20">
                            <TrendingUp className="size-3" />
                            Perbaruan real-time
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 gap-1.5 rounded-lg border-white/25 bg-white/10 px-3 text-[13px] font-medium text-white hover:bg-white/15 hover:text-white"
                    >
                        <CalendarDays className="h-4 w-4 text-white/80" />
                        {new Date().toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 gap-1.5 rounded-lg border-white bg-white px-3 text-[13px] font-semibold text-brand shadow-sm hover:bg-brand-muted"
                    >
                        <Download className="h-4 w-4" />
                        Ekspor
                    </Button>
                </div>
            </div>
        </section>
    );
}

function AssetTypeBreakdown({ slices }: { slices: AssetTypeSlice[] }) {
    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 2,
    });

    const total = slices.reduce((sum, s) => sum + s.count, 0);
    const COLORS: Record<string, string> = {
        fixed_asset: '#0d5c56',
        equipment: '#0e7490',
        unclassified: '#475569',
    };

    return (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slices.map((s) => {
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                const color = COLORS[s.type] ?? '#5a6a7a';

                return (
                    <li
                        key={s.type}
                        className="group relative overflow-hidden rounded-xl border border-border/60 bg-background/40 p-4 transition-colors duration-150 hover:border-primary/30"
                    >
                        <div
                            className="absolute inset-x-0 top-0 h-0.5"
                            style={{ backgroundColor: color }}
                        />
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {s.label}
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    {pct}% dari total aset
                                </p>
                            </div>
                            <span
                                className="font-mono text-lg font-bold tabular-nums"
                                style={{ color }}
                            >
                                {s.count}
                            </span>
                        </div>
                        <dl className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-[11px] text-muted-foreground">
                                    Nilai Perolehan
                                </dt>
                                <dd className="font-mono text-xs font-semibold text-foreground tabular-nums">
                                    {formatter.format(parseFloat(s.value))}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-[11px] text-muted-foreground">
                                    Nilai Buku
                                </dt>
                                <dd className="font-mono text-xs font-semibold text-foreground tabular-nums">
                                    {formatter.format(parseFloat(s.book_value))}
                                </dd>
                            </div>
                        </dl>
                    </li>
                );
            })}
        </ul>
    );
}

function ClassificationBars({ slices }: { slices: ClassificationSlice[] }) {
    const max = Math.max(1, ...slices.map((s) => s.count));

    if (slices.length === 0) {
        return (
            <EmptyState
                icon={Layers}
                title="Belum ada klasifikasi"
                description="Buat Golongan untuk mulai mengelompokkan aset."
            />
        );
    }

    const COLORS = ['#0d5c56', '#0e7490', '#b45309', '#1d6a9f', '#475569'];

    return (
        <ul className="flex flex-col gap-3">
            {slices.map((s, i) => {
                const pct = Math.round((s.count / max) * 100);
                const color = COLORS[i % COLORS.length];

                return (
                    <li
                        key={s.name}
                        className="group flex items-center gap-3 text-sm"
                    >
                        <span className="w-28 shrink-0 truncate font-medium text-foreground">
                            {s.name}
                        </span>
                        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                                style={{
                                    width: `${pct}%`,
                                    backgroundColor: color,
                                }}
                            />
                        </div>
                        <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                            {s.count} ({pct}%)
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

function LocationStack({ slices }: { slices: LocationSlice[] }) {
    const max = Math.max(1, ...slices.map((s) => s.count));

    if (slices.length === 0) {
        return (
            <EmptyState
                icon={MapPin}
                title="Belum ada lokasi"
                description="Tetapkan lokasi pada aset untuk melihat distribusinya."
            />
        );
    }

    return (
        <ul className="flex flex-col divide-y divide-border/40">
            {slices.map((s) => {
                const pct = Math.round((s.count / max) * 100);

                return (
                    <li
                        key={s.name}
                        className="flex items-center gap-3 py-2.5 text-sm"
                    >
                        <Building2 className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate font-medium">
                            {s.name}
                        </span>
                        <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted/50 sm:block">
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="w-8 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                            {s.count}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

function MiniLedger({
    rows,
    kind,
}: {
    rows: RecentTransfer[] | RecentDisposal[];
    kind: 'transfer' | 'disposal';
}) {
    if (rows.length === 0) {
        return (
            <EmptyState
                icon={Inbox}
                title={
                    kind === 'transfer'
                        ? 'Belum ada mutasi'
                        : 'Belum ada disposal'
                }
                description={
                    kind === 'transfer'
                        ? 'Mutasi yang disetujui akan muncul di sini.'
                        : 'Pengajuan disposal akan muncul di sini.'
                }
            />
        );
    }

    const accent = kind === 'transfer' ? '#0d5c56' : '#0e7490';

    return (
        <div className="flex flex-col">
            <div className="hidden grid-cols-12 gap-2 border-b border-border/60 px-2 pb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:grid">
                <span className="col-span-4">Kode</span>
                <span className="col-span-4">
                    {kind === 'transfer' ? 'Dari → Ke' : 'Alasan'}
                </span>
                <span className="col-span-2">Status</span>
                <span className="col-span-2 text-right">Tanggal</span>
            </div>
            {rows.map((r) => (
                <div
                    key={r.id}
                    className="grid grid-cols-1 gap-1 border-b border-border/40 px-2 py-2 text-sm last:border-b-0 sm:grid-cols-12 sm:items-center sm:gap-2"
                >
                    <span
                        className="font-mono text-xs font-semibold sm:col-span-4"
                        style={{ color: accent }}
                    >
                        {r.asset_kode}
                    </span>
                    <span className="text-xs text-muted-foreground sm:col-span-4">
                        {kind === 'transfer'
                            ? `${(r as RecentTransfer).from} → ${(r as RecentTransfer).to}`
                            : (r as RecentDisposal).reason}
                    </span>
                    <span className="sm:col-span-2">
                        <span
                            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1"
                            style={{
                                backgroundColor: `${accent}15`,
                                color: accent,
                                borderColor: `${accent}30`,
                            }}
                        >
                            {r.status}
                        </span>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums sm:col-span-2 sm:text-right">
                        {new Date(r.date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                        })}
                    </span>
                </div>
            ))}
        </div>
    );
}

function RecentActivity({
    transfers,
    disposals,
}: {
    transfers: RecentTransfer[];
    disposals: RecentDisposal[];
}) {
    const items = [
        ...transfers.map((t) => ({ ...t, type: 'mutasi' as const })),
        ...disposals.map((d) => ({ ...d, type: 'disposal' as const })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    if (items.length === 0) {
        return (
            <EmptyState
                icon={MoveRight}
                title="Belum ada aktivitas"
                description="Mutasi dan disposal terbaru akan muncul di sini."
            />
        );
    }

    return (
        <div className="flex flex-col">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="flex items-start gap-3 border-b border-border/40 py-2.5 text-sm last:border-b-0"
                >
                    <div
                        className={cn(
                            'mt-0.5 size-2 shrink-0 rounded-full',
                            item.type === 'mutasi'
                                ? 'bg-primary'
                                : 'bg-chart-2',
                        )}
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">
                            {item.asset_kode}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            {item.type === 'mutasi'
                                ? `${(item as RecentTransfer).from} → ${(item as RecentTransfer).to}`
                                : (item as RecentDisposal).reason}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/60 tabular-nums">
                            {new Date(item.date).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                    <span
                        className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold',
                            item.status === 'Disetujui'
                                ? 'bg-status-act-bg text-status-act-text'
                                : 'bg-status-rpr-bg text-status-rpr-text',
                        )}
                    >
                        {item.status}
                    </span>
                </div>
            ))}
        </div>
    );
}

function IntegrityRing({ score }: { score: number }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const good = score >= 95;
    const color = good ? '#0d5c56' : '#b45309';

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative size-32">
                <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        className="stroke-muted-foreground/20"
                        strokeWidth="8"
                    />
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">
                        {score}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        Kelengkapan
                    </span>
                </div>
            </div>
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1',
                    good
                        ? 'bg-status-act-bg text-status-act-text ring-status-act-border'
                        : 'bg-status-rpr-bg text-status-rpr-text ring-status-rpr-border',
                )}
            >
                <ShieldCheck className="size-3" />
                {good ? 'Target Tercapai' : 'Di Bawah Target'}
            </span>
        </div>
    );
}

export default function Dashboard() {
    const { auth } = usePage().props;
    const {
        stats,
        asset_by_classification,
        asset_by_type,
        asset_by_location,
        recent_transfers,
        recent_disposals,
        integrity_score,
        warranty_alerts,
    } = usePage().props as unknown as PageProps;
    const name = auth?.user?.name?.split(' ')[0] ?? 'User';

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <GreetingHeader name={name} score={integrity_score} />

                <KpiCards stats={stats} />

                {/* Row 2: Classification + Donut + Integrity */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <section className="glass-panel relative flex min-h-[280px] flex-col gap-4 rounded-2xl p-5 lg:col-span-2">
                        <header className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                                    FR-10.1
                                </p>
                                <h3 className="mt-1 text-base font-semibold">
                                    Aset per Klasifikasi
                                </h3>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-status-act-bg px-2 py-1 text-[11px] font-semibold text-status-act-text ring-1 ring-status-act-border">
                                <ShieldCheck className="size-3" />
                                {integrity_score >= 95
                                    ? 'Target Tercapai'
                                    : 'Di Bawah Target'}
                            </span>
                        </header>
                        <ClassificationBars slices={asset_by_classification} />
                    </section>
                    <div className="flex flex-col gap-5">
                        <section className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
                            <header>
                                <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                                    FR-13.8
                                </p>
                                <h3 className="mt-1 text-base font-semibold">
                                    Aset per Tipe
                                </h3>
                            </header>
                            <AssetTypeBreakdown slices={asset_by_type} />
                        </section>
                        <section className="glass-panel flex flex-col items-center gap-4 rounded-2xl p-5">
                            <header className="w-full">
                                <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                                    FR-10.2
                                </p>
                                <h3 className="mt-1 text-base font-semibold">
                                    Skor Integritas
                                </h3>
                            </header>
                            <IntegrityRing score={integrity_score} />
                        </section>
                        <section className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
                            <StatusDonut stats={stats} />
                        </section>
                    </div>
                </div>

                {/* Row 3: Location + Activity + Warranty */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <section className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
                        <header className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                                    FR-10.3
                                </p>
                                <h3 className="mt-1 text-base font-semibold">
                                    Aset per Lokasi
                                </h3>
                            </div>
                            <BarChart3 className="size-4 text-muted-foreground" />
                        </header>
                        <LocationStack slices={asset_by_location} />
                    </section>

                    <section className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
                        <header className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                                    FR-10.6
                                </p>
                                <h3 className="mt-1 text-base font-semibold">
                                    Aktivitas Terkini
                                </h3>
                            </div>
                            <MoveRight className="size-4 text-muted-foreground" />
                        </header>
                        <RecentActivity
                            transfers={recent_transfers}
                            disposals={recent_disposals}
                        />
                    </section>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <section className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
                        <header className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                                    FR-10.5
                                </p>
                                <h3 className="mt-1 text-base font-semibold">
                                    Disposal Terkini
                                </h3>
                            </div>
                            <Trash2 className="size-4 text-muted-foreground" />
                        </header>
                        <MiniLedger rows={recent_disposals} kind="disposal" />
                    </section>

                    <section className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
                        <header className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                                    Peringatan
                                </p>
                                <h3 className="mt-1 text-base font-semibold">
                                    Garansi & Risiko
                                </h3>
                            </div>
                            <AlertTriangle className="size-4 text-muted-foreground" />
                        </header>
                        <WarrantyAlerts alerts={warranty_alerts} />
                    </section>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
