import { Head, usePage } from '@inertiajs/react';
import {
    Building2,
    Check,
    Clock,
    Inbox,
    Layers,
    MoveRight,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes/tenant';

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

type ClassificationSlice = {
    name: string;
    count: number;
    tipe?: string | null;
};

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

const BLN = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
];

const fd = (iso: string) => {
    if (!iso) return '—';
    const p = iso.split('-');
    return `${+p[2]} ${BLN[+p[1] - 1]} ${p[0]}`;
};

const num = (n: number) => Math.round(n).toLocaleString('id-ID');

const STATUS_BADGE: Record<
    string,
    { color: string; bg: string; ring: string }
> = {
    Aktif: {
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        ring: 'ring-emerald-500/30',
    },
    Dipinjamkan: {
        color: 'text-[#2D82B7] dark:text-sky-300',
        bg: 'bg-[#2D82B7]/10 dark:bg-[#2D82B7]/20',
        ring: 'ring-[#2D82B7]/30',
    },
    'Dalam Perbaikan': {
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        ring: 'ring-amber-500/30',
    },
    Dimutasi: {
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        ring: 'ring-purple-500/30',
    },
    Dihapus: {
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        ring: 'ring-rose-500/30',
    },
};

const STATUS_ICON: Record<string, typeof Check> = {
    Aktif: Check,
    Dipinjamkan: Inbox,
    'Dalam Perbaikan': Clock,
    Dimutasi: MoveRight,
    Dihapus: Trash2,
};

function KpiCard({
    label,
    value,
    sub,
    icon: Icon,
    gradient,
    ringColor,
    iconColor,
}: {
    label: string;
    value: number | string;
    sub: string;
    icon: typeof Check;
    gradient: string;
    ringColor: string;
    iconColor: string;
}) {
    return (
        <div
            className={cn(
                'group relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-300',
                'bg-white/90 backdrop-blur-xl dark:bg-slate-900/90',
                'border border-slate-200/80 dark:border-slate-800/80',
                'shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_12px_rgba(0,0,0,0.04)]',
                'dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_6px_20px_rgba(0,0,0,0.3)]',
                'hover:-translate-y-1 hover:border-[#2D82B7]/40',
                'hover:shadow-[0_12px_28px_-6px_rgba(45,130,183,0.22)]',
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    {label}
                </p>
                <div
                    className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 transition-transform duration-300 group-hover:scale-110',
                        gradient,
                        ringColor,
                    )}
                >
                    <Icon className={cn('size-4.5', iconColor)} />
                </div>
            </div>

            <div className="mt-3">
                <p className="font-heading text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                    {num(typeof value === 'number' ? value : 0)}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {sub}
                </p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const style = STATUS_BADGE[status] ?? {
        color: 'text-slate-600 dark:text-slate-300',
        bg: 'bg-slate-100 dark:bg-slate-800',
        ring: 'ring-slate-300 dark:ring-slate-700',
    };
    const Icon = STATUS_ICON[status] ?? Check;

    return (
        <Badge
            variant="outline"
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border-0 px-2.5 py-0.5 text-[11px] font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1',
                style.color,
                style.bg,
                style.ring,
            )}
        >
            <Icon className="size-3" />
            {status}
        </Badge>
    );
}

function KpiRow({ stats }: { stats: Stats }) {
    const cnt = (s: keyof AssetByStatus) => stats.asset_by_status[s];
    const kpis = [
        {
            label: 'Total Aset',
            value: stats.total_assets,
            sub: 'Seluruh aset tercatat',
            icon: Building2,
            gradient: 'from-[#2D82B7]/20 to-[#2D82B7]/5',
            ringColor: 'ring-[#2D82B7]/20',
            iconColor: 'text-[#2D82B7] dark:text-sky-300',
        },
        {
            label: 'Aset Aktif',
            value: cnt('ACT'),
            sub: `${Math.round((cnt('ACT') / (stats.total_assets || 1)) * 100)}% dari total`,
            icon: Check,
            gradient: 'from-emerald-500/20 to-emerald-500/5',
            ringColor: 'ring-emerald-500/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Dipinjamkan',
            value: cnt('LOAN'),
            sub: 'di 2 departemen',
            icon: Inbox,
            gradient: 'from-sky-500/20 to-sky-500/5',
            ringColor: 'ring-sky-500/20',
            iconColor: 'text-sky-600 dark:text-sky-400',
        },
        {
            label: 'Dalam Perbaikan',
            value: cnt('RPR'),
            sub: '1 unit proyektor',
            icon: Clock,
            gradient: 'from-amber-500/20 to-amber-500/5',
            ringColor: 'ring-amber-500/20',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'Disposal Diajukan',
            value: stats.pending_disposals,
            sub: `${stats.pending_disposals > 0 ? stats.pending_disposals : 0} disetujui (YTD)`,
            icon: Trash2,
            gradient: 'from-rose-500/20 to-rose-500/5',
            ringColor: 'ring-rose-500/20',
            iconColor: 'text-rose-600 dark:text-rose-400',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {kpis.map((k) => (
                <KpiCard key={k.label} {...k} />
            ))}
        </div>
    );
}

function TypeBreakdownCard({ slices }: { slices: AssetTypeSlice[] }) {
    const at = slices.filter((s) => s.type === 'Aktiva Tetap');
    const pr = slices.filter((s) => s.type === 'Peralatan');
    const sumAt = at.reduce(
        (acc, s) => acc + Number(s.value.replace(/[^0-9]/g, '')),
        0,
    );
    const sumPr = pr.reduce(
        (acc, s) => acc + Number(s.value.replace(/[^0-9]/g, '')),
        0,
    );
    const sumBook = at.reduce(
        (acc, s) => acc + Number(s.book_value.replace(/[^0-9]/g, '')),
        0,
    );
    const totalCount = slices.reduce((a, s) => a + s.count, 0) || 1;
    const pctAt = Math.round(
        (at.reduce((a, s) => a + s.count, 0) / totalCount) * 100,
    );

    return (
        <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)]">
            <CardHeader className="p-3.5 pb-2">
                <CardTitle className="font-heading text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Breakdown Tipe Aset
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    FR-13.8 · Ambang batas:{' '}
                    <span className="font-bold text-[#2D82B7] dark:text-sky-300">
                        Rp10.000.000
                    </span>
                </CardDescription>
            </CardHeader>

            <CardContent className="p-3.5 pt-0">
                {/* Soft Inset Multi-segment Bar */}
                <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] dark:bg-slate-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2D82B7] to-[#2571A1] shadow-[0_2px_8px_rgba(45,130,183,0.4)] transition-all duration-500"
                        style={{ width: `${pctAt}%` }}
                    />
                    <div className="h-full flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="space-y-3.5">
                    {/* Aktiva Tetap Section */}
                    <div className="rounded-xl bg-slate-50/70 p-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:bg-slate-800/50 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2D82B7]/20 to-[#2D82B7]/5 text-[#2D82B7] ring-1 ring-[#2D82B7]/20 dark:from-[#2D82B7]/30 dark:to-[#2D82B7]/10 dark:text-sky-300">
                                <Building2 className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    Aktiva Tetap
                                </p>
                                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                    {at.reduce((a, s) => a + s.count, 0)} unit (
                                    {pctAt}%)
                                </p>
                            </div>
                        </div>

                        <div className="mt-2.5 space-y-1 text-[11px] font-semibold">
                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Nilai perolehan</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                    Rp {num(sumAt)}
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Total nilai buku</span>
                                <span className="font-mono font-extrabold text-[#2D82B7] dark:text-sky-300">
                                    Rp {num(sumBook)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Peralatan Section */}
                    <div className="rounded-xl bg-slate-50/70 p-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:bg-slate-800/50 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-200/80 text-slate-500 ring-1 ring-slate-300/50 dark:bg-slate-700/60 dark:text-slate-400 dark:ring-slate-600/50">
                                <Layers className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    Peralatan
                                </p>
                                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                    {pr.reduce((a, s) => a + s.count, 0)} unit
                                </p>
                            </div>
                        </div>

                        <div className="mt-2.5 space-y-1 text-[11px] font-semibold">
                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Total nilai perolehan</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                    Rp {num(sumPr)}
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-400 dark:text-slate-500">
                                <span>Data akuntansi</span>
                                <span className="font-mono italic">
                                    tidak berlaku
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusDonutCard({ stats }: { stats: Stats }) {
    const data = Object.entries(stats.asset_by_status)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
            key,
            name:
                key === 'ACT'
                    ? 'Aktif'
                    : key === 'LOAN'
                      ? 'Dipinjamkan'
                      : key === 'RPR'
                        ? 'Dalam Perbaikan'
                        : key === 'MUT'
                          ? 'Dimutasi'
                          : 'Dihapus',
            value,
        }));

    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const C = 2 * Math.PI * 50;
    let offset = 0;

    const STATUS_COLORS: Record<string, string> = {
        Aktif: '#34D399',
        Dipinjamkan: '#38BDF8',
        'Dalam Perbaikan': '#FBBF24',
        Dimutasi: '#A78BFA',
        Dihapus: '#FB7185',
    };

    const SEGMENTS = [
        { key: 'Aktif', color: '#34D399' },
        { key: 'Dipinjamkan', color: '#38BDF8' },
        { key: 'Dalam Perbaikan', color: '#FBBF24' },
        { key: 'Dimutasi', color: '#A78BFA' },
        { key: 'Dihapus', color: '#FB7185' },
    ];

    return (
        <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)]">
            <CardHeader className="p-3.5 pb-2">
                <CardTitle className="font-heading text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Distribusi Status
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Siklus hidup aset (ACT · LOAN · RPR · MUT · DSP)
                </CardDescription>
            </CardHeader>

            <CardContent className="p-3.5 pt-1">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="relative flex size-36 shrink-0 items-center justify-center">
                        <svg width="140" height="140" viewBox="0 0 140 140">
                            {SEGMENTS.map((seg) => {
                                const d = data.find((x) => x.name === seg.key);
                                const n = d?.value ?? 0;

                                if (n === 0) return null;

                                const f = n / total;
                                const dash = `${Math.max(f * C - 3, 1)} ${C}`;
                                const currentOffset = offset;
                                offset += f;

                                return (
                                    <circle
                                        key={seg.key}
                                        cx="70"
                                        cy="70"
                                        r="50"
                                        fill="none"
                                        stroke={seg.color}
                                        strokeWidth="14"
                                        strokeLinecap="round"
                                        strokeDasharray={dash}
                                        transform={`rotate(${-90 + currentOffset * 360} 70 70)`}
                                        className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-all duration-500"
                                    />
                                );
                            })}
                            <text
                                x="70"
                                y="66"
                                textAnchor="middle"
                                className="fill-slate-800 font-heading text-2xl font-extrabold dark:fill-slate-100"
                            >
                                {total}
                            </text>
                            <text
                                x="70"
                                y="84"
                                textAnchor="middle"
                                className="fill-slate-400 text-[10px] font-bold tracking-wider uppercase dark:fill-slate-500"
                            >
                                Aset Tercatat
                            </text>
                        </svg>
                    </div>

                    <div className="w-full flex-1 space-y-2">
                        {data.map((d) => (
                            <div
                                key={d.key}
                                className="flex items-center gap-2.5 rounded-xl bg-slate-50/60 p-2 text-xs font-bold dark:bg-slate-800/40"
                            >
                                <span
                                    className="size-2.5 shrink-0 rounded-full shadow-[0_0_6px_rgba(0,0,0,0.2)]"
                                    style={{
                                        backgroundColor:
                                            STATUS_COLORS[d.name] || '#2D82B7',
                                    }}
                                />
                                <span className="text-slate-600 dark:text-slate-300">
                                    {d.name}
                                </span>
                                <span className="ml-auto font-mono text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                    {d.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ClassificationBarsCard({
    slices,
    className,
}: {
    slices: ClassificationSlice[];
    className?: string;
}) {
    const gc: Record<string, number> = {};
    slices.forEach((s) => {
        gc[s.name] = (gc[s.name] ?? 0) + s.count;
    });
    const entries = Object.entries(gc).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(([, c]) => c), 1);

    return (
        <Card
            className={cn(
                'overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)]',
                className,
            )}
        >
            <CardHeader className="p-3.5 pb-2">
                <CardTitle className="font-heading text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Aset per Klasifikasi
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Struktur Group › Category › Cluster › Sub-cluster
                </CardDescription>
            </CardHeader>

            <CardContent className="p-3.5 pt-1">
                <div className="space-y-3">
                    {entries.map(([group, count]) => (
                        <div key={group} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-700 dark:text-slate-200">
                                    {group}
                                </span>
                                <span className="font-mono text-xs font-extrabold text-[#2D82B7] dark:text-sky-300">
                                    {count} aset
                                </span>
                            </div>

                            {/* Soft Inset Bar */}
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#2D82B7] to-[#2571A1] shadow-[0_2px_8px_rgba(45,130,183,0.35)] transition-all duration-500"
                                    style={{ width: `${(count / max) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ActivityTimeline({
    transfers,
    disposals,
    className,
}: {
    transfers: RecentTransfer[];
    disposals: RecentDisposal[];
    className?: string;
}) {
    const items = [
        ...transfers.map((t) => ({ ...t, type: 'mutasi' as const })),
        ...disposals.map((d) => ({ ...d, type: 'disposal' as const })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
        <Card
            className={cn(
                'overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)]',
                className,
            )}
        >
            <CardHeader className="p-3.5 pb-2">
                <CardTitle className="font-heading text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Aktivitas Terbaru
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Audit trail — siapa, kapan, apa yang berubah
                </CardDescription>
            </CardHeader>

            <CardContent className="p-3.5 pt-2">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-xs font-bold text-slate-400 dark:text-slate-500">
                        Belum ada aktivitas terbaru
                    </div>
                ) : (
                    <div className="relative pl-3">
                        {/* Fading Vertical Line */}
                        <div className="absolute top-3 bottom-3 left-4 w-0.5 bg-gradient-to-b from-slate-200 via-slate-200 to-transparent dark:from-slate-800 dark:via-slate-800" />

                        <div className="space-y-4">
                            {items.map((item) => {
                                const isApproved = item.status === 'Disetujui';

                                return (
                                    <div
                                        key={item.id}
                                        className="group relative flex items-start gap-3 transition-transform duration-200 hover:translate-x-0.5"
                                    >
                                        {/* Soft Node Badge */}
                                        <div
                                            className={cn(
                                                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-xl ring-2 ring-white transition-transform duration-300 group-hover:scale-110 dark:ring-slate-900',
                                                isApproved
                                                    ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400'
                                                    : 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
                                            )}
                                        >
                                            <Check className="size-3.5" />
                                        </div>

                                        <div className="min-w-0 flex-1 rounded-xl bg-slate-50/60 p-2.5 dark:bg-slate-800/40">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                                    {item.asset_kode} —{' '}
                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                                                        {item.type === 'mutasi'
                                                            ? 'Mutasi diajukan'
                                                            : 'Disposal diajukan'}
                                                    </span>
                                                </p>
                                                <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-400 shadow-sm dark:bg-slate-800 dark:text-slate-500">
                                                    {new Date(
                                                        item.date,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: '2-digit',
                                                            month: 'short',
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                {item.type === 'mutasi'
                                                    ? `${(item as RecentTransfer).from} → ${(item as RecentTransfer).to}`
                                                    : (item as RecentDisposal)
                                                          .reason}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function PendingMutasiTable({ transfers }: { transfers: RecentTransfer[] }) {
    const pending = transfers.filter((m) => m.status === 'Menunggu');

    return (
        <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)]">
            <CardHeader className="p-3.5 pb-2">
                <CardTitle className="font-heading text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Pengajuan Mutasi Menunggu Persetujuan
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Lokasi aset diperbarui otomatis setelah disetujui (FR-06.5)
                </CardDescription>
            </CardHeader>

            <CardContent className="p-3.5 pt-1">
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/50">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-100/60 dark:border-slate-800/80 dark:bg-slate-800/60">
                                    <th className="px-3 py-2.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        ID
                                    </th>
                                    <th className="px-3 py-2.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Aset
                                    </th>
                                    <th className="px-3 py-2.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Asal → Tujuan
                                    </th>
                                    <th className="px-3 py-2.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Tanggal
                                    </th>
                                    <th className="px-3 py-2.5 text-right text-[10px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                                {pending.length > 0 ? (
                                    pending.map((m) => (
                                        <tr
                                            key={m.id}
                                            className="transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                                        >
                                            <td className="px-3 py-2.5 font-mono font-bold text-slate-500 dark:text-slate-400">
                                                {m.id}
                                            </td>
                                            <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100">
                                                {m.asset_kode}
                                            </td>
                                            <td className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300">
                                                {m.from}{' '}
                                                <span className="font-bold text-[#2D82B7] dark:text-sky-300">
                                                    →
                                                </span>{' '}
                                                {m.to}
                                            </td>
                                            <td className="px-3 py-2.5 font-semibold text-slate-400 dark:text-slate-500">
                                                {fd(m.date)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-500/20 hover:text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                        onClick={() => {
                                                            // approve
                                                        }}
                                                    >
                                                        <Check className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 rounded-lg bg-rose-500/10 text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-500/20 hover:text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                                                        onClick={() => {
                                                            // reject
                                                        }}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-6 text-center text-xs font-bold text-slate-400 dark:text-slate-500"
                                        >
                                            Tidak ada pengajuan menunggu ✓
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const { auth } = usePage().props;
    const {
        stats,
        asset_by_classification,
        asset_by_type,
        recent_transfers,
        recent_disposals,
    } = usePage().props as unknown as PageProps;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                {/* KPI Metrics Row */}
                <KpiRow stats={stats} />

                {/* Main Visualizations Grid */}
                <div className="grid gap-5 md:grid-cols-3">
                    <TypeBreakdownCard slices={asset_by_type} />
                    <StatusDonutCard stats={stats} />
                    <ClassificationBarsCard
                        slices={asset_by_classification}
                        className="md:col-span-2 lg:col-span-1"
                    />
                </div>

                {/* Timeline & Action Table Grid */}
                <div className="grid gap-5 md:grid-cols-3">
                    <ActivityTimeline
                        transfers={recent_transfers}
                        disposals={recent_disposals}
                        className="md:col-span-2"
                    />
                    <PendingMutasiTable transfers={recent_transfers} />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (props: { tenant: { code: string } }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard({ tenant: props.tenant.code }).url,
        },
    ],
});
